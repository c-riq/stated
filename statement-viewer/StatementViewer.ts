import { sha256, verifySignature, parseSignedStatement, parseStatementsFile as parseStatementsFileLib, parseVote, parseStatement as parseStatementLib, parseResponseContent, parseOrganisationVerification } from './lib/index.js';
import { ParsedStatement, VoteEntry, Identity } from './types.js';
import { sortStatementsByTime } from './utils.js';
import { createStatementCard, createVotesContainer, createResponsesContainer, renderStatementDetails } from './renderers.js';

export class StatementViewer {
    private baseUrl: string;
    private statements: ParsedStatement[];
    private peerStatements: ParsedStatement[];
    private statementsByHash: Map<string, ParsedStatement>;
    private responsesByHash: Map<string, ParsedStatement[]>;
    private votesByPollHash: Map<string, VoteEntry[]>;
    private expandedStatements: Set<string>;
    private identities: Map<string, Identity>;

    constructor() {
        this.baseUrl = '';
        this.statements = [];
        this.peerStatements = [];
        this.statementsByHash = new Map();
        this.responsesByHash = new Map();
        this.votesByPollHash = new Map();
        this.expandedStatements = new Set();
        this.identities = new Map();
        this.init();
    }

    private init(): void {
        const loadButton = document.getElementById('loadStatements');
        if (loadButton) {
            loadButton.addEventListener('click', () => this.loadStatements());
        }
        
        const modal = document.getElementById('statementModal');
        const closeBtn = document.querySelector('.modal-close');
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
            });
        }
        
        window.addEventListener('click', (e: MouseEvent) => {
            if (e.target === modal && modal) {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
            }
        });
        
        const urlParams = new URLSearchParams(window.location.search);
        const baseUrl = urlParams.get('baseUrl');
        const baseUrlInput = document.getElementById('baseUrl') as HTMLInputElement;
        
        if (baseUrl && baseUrlInput) {
            baseUrlInput.value = baseUrl;
            this.loadStatements();
        } else if (baseUrlInput) {
            const defaultUrl = `${window.location.origin}/.well-known/statements/`;
            baseUrlInput.value = defaultUrl;
            this.loadStatements();
        }
    }

    private showLoading(show: boolean): void {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    private showError(message: string | null): void {
        const errorDiv = document.getElementById('error');
        if (!errorDiv) return;
        if (message) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        } else {
            errorDiv.style.display = 'none';
        }
    }

    private async loadStatements(): Promise<void> {
        const baseUrlInput = document.getElementById('baseUrl') as HTMLInputElement;
        if (!baseUrlInput) return;
        
        this.baseUrl = baseUrlInput.value.trim();
        
        if (!this.baseUrl) {
            this.showError('Please enter a base URL');
            return;
        }

        if (!this.baseUrl.endsWith('/')) {
            this.baseUrl += '/';
        }

        this.statements = [];
        this.peerStatements = [];
        this.statementsByHash.clear();
        this.responsesByHash.clear();
        this.votesByPollHash.clear();
        this.identities.clear();

        this.showLoading(true);
        this.showError(null);
        const statementsListElement = document.getElementById('statementsList');
        if (statementsListElement) {
            statementsListElement.innerHTML = '';
        }

        try {
            const statementsUrl = this.baseUrl.replace('/statements/', '/statements.txt');
            const response = await fetch(statementsUrl);
            
            if (response.ok) {
                const text = await response.text();
                this.parseStatementsFile(text);
            } else {
                await this.loadFromIndex();
            }
            
            await this.loadPeerStatements();
        } catch (error: any) {
            this.showError(`Error loading statements: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    private async loadFromIndex(): Promise<void> {
        try {
            const indexUrl = this.baseUrl + 'index.txt';
            const response = await fetch(indexUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to load index.txt: ${response.status} ${response.statusText}`);
            }

            const indexText = await response.text();
            const filenames = indexText.split('\n').filter(line => line.trim());

            if (filenames.length === 0) {
                this.showError('No statements found in index.txt');
                return;
            }

            const statements = [];
            for (const filename of filenames) {
                try {
                    const statementUrl = this.baseUrl + filename.trim();
                    const statementResponse = await fetch(statementUrl);
                    if (statementResponse.ok) {
                        const statementText = await statementResponse.text();
                        statements.push(statementText);
                    }
                } catch (error: any) {
                    console.error(`Error loading ${filename}:`, error);
                }
            }

            if (statements.length > 0) {
                this.parseStatementsFile(statements.join('\n\n'));
            } else {
                this.showError('No statements could be loaded');
            }
        } catch (error: any) {
            throw new Error(`Failed to load from index: ${error.message}`);
        }
    }

    private parseStatementsFile(text: string, isPeer: boolean = false): ParsedStatement[] | undefined {
        try {
            const statementTexts = parseStatementsFileLib(text);
            
            if (statementTexts.length === 0) {
                if (!isPeer) {
                    this.showError('No statements found in the file');
                }
                return [];
            }

            const statements: ParsedStatement[] = statementTexts.map((statementText: string) => {
                const parsed = parseStatementLib({ statement: statementText });
                return {
                    raw: statementText,
                    ...parsed,
                    time: parsed.time ? parsed.time.toISOString() : undefined
                } as ParsedStatement;
            });
            
            if (isPeer) {
                return statements;
            } else {
                this.statements = statements;
                
                this.statements.forEach((stmt: ParsedStatement) => {
                    const hash = sha256(stmt.raw);
                    this.statementsByHash.set(hash, stmt);
                });
                
                this.buildIdentityRegistry();
                this.buildVotesMap();
                
                this.verifyAllSignatures().then(() => {
                    this.linkSignaturesToIdentities();
                    this.renderStatements();
                });
            }
        } catch (error: any) {
            if (!isPeer) {
                this.showError(`Error parsing statements file: ${error.message}`);
            }
            return [];
        }
    }

    private async loadPeerStatements(): Promise<void> {
        try {
            const peersIndexUrl = this.baseUrl + 'peers/index.txt';
            const response = await fetch(peersIndexUrl);
            
            if (!response.ok) {
                return;
            }

            const indexText = await response.text();
            const peerDomains = indexText.split('\n').filter(line => line.trim());

            for (const peerDomain of peerDomains) {
                try {
                    const peerStatementsUrl = this.baseUrl + `peers/${peerDomain}/statements.txt`;
                    const peerResponse = await fetch(peerStatementsUrl);
                    
                    if (peerResponse.ok) {
                        const peerText = await peerResponse.text();
                        const peerStatements = this.parseStatementsFile(peerText, true);
                        if (!peerStatements) continue;
                        
                        peerStatements.forEach((stmt: ParsedStatement) => {
                            stmt.isPeer = true;
                            stmt.peerDomain = peerDomain;
                        });
                        
                        this.peerStatements.push(...peerStatements);
                    }
                } catch (error: any) {
                    console.error(`Error loading peer ${peerDomain}:`, error);
                }
            }

            await this.verifyPeerSignatures();
            this.buildResponseMap();
            this.buildVotesMap();
            this.renderStatements();
        } catch (error: any) {
            console.error('Error loading peer statements:', error);
        }
    }

    private buildResponseMap(): void {
        this.responsesByHash.clear();
        
        this.peerStatements.forEach((stmt: ParsedStatement) => {
            if (stmt.type && stmt.type.toLowerCase() === 'response') {
                try {
                    const responseData = parseResponseContent(stmt.content);
                    const referencedHash = responseData.hash;
                    if (!this.responsesByHash.has(referencedHash)) {
                        this.responsesByHash.set(referencedHash, []);
                    }
                    this.responsesByHash.get(referencedHash)!.push(stmt);
                } catch (error: any) {
                    console.error('Error parsing response:', error);
                }
            }
        });
    }

    private buildVotesMap(): void {
        this.votesByPollHash.clear();
        
        const allStatements: ParsedStatement[] = [...this.statements, ...this.peerStatements];
        
        allStatements.forEach((stmt: ParsedStatement) => {
            if (stmt.type && stmt.type.toLowerCase() === 'vote') {
                try {
                    const voteData = parseVote(stmt.content);
                    const pollHash = voteData.pollHash;
                    const vote = voteData.vote;
                    
                    if (!this.votesByPollHash.has(pollHash)) {
                        this.votesByPollHash.set(pollHash, []);
                    }
                    this.votesByPollHash.get(pollHash)!.push({
                        statement: stmt,
                        vote: vote,
                        voteData: voteData
                    });
                } catch (error: any) {
                    console.error('Error parsing vote:', error);
                }
            }
        });
    }
    private buildIdentityRegistry(): void {
        this.identities.clear();
        
        this.statements.forEach((stmt: ParsedStatement) => {
            if (stmt.type && stmt.type.toLowerCase() === 'organisation_verification') {
                try {
                    const verification = parseOrganisationVerification(stmt.content);
                    
                    // Check if this is a self-verification (domain === foreignDomain)
                    const isSelfVerified = verification.domain === verification.foreignDomain;
                    
                    if (isSelfVerified && verification.domain) {
                        const identity: Identity = {
                            domain: verification.domain,
                            author: verification.name,
                            publicKey: verification.publicKey,
                            profilePicture: verification.pictureHash,
                            verificationStatement: stmt,
                            isSelfVerified: true
                        };
                        
                        this.identities.set(verification.domain, identity);
                    }
                } catch (error: any) {
                    console.error('Error parsing organisation verification:', error);
                }
            }
        });
    }

    private linkSignaturesToIdentities(): void {
        this.statements.forEach((stmt: ParsedStatement) => {
            if (stmt.signature && stmt.domain) {
                try {
                    const parsed = parseSignedStatement(stmt.raw);
                    if (parsed) {
                        stmt.publicKey = parsed.publicKey;
                        
                        // Check if this public key matches a known identity
                        const identity = this.identities.get(stmt.domain);
                        if (identity && identity.publicKey === parsed.publicKey) {
                            // Signature matches the established identity
                            stmt.signatureVerified = stmt.signatureVerified && true;
                        }
                    }
                } catch (error: any) {
                    console.error('Error linking signature to identity:', error);
                }
            }
        });
        
        // Also link peer statements
        this.peerStatements.forEach((stmt: ParsedStatement) => {
            if (stmt.signature && stmt.domain) {
                try {
                    const parsed = parseSignedStatement(stmt.raw);
                    if (parsed) {
                        stmt.publicKey = parsed.publicKey;
                    }
                } catch (error: any) {
                    console.error('Error linking peer signature to identity:', error);
                }
            }
        });
    }


    private async verifyPeerSignatures(): Promise<void> {
        const verificationPromises = this.peerStatements.map(async (statement) => {
            if (statement.signature) {
                try {
                    const parsed = parseSignedStatement(statement.raw);
                    if (!parsed) {
                        statement.signatureVerified = false;
                        statement.hashMatches = false;
                        return;
                    }
                    
                    statement.hashMatches = true;
                    const signatureValid = await verifySignature(
                        parsed.statement,
                        parsed.signature,
                        parsed.publicKey
                    );
                    statement.signatureVerified = signatureValid;
                } catch (error: any) {
                    console.error('Error verifying peer signature:', error);
                    statement.signatureVerified = false;
                    statement.hashMatches = false;
                }
            }
        });
        
        await Promise.all(verificationPromises);
    }

    private async verifyAllSignatures(): Promise<void> {
        const verificationPromises = this.statements.map(async (statement) => {
            if (statement.signature) {
                try {
                    const parsed = parseSignedStatement(statement.raw);
                    
                    if (!parsed) {
                        statement.signatureVerified = false;
                        statement.hashMatches = false;
                        return;
                    }
                    
                    statement.hashMatches = true;
                    
                    const signatureValid = await verifySignature(
                        parsed.statement,
                        parsed.signature,
                        parsed.publicKey
                    );
                    
                    statement.signatureVerified = signatureValid;
                } catch (error: any) {
                    console.error('Error verifying signature:', error);
                    statement.signatureVerified = false;
                    statement.hashMatches = false;
                }
            }
        });
        
        await Promise.all(verificationPromises);
    }

    private renderStatements(): void {
        const container = document.getElementById('statementsList');
        if (!container) return;
        
        container.innerHTML = '';

        if (this.statements.length === 0) {
            container.innerHTML = '<p>No statements to display</p>';
            return;
        }

        const aggregatedVoteHashes = new Set<string>();
        this.statements.forEach((statement: ParsedStatement) => {
            if (statement.type && statement.type.toLowerCase() === 'poll') {
                const statementHash = sha256(statement.raw);
                const votes = this.votesByPollHash.get(statementHash);
                if (votes && votes.length > 0) {
                    votes.forEach(({ statement: voteStatement }: VoteEntry) => {
                        const voteHash = sha256(voteStatement.raw);
                        aggregatedVoteHashes.add(voteHash);
                    });
                }
            }
        });

        const sortedStatements = sortStatementsByTime(this.statements);

        sortedStatements.forEach((statement: ParsedStatement) => {
            const statementHash = sha256(statement.raw);
            
            if (statement.type && statement.type.toLowerCase() === 'vote' && aggregatedVoteHashes.has(statementHash)) {
                return;
            }
            
            const identity = statement.domain ? this.identities.get(statement.domain) : undefined;
            const card = createStatementCard(statement, this.baseUrl, identity, (stmt) => this.showStatementDetails(stmt));
            container.appendChild(card);
            
            if (statement.type && statement.type.toLowerCase() === 'poll') {
                const votes = this.votesByPollHash.get(statementHash);
                if (votes && votes.length > 0) {
                    const votesContainer = createVotesContainer(statement, votes, this.identities, (stmt) => this.showStatementDetails(stmt));
                    container.appendChild(votesContainer);
                }
            }
            
            const responses = this.responsesByHash.get(statementHash);
            if (responses && responses.length > 0) {
                const responsesContainer = createResponsesContainer(responses, (stmt) => this.showStatementDetails(stmt));
                container.appendChild(responsesContainer);
            }
        });
    }

    private async showStatementDetails(statement: ParsedStatement): Promise<void> {
        const modal = document.getElementById('statementModal');
        const modalBody = document.getElementById('modalBody');
        if (!modal || !modalBody) return;
        
        document.body.classList.add('modal-open');
        
        const html = await renderStatementDetails(statement, this.baseUrl, this.statementsByHash);
        modalBody.innerHTML = html;
        
        modal.style.display = 'block';
    }
}