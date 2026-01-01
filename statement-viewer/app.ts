import { sha256, verifySignature, parseSignedStatement, parseStatementsFile as parseStatementsFileLib, parseVote, parsePoll, parseStatement as parseStatementLib, parseResponseContent } from './lib/index.js';

interface ParsedStatement {
    raw: string;
    domain?: string;
    author?: string;
    time?: string;
    tags?: string[];
    content: string;
    type?: string;
    signature?: string;
    formatVersion?: string;
    attachments?: string[];
    supersededStatement?: string;
    translations?: Record<string, string>;
    signatureVerified?: boolean;
    hashMatches?: boolean;
    isPeer?: boolean;
    peerDomain?: string;
}

interface VoteEntry {
    statement: ParsedStatement;
    vote: string;
    voteData: any;
}

interface SignatureInfo {
    algorithm: string;
    publicKey: string;
    hash: string;
    signature: string;
}

class StatementViewer {
    private baseUrl: string;
    private statements: ParsedStatement[];
    private peerStatements: ParsedStatement[];
    private statementsByHash: Map<string, ParsedStatement>;
    private responsesByHash: Map<string, ParsedStatement[]>;
    private votesByPollHash: Map<string, VoteEntry[]>;
    private expandedStatements: Set<string>;

    constructor() {
        this.baseUrl = '';
        this.statements = [];
        this.peerStatements = [];
        this.statementsByHash = new Map();
        this.responsesByHash = new Map();
        this.votesByPollHash = new Map();
        this.expandedStatements = new Set();
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
            // Auto-load from current origin
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

        this.showLoading(true);
        this.showError(null);
        const statementsListElement = document.getElementById('statementsList');
        if (statementsListElement) {
            statementsListElement.innerHTML = '';
        }

        try {
            // Try to load statements.txt first (all statements concatenated)
            const statementsUrl = this.baseUrl.replace('/statements/', '/statements.txt');
            const response = await fetch(statementsUrl);
            
            if (response.ok) {
                const text = await response.text();
                this.parseStatementsFile(text);
            } else {
                // Fall back to loading individual statements from index.txt
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
            // Use the library's parseStatementsFile function to properly split statements
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
                
                // Build hash map for main statements
                this.statements.forEach((stmt: ParsedStatement) => {
                    const hash = sha256(stmt.raw);
                    this.statementsByHash.set(hash, stmt);
                });
                
                // Build votes map
                this.buildVotesMap();
                
                // Verify signatures for all statements
                this.verifyAllSignatures().then(() => {
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
                        
                        // Mark statements as from peer
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
        
        // Check both main statements and peer statements for votes
        const allStatements: ParsedStatement[] = [...this.statements, ...this.peerStatements];
        
        allStatements.forEach((stmt: ParsedStatement) => {
            // Check if this is a vote statement
            if (stmt.type && stmt.type.toLowerCase() === 'vote') {
                try {
                    // Parse the vote data from the content using the library's parseVote
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
                    // Use parseSignedStatement to properly parse and verify
                    const parsed = parseSignedStatement(statement.raw);
                    
                    if (!parsed) {
                        // Parsing failed (hash mismatch or invalid format)
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

        // Build a set of vote statement hashes that are aggregated into polls
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

        // Sort statements by time (newest first)
        const sortedStatements = [...this.statements].sort((a: ParsedStatement, b: ParsedStatement) => {
            const timeA = new Date(a.time || 0);
            const timeB = new Date(b.time || 0);
            return timeB.getTime() - timeA.getTime();
        });

        sortedStatements.forEach((statement: ParsedStatement) => {
            const statementHash = sha256(statement.raw);
            
            // Skip vote statements that are aggregated into polls
            if (statement.type && statement.type.toLowerCase() === 'vote' && aggregatedVoteHashes.has(statementHash)) {
                return;
            }
            
            const card = this.createStatementCard(statement);
            container.appendChild(card);
            
            // Add votes if this is a poll
            if (statement.type && statement.type.toLowerCase() === 'poll') {
                const votes = this.votesByPollHash.get(statementHash);
                if (votes && votes.length > 0) {
                    const votesContainer = this.createVotesContainer(statement, votes);
                    container.appendChild(votesContainer);
                }
            }
            
            // Add responses if any
            const responses = this.responsesByHash.get(statementHash);
            if (responses && responses.length > 0) {
                const responsesContainer = this.createResponsesContainer(responses);
                container.appendChild(responsesContainer);
            }
        });
    }

    private createStatementCard(statement: ParsedStatement): HTMLDivElement {
        const card = document.createElement('div');
        card.className = 'statement-card';

        // Compact header
        const header = document.createElement('div');
        header.className = 'statement-header';

        const authorInfo = document.createElement('div');
        authorInfo.className = 'author-info';
        
        const authorName = document.createElement('div');
        authorName.className = 'author-name';
        authorName.textContent = statement.author || statement.domain || 'Unknown';
        authorInfo.appendChild(authorName);
        
        const domainTime = document.createElement('div');
        domainTime.className = 'domain-time';
        const domain = statement.domain || 'Unknown domain';
        const timeAgo = this.getTimeAgo(new Date(statement.time || 0));
        domainTime.textContent = `@${domain} · ${timeAgo}`;
        authorInfo.appendChild(domainTime);
        
        header.appendChild(authorInfo);

        // Verification badge
        if (statement.signature) {
            const verifyBadge = document.createElement('div');
            verifyBadge.className = statement.signatureVerified ? 'verify-badge verified' : 'verify-badge unverified';
            verifyBadge.textContent = statement.signatureVerified ? '✓' : '✗';
            verifyBadge.title = statement.signatureVerified ? 'Verified signature' : 'Invalid signature';
            header.appendChild(verifyBadge);
        }

        card.appendChild(header);

        // Content
        const content = document.createElement('div');
        content.className = 'statement-content';
        content.textContent = statement.content;
        card.appendChild(content);

        // Attachments (images and PDFs)
        if (statement.attachments && statement.attachments.length > 0) {
            const attachmentsContainer = document.createElement('div');
            attachmentsContainer.className = 'statement-attachments';
            
            statement.attachments.forEach((attachment: string) => {
                const attachmentUrl = this.baseUrl + 'attachments/' + attachment;
                const extension = attachment.split('.').pop()?.toLowerCase();
                if (!extension) return;
                
                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                    const imageContainer = document.createElement('div');
                    imageContainer.className = 'attachment-image-container';
                    
                    const img = document.createElement('img');
                    img.src = attachmentUrl;
                    img.alt = attachment;
                    img.className = 'attachment-image';
                    img.loading = 'lazy';
                    
                    img.addEventListener('click', (e: MouseEvent) => {
                        e.stopPropagation();
                        window.open(attachmentUrl, '_blank');
                    });
                    
                    imageContainer.appendChild(img);
                    attachmentsContainer.appendChild(imageContainer);
                } else if (extension === 'pdf') {
                    const pdfContainer = document.createElement('div');
                    pdfContainer.className = 'attachment-pdf-container';
                    
                    const pdfTitle = document.createElement('div');
                    pdfTitle.className = 'attachment-pdf-title';
                    pdfTitle.innerHTML = `📄 <strong>${this.escapeHtml(attachment)}</strong>`;
                    pdfContainer.appendChild(pdfTitle);
                    
                    const pdfEmbed = document.createElement('iframe');
                    pdfEmbed.src = attachmentUrl;
                    pdfEmbed.className = 'attachment-pdf-embed';
                    pdfEmbed.title = attachment;
                    
                    pdfContainer.appendChild(pdfEmbed);
                    
                    const downloadLink = document.createElement('a');
                    downloadLink.href = attachmentUrl;
                    downloadLink.download = attachment;
                    downloadLink.className = 'attachment-download-link';
                    downloadLink.textContent = '⬇ Download PDF';
                    downloadLink.target = '_blank';
                    downloadLink.addEventListener('click', (e: MouseEvent) => e.stopPropagation());
                    pdfContainer.appendChild(downloadLink);
                    
                    attachmentsContainer.appendChild(pdfContainer);
                }
            });
            
            card.appendChild(attachmentsContainer);
        }

        // Action bar
        const actionBar = document.createElement('div');
        actionBar.className = 'action-bar';
        
        const detailsBtn = document.createElement('button');
        detailsBtn.className = 'action-btn';
        detailsBtn.textContent = 'Details';
        detailsBtn.addEventListener('click', (e: MouseEvent) => {
            e.stopPropagation();
            this.showStatementDetails(statement);
        });
        actionBar.appendChild(detailsBtn);
        
        card.appendChild(actionBar);

        return card;
    }

    private async showStatementDetails(statement: ParsedStatement): Promise<void> {
        const modal = document.getElementById('statementModal');
        const modalBody = document.getElementById('modalBody');
        if (!modal || !modalBody) return;
        
        // Prevent body scrolling when modal is open
        document.body.classList.add('modal-open');
        
        // Calculate statement hash
        const statementHash = sha256(statement.raw);
        
        // Construct raw file URL
        const rawFileUrl = `${this.baseUrl}${statementHash}.txt`;
        
        // Get the statement from the hash map to ensure we have the verified version
        const verifiedStatement = this.statementsByHash.get(statementHash) || statement;
        
        // Try to parse signature from raw statement
        let signatureInfo: SignatureInfo | null = null;
        let signatureVerified: boolean | undefined = verifiedStatement.signatureVerified;
        let hashMatches: boolean | undefined = verifiedStatement.hashMatches;
        
        try {
            const parsed = parseSignedStatement(statement.raw);
            if (parsed) {
                signatureInfo = {
                    algorithm: parsed.algorithm,
                    publicKey: parsed.publicKey,
                    hash: parsed.statementHash,
                    signature: parsed.signature
                };
                
                // Hash validation passed (parseSignedStatement succeeded)
                hashMatches = true;
                
                // Verify signature if not already verified
                if (signatureVerified === undefined) {
                    signatureVerified = await verifySignature(
                        parsed.statement,
                        parsed.signature,
                        parsed.publicKey
                    );
                }
            }
        } catch (error: any) {
            if (signatureInfo) {
                hashMatches = false;
            }
        }
        
        if (modalBody) {
            modalBody.innerHTML = `
            <h2>Statement Details</h2>
            
            <div class="detail-section">
                <h3>Metadata</h3>
                <table class="detail-table">
                    <tr><td><strong>Domain:</strong></td><td>${this.escapeHtml(statement.domain || 'N/A')}</td></tr>
                    <tr><td><strong>Author:</strong></td><td>${this.escapeHtml(statement.author || 'N/A')}</td></tr>
                    <tr><td><strong>Time:</strong></td><td>${statement.time ? new Date(statement.time).toLocaleString() : 'N/A'}</td></tr>
                    <tr><td><strong>Protocol Version:</strong></td><td>${this.escapeHtml(statement.formatVersion || 'N/A')}</td></tr>
                    <tr><td><strong>Statement Hash:</strong></td><td class="monospace">${this.escapeHtml(statementHash)}</td></tr>
                    <tr><td><strong>Raw File:</strong></td><td><a href="${this.escapeHtml(rawFileUrl)}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(statementHash)}.txt</a></td></tr>
                    ${statement.tags && statement.tags.length > 0 ? `<tr><td><strong>Tags:</strong></td><td>${statement.tags.map(t => this.escapeHtml(t)).join(', ')}</td></tr>` : ''}
                    ${statement.supersededStatement ? `<tr><td><strong>Supersedes:</strong></td><td>${this.escapeHtml(statement.supersededStatement)}</td></tr>` : ''}
                </table>
            </div>

            ${signatureInfo ? `
            <div class="detail-section">
                <h3>Signature Validation</h3>
                <table class="detail-table">
                    <tr>
                        <td><strong>Hash Match:</strong></td>
                        <td>${hashMatches === true ? '<span style="color: #0072BC;">Valid</span>' : hashMatches === false ? '<span style="color: #dc2626;">Invalid</span>' : '<span style="color: #666;">Verifying...</span>'}</td>
                    </tr>
                    <tr>
                        <td><strong>Signature Verification:</strong></td>
                        <td>${signatureVerified === true ? '<span style="color: #0072BC;">Verified</span>' : signatureVerified === false ? '<span style="color: #dc2626;">Failed</span>' : '<span style="color: #666;">Verifying...</span>'}</td>
                    </tr>
                    <tr>
                        <td><strong>Overall Status:</strong></td>
                        <td><strong>${signatureVerified === true && hashMatches === true ? '<span style="color: #0072BC;">VALID</span>' : signatureVerified === false || hashMatches === false ? '<span style="color: #dc2626;">INVALID</span>' : '<span style="color: #666;">VERIFYING...</span>'}</strong></td>
                    </tr>
                    <tr><td colspan="2" style="height: 12px;"></td></tr>
                    <tr><td><strong>Algorithm:</strong></td><td>${this.escapeHtml(signatureInfo.algorithm)}</td></tr>
                    <tr><td><strong>Public Key:</strong></td><td class="monospace">${this.escapeHtml(signatureInfo.publicKey)}</td></tr>
                    <tr><td><strong>Statement Hash:</strong></td><td class="monospace">${this.escapeHtml(signatureInfo.hash)}</td></tr>
                    <tr><td><strong>Signature:</strong></td><td class="monospace">${this.escapeHtml(signatureInfo.signature)}</td></tr>
                </table>
                ${signatureVerified === false || hashMatches === false ? `
                    <p class="warning-text">
                        <strong>⚠️ Signature Validation Failed</strong><br>
                        ${hashMatches === false ? '• The statement hash does not match the signed hash. The content may have been modified.<br>' : ''}
                        ${signatureVerified === false ? '• The cryptographic signature verification failed. The signature may be invalid or the public key may not match.<br>' : ''}
                        This statement should not be trusted.
                    </p>
                ` : signatureVerified === true && hashMatches === true ? `
                    <div style="margin-top: 12px; padding: 12px; background: #e6f2ff; border: 1px solid #0072BC; border-radius: 8px;">
                        <p style="margin: 0; color: #003366; font-size: 0.875rem;">
                            <strong>✓ Signature Valid</strong><br>
                            This statement has been cryptographically verified and can be trusted.
                        </p>
                    </div>
                ` : `
                    <div style="margin-top: 12px; padding: 12px; background: #f9f9f9; border: 1px solid #d0d0d0; border-radius: 8px;">
                        <p style="margin: 0; color: #666; font-size: 0.875rem;">
                            <strong>⏳ Verification In Progress</strong><br>
                            The signature is being verified...
                        </p>
                    </div>
                `}
            </div>
            ` : ''}

            <div class="detail-section">
                <h3>Raw Statement</h3>
                <pre class="raw-statement">${this.escapeHtml(statement.raw)}</pre>
            </div>
        `;
        }
        
        if (modal) {
            modal.style.display = 'block';
        }
    }

    private getTimeAgo(date: Date): string {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
        
        return date.toLocaleDateString();
    }

    private createResponsesContainer(responses: ParsedStatement[]): HTMLDivElement {
        const container = document.createElement('div');
        container.className = 'responses-container';
        
        const header = document.createElement('div');
        header.className = 'responses-header';
        header.textContent = `${responses.length} Response${responses.length > 1 ? 's' : ''}`;
        container.appendChild(header);
        
        // Sort responses by time
        const sortedResponses = [...responses].sort((a: ParsedStatement, b: ParsedStatement) => {
            const timeA = new Date(a.time || 0);
            const timeB = new Date(b.time || 0);
            return timeA.getTime() - timeB.getTime();
        });
        
        sortedResponses.forEach((response: ParsedStatement) => {
            const responseCard = this.createResponseCard(response);
            container.appendChild(responseCard);
        });
        
        return container;
    }

    private createVotesContainer(pollStatement: ParsedStatement, votes: VoteEntry[]): HTMLDivElement {
        const container = document.createElement('div');
        container.className = 'votes-container';
        
        // Parse the poll data from the content using the library's parsePoll
        let pollQuestion = 'Unknown poll';
        let options: string[] = [];
        
        try {
            const pollData = parsePoll(pollStatement.content, pollStatement.formatVersion);
            pollQuestion = pollData.poll;
            options = pollData.options || [];
        } catch (error: any) {
            console.error('Error parsing poll:', error);
        }
        
        // Count votes by option
        const voteCounts: Record<string, number> = {};
        votes.forEach(({ vote }: VoteEntry) => {
            voteCounts[vote] = (voteCounts[vote] || 0) + 1;
        });
        
        const totalVotes = votes.length;
        
        const header = document.createElement('div');
        header.className = 'votes-header';
        header.textContent = `${totalVotes} Vote${totalVotes !== 1 ? 's' : ''}`;
        container.appendChild(header);
        
        // Create vote results display
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'votes-results';
        
        // Display results for each option
        options.forEach((option: string) => {
            const count = voteCounts[option] || 0;
            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            
            const resultRow = document.createElement('div');
            resultRow.className = 'vote-result-row';
            
            const optionLabel = document.createElement('div');
            optionLabel.className = 'vote-option-label';
            optionLabel.textContent = option;
            resultRow.appendChild(optionLabel);
            
            const barContainer = document.createElement('div');
            barContainer.className = 'vote-bar-container';
            
            const bar = document.createElement('div');
            bar.className = 'vote-bar';
            bar.style.width = `${percentage}%`;
            barContainer.appendChild(bar);
            
            const countLabel = document.createElement('div');
            countLabel.className = 'vote-count-label';
            countLabel.textContent = `${count} (${percentage}%)`;
            barContainer.appendChild(countLabel);
            
            resultRow.appendChild(barContainer);
            resultsContainer.appendChild(resultRow);
        });
        
        // Handle votes for options not in the original list (if allowArbitraryVote was true)
        Object.keys(voteCounts).forEach((vote: string) => {
            if (!options.includes(vote)) {
                const count = voteCounts[vote];
                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                
                const resultRow = document.createElement('div');
                resultRow.className = 'vote-result-row';
                
                const optionLabel = document.createElement('div');
                optionLabel.className = 'vote-option-label';
                optionLabel.textContent = `${vote} (other)`;
                resultRow.appendChild(optionLabel);
                
                const barContainer = document.createElement('div');
                barContainer.className = 'vote-bar-container';
                
                const bar = document.createElement('div');
                bar.className = 'vote-bar';
                bar.style.width = `${percentage}%`;
                barContainer.appendChild(bar);
                
                const countLabel = document.createElement('div');
                countLabel.className = 'vote-count-label';
                countLabel.textContent = `${count} (${percentage}%)`;
                barContainer.appendChild(countLabel);
                
                resultRow.appendChild(barContainer);
                resultsContainer.appendChild(resultRow);
            }
        });
        
        container.appendChild(resultsContainer);
        
        // Show individual votes (collapsed by default)
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'votes-toggle-btn';
        toggleBtn.textContent = 'Show individual votes';
        
        const votesListContainer = document.createElement('div');
        votesListContainer.className = 'votes-list-container';
        votesListContainer.style.display = 'none';
        
        // Sort votes by time
        const sortedVotes = [...votes].sort((a: VoteEntry, b: VoteEntry) => {
            const timeA = new Date(a.statement.time || 0);
            const timeB = new Date(b.statement.time || 0);
            return timeA.getTime() - timeB.getTime();
        });
        
        sortedVotes.forEach(({ statement, vote }: VoteEntry) => {
            const voteCard = document.createElement('div');
            voteCard.className = 'vote-card';
            
            const voteHeader = document.createElement('div');
            voteHeader.className = 'vote-header';
            
            const voterInfo = document.createElement('div');
            voterInfo.className = 'voter-info';
            voterInfo.textContent = `${statement.author || statement.domain} voted: ${vote}`;
            voteHeader.appendChild(voterInfo);
            
            const voteTime = document.createElement('div');
            voteTime.className = 'vote-time';
            voteTime.textContent = new Date(statement.time || 0).toLocaleString();
            voteHeader.appendChild(voteTime);
            
            voteCard.appendChild(voteHeader);
            
            // Action bar with signature indicator and details button
            const voteActionBar = document.createElement('div');
            voteActionBar.className = 'response-action-bar';
            
            // Signature indicator
            if (statement.signature) {
                const signatureIndicator = document.createElement('span');
                signatureIndicator.className = statement.signatureVerified
                    ? 'vote-signature-indicator verified'
                    : 'vote-signature-indicator unverified';
                signatureIndicator.textContent = statement.signatureVerified
                    ? '✓ Verified'
                    : '✗ Invalid';
                voteActionBar.appendChild(signatureIndicator);
            }
            
            // Details button
            const detailsBtn = document.createElement('button');
            detailsBtn.className = 'response-details-btn';
            detailsBtn.textContent = 'Details';
            detailsBtn.addEventListener('click', () => {
                this.showStatementDetails(statement);
            });
            voteActionBar.appendChild(detailsBtn);
            
            voteCard.appendChild(voteActionBar);
            
            votesListContainer.appendChild(voteCard);
        });
        
        toggleBtn.addEventListener('click', () => {
            if (votesListContainer.style.display === 'none') {
                votesListContainer.style.display = 'block';
                toggleBtn.textContent = 'Hide individual votes';
            } else {
                votesListContainer.style.display = 'none';
                toggleBtn.textContent = 'Show individual votes';
            }
        });
        
        container.appendChild(toggleBtn);
        container.appendChild(votesListContainer);
        
        return container;
    }

    private createResponseCard(statement: ParsedStatement): HTMLDivElement {
        const card = document.createElement('div');
        card.className = 'response-card';
        
        // Header with meta information
        const header = document.createElement('div');
        header.className = 'response-header';
        
        const meta = document.createElement('div');
        meta.className = 'response-meta';
        
        const domain = document.createElement('div');
        domain.className = 'response-domain';
        domain.textContent = statement.domain || 'Unknown domain';
        meta.appendChild(domain);
        
        if (statement.author) {
            const author = document.createElement('div');
            author.className = 'response-author';
            author.textContent = statement.author;
            meta.appendChild(author);
        }
        
        if (statement.time) {
            const time = document.createElement('div');
            time.className = 'response-time';
            time.textContent = new Date(statement.time).toLocaleString();
            meta.appendChild(time);
        }
        
        header.appendChild(meta);
        
        // Peer badge
        if (statement.isPeer) {
            const peerBadge = document.createElement('div');
            peerBadge.className = 'peer-badge';
            peerBadge.textContent = 'Peer';
            peerBadge.title = `From peer domain: ${statement.peerDomain}`;
            header.appendChild(peerBadge);
        }
        
        card.appendChild(header);
        
        let responseText = statement.content;
        try {
            const responseData = parseResponseContent(statement.content);
            responseText = responseData.response;
        } catch (error: any) {
            console.error('Error parsing response text:', error);
        }
        
        const content = document.createElement('div');
        content.className = 'response-content';
        content.textContent = responseText;
        card.appendChild(content);
        
        // Action bar for responses
        const actionBar = document.createElement('div');
        actionBar.className = 'response-action-bar';
        
        // Signature indicator
        if (statement.signature) {
            const signatureIndicator = document.createElement('span');
            signatureIndicator.className = statement.signatureVerified
                ? 'response-signature-indicator verified'
                : 'response-signature-indicator unverified';
            signatureIndicator.textContent = statement.signatureVerified
                ? 'Verified'
                : 'Invalid';
            actionBar.appendChild(signatureIndicator);
        }
        
        // Details button
        const detailsBtn = document.createElement('button');
        detailsBtn.className = 'response-details-btn';
        detailsBtn.textContent = 'Details';
        detailsBtn.addEventListener('click', (e: MouseEvent) => {
            e.stopPropagation();
            this.showStatementDetails(statement);
        });
        actionBar.appendChild(detailsBtn);
        
        card.appendChild(actionBar);
        
        return card;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new StatementViewer();
});