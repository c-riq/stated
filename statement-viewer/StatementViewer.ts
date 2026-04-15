import { sha256, verifySignature, parseSignedStatement, splitStatements } from 'stated-protocol-v5.3';
import { ParsedStatement, VoteEntry, Identity, PDFSignatureEntry, RatingEntry, ObservationEntry, AppConfig } from './types.js';
import { sortStatementsByTime, escapeHtml, styleTypedStatementContent } from './utils.js';
import { createStatementCard, createVotesContainer, createResponsesContainer, createPdfSignaturesContainer, createRatingsContainer, createObservationsContainer, renderStatementDetails } from './renderers.js';
import {
    parseStatement,
    getPdfHash,
    getOrganizationLogo,
    getPersonPicture
} from './protocol-compat.js';

export class StatementViewer {
    private baseUrl: string;
    private statements: ParsedStatement[];
    private peerStatements: ParsedStatement[];
    private statementsByHash: Map<string, ParsedStatement>;
    private responsesByHash: Map<string, ParsedStatement[]>;
    private votesByPollHash: Map<string, VoteEntry[]>;
    private signaturesByPdfHash: Map<string, PDFSignatureEntry[]>;
    private ratingsBySubject: Map<string, RatingEntry[]>;
    private observationsBySubject: Map<string, ObservationEntry[]>;
    private identities: Map<string, Identity>;
    private showHostOnly: boolean;
    private showTechnicalDetails: boolean;
    private config: AppConfig;

    constructor(statementsPath: string = '/.well-known/statements/', config: AppConfig) {
        this.config = config;
        this.baseUrl = `${window.location.origin}${statementsPath}`;
        this.statements = [];
        this.peerStatements = [];
        this.statementsByHash = new Map();
        this.responsesByHash = new Map();
        this.votesByPollHash = new Map();
        this.signaturesByPdfHash = new Map();
        this.ratingsBySubject = new Map();
        this.observationsBySubject = new Map();
        this.identities = new Map();
        this.showHostOnly = false;
        this.showTechnicalDetails = false;
        this.init();
    }

    private init(): void {
        // Menu toggle functionality
        const menuToggle = document.getElementById('menuToggle');
        const menuClose = document.getElementById('menuClose');
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        
        const openMenu = () => {
            if (sideMenu && menuOverlay) {
                sideMenu.classList.add('open');
                menuOverlay.classList.add('active');
            }
        };
        
        const closeMenu = () => {
            if (sideMenu && menuOverlay) {
                sideMenu.classList.remove('open');
                menuOverlay.classList.remove('active');
            }
        };
        
        if (menuToggle) {
            menuToggle.addEventListener('click', openMenu);
        }
        
        if (menuClose) {
            menuClose.addEventListener('click', closeMenu);
        }
        
        if (menuOverlay) {
            menuOverlay.addEventListener('click', closeMenu);
        }
        
        // Filter checkbox
        const showHostOnlyCheckbox = document.getElementById('showHostOnly') as HTMLInputElement;
        if (showHostOnlyCheckbox) {
            showHostOnlyCheckbox.addEventListener('change', () => {
                this.showHostOnly = showHostOnlyCheckbox.checked;
                this.renderStatements();
            });
        }
        
        // Modal functionality
        const modal = document.getElementById('statementModal');
        const closeBtn = document.querySelector('.modal-close');
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
                // Clear URL hash when closing modal
                this.clearUrlParam();
            });
        }
        
        window.addEventListener('click', (e: MouseEvent) => {
            if (e.target === modal && modal) {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
                // Clear URL hash when closing modal
                this.clearUrlParam();
            }
        });
        
        // Handle URL parameter changes for deep linking
        window.addEventListener('popstate', () => {
            this.handleUrlParam();
        });
        
        // Always load from host domain
        this.loadStatements();
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
        // baseUrl is already set in constructor
        this.statements = [];
        this.peerStatements = [];
        this.statementsByHash.clear();
        this.responsesByHash.clear();
        this.votesByPollHash.clear();
        this.signaturesByPdfHash.clear();
        this.ratingsBySubject.clear();
        this.observationsBySubject.clear();
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
            const statementTexts = splitStatements(text);
            
            if (statementTexts.length === 0) {
                if (!isPeer) {
                    this.showError('No statements found in the file');
                }
                return [];
            }

            const statements: ParsedStatement[] = statementTexts.map((statementText: string) => {
                const parsed = parseStatement(statementText);
                // Convert FullyParsedStatement to ParsedStatement (time Date -> string)
                return {
                    ...parsed,
                    time: parsed.time.toISOString(),
                    publicKey: parsed.signature?.publicKey
                };
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
                this.buildPdfSignaturesMap();
                this.buildRatingsMap();
                this.buildObservationsMap();
                this.buildSupersedingMap();
                
                this.verifyAllSignatures().then(() => {
                    this.linkSignaturesToIdentities();
                    this.renderStatements();
                    // Check if URL has a statement parameter to open a specific statement
                    this.handleUrlParam();
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
            const peerDomains = indexText.split('\n')
                .map(line => line.trim())
                .filter(line => line && line !== 'index.txt' && !line.endsWith('.txt'))
                .map(line => line.replace(/\/$/, '')); // Remove trailing slash

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
            this.buildIdentityRegistry(); // Rebuild identity registry to include peer self-verifications
            this.buildResponseMap();
            this.buildVotesMap();
            this.buildPdfSignaturesMap();
            this.buildRatingsMap();
            this.buildObservationsMap();
            this.buildSupersedingMap();
            this.renderStatements();
            // Check if URL has a statement parameter to open a specific statement
            this.handleUrlParam();
        } catch (error: any) {
            console.error('Error loading peer statements:', error);
        }
    }

    private buildResponseMap(): void {
        this.responsesByHash.clear();
        
        this.peerStatements.forEach((stmt: ParsedStatement) => {
            if (stmt.type === 'response' && stmt.parsedContent?.type === 'response') {
                try {
                    const referencedHash = stmt.parsedContent.data.hash;
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
            if (stmt.type === 'vote' && stmt.parsedContent?.type === 'vote') {
                try {
                    const voteData = stmt.parsedContent.data;
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
    
    private buildPdfSignaturesMap(): void {
        this.signaturesByPdfHash.clear();
        
        const allStatements: ParsedStatement[] = [...this.statements, ...this.peerStatements];
        
        allStatements.forEach((stmt: ParsedStatement) => {
            if (stmt.type === 'sign_pdf' && stmt.parsedContent?.type === 'sign_pdf') {
                try {
                    const pdfHash = getPdfHash(stmt);
                    const pdfSigningData = stmt.parsedContent.data;
                    
                    if (pdfHash && !this.signaturesByPdfHash.has(pdfHash)) {
                        this.signaturesByPdfHash.set(pdfHash, []);
                    }
                    if (pdfHash) {
                        this.signaturesByPdfHash.get(pdfHash)!.push({
                            statement: stmt,
                            pdfHash: pdfHash,
                            signatureData: pdfSigningData
                        });
                    }
                } catch (error: unknown) {
                    console.error('Error parsing PDF signing:', error);
                }
            }
        });
    }
    
    private buildRatingsMap(): void {
        this.ratingsBySubject.clear();
        
        const allStatements: ParsedStatement[] = [...this.statements, ...this.peerStatements];
        
        allStatements.forEach((stmt: ParsedStatement) => {
            if (stmt.type === 'rating' && stmt.parsedContent?.type === 'rating') {
                try {
                    const ratingData = stmt.parsedContent.data;
                    const subjectName = ratingData.subjectName;
                    
                    if (!this.ratingsBySubject.has(subjectName)) {
                        this.ratingsBySubject.set(subjectName, []);
                    }
                    this.ratingsBySubject.get(subjectName)!.push({
                        statement: stmt,
                        rating: ratingData.rating,
                        ratingData: ratingData
                    });
                } catch (error: any) {
                    console.error('Error parsing rating:', error);
                }
            }
        });
    }
    
    private buildObservationsMap(): void {
        this.observationsBySubject.clear();
        
        const allStatements: ParsedStatement[] = [...this.statements, ...this.peerStatements];
        
        allStatements.forEach((stmt: ParsedStatement) => {
            if (stmt.type === 'observation' && stmt.parsedContent?.type === 'observation') {
                try {
                    const observationData = stmt.parsedContent.data;
                    const subject = observationData.subject;
                    
                    if (!this.observationsBySubject.has(subject)) {
                        this.observationsBySubject.set(subject, []);
                    }
                    this.observationsBySubject.get(subject)!.push({
                        statement: stmt,
                        subject: observationData.subject,
                        property: observationData.property,
                        value: observationData.value
                    });
                } catch (error: any) {
                    console.error('Error parsing observation:', error);
                }
            }
        });
    }
    
    private buildSupersedingMap(): void {
        const allStatements: ParsedStatement[] = [...this.statements, ...this.peerStatements];
        
        // Build a map of superseded hash -> superseding statement
        allStatements.forEach((stmt: ParsedStatement) => {
            if (stmt.supersededStatement) {
                // Find the superseded statement
                const supersededStmt = this.statementsByHash.get(stmt.supersededStatement);
                if (supersededStmt) {
                    // Only mark as superseded if same author and domain
                    if (supersededStmt.author === stmt.author && supersededStmt.domain === stmt.domain) {
                        supersededStmt.supersededBy = stmt;
                    }
                }
            }
        });
    }
    

    private buildIdentityRegistry(): void {
        this.identities.clear();
        
        // Process both host statements and peer statements for self-verifications
        const allStatements = [...this.statements, ...this.peerStatements];
        
        allStatements.forEach((stmt: ParsedStatement) => {
            if (stmt.type === 'organisation_verification' && stmt.parsedContent?.type === 'organisation_verification') {
                try {
                    const verification = stmt.parsedContent.data;
                    
                    // Check if this is a self-verification: the statement's publishing domain
                    // must match the domain being verified
                    const isSelfVerified = verification.domain && stmt.domain === verification.domain;
                    
                    if (isSelfVerified) {
                        const profilePicture = getOrganizationLogo(stmt);
                        
                        const identity: Identity = {
                            domain: verification.domain,
                            author: verification.name,
                            publicKey: verification.publicKey,
                            profilePicture: profilePicture,
                            verificationStatement: stmt,
                            isSelfVerified: true
                        };
                        
                        this.identities.set(verification.domain, identity);
                    }
                } catch (error: unknown) {
                    console.error('Error parsing organisation verification:', error);
                }
            }
        });
    }

    private linkSignaturesToIdentities(): void {
        this.statements.forEach((stmt: ParsedStatement) => {
            if (stmt.signature && stmt.domain) {
                try {
                    // Check if this public key matches a known identity
                    const identity = this.identities.get(stmt.domain);
                    if (identity && identity.publicKey === stmt.signature.publicKey) {
                        // Signature matches the established identity
                        stmt.signatureVerified = stmt.signatureVerified && true;
                    }
                } catch (error: any) {
                    console.error('Error linking signature to identity:', error);
                }
            }
        });
        
        // Peer statements already have signature info from parseStatement
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

        // Combine host and peer statements
        let allStatements = [...this.statements];
        
        if (!this.showHostOnly) {
            allStatements = [...allStatements, ...this.peerStatements];
        }

        if (allStatements.length === 0) {
            container.innerHTML = '<p>No statements to display</p>';
            return;
        }

        const aggregatedVoteHashes = new Set<string>();
        const aggregatedPdfSignatureHashes = new Set<string>();
        const aggregatedRatingHashes = new Set<string>();
        const aggregatedObservationHashes = new Set<string>();
        const aggregatedVerificationHashes = new Set<string>();
        
        allStatements.forEach((statement: ParsedStatement) => {
            if (statement.type === 'poll') {
                const statementHash = sha256(statement.raw);
                const votes = this.votesByPollHash.get(statementHash);
                if (votes && votes.length > 0) {
                    votes.forEach(({ statement: voteStatement }: VoteEntry) => {
                        const voteHash = sha256(voteStatement.raw);
                        aggregatedVoteHashes.add(voteHash);
                    });
                }
            }
            
            // Track PDF signing statements - only the first one will render the PDF with all signatures
            if (statement.type === 'sign_pdf') {
                try {
                    const pdfHash = getPdfHash(statement);
                    const signatures = pdfHash ? this.signaturesByPdfHash.get(pdfHash) : undefined;
                    if (signatures && signatures.length > 0) {
                        // Mark all but the first signature as aggregated (to hide them)
                        signatures.forEach(({ statement: sigStatement }, index) => {
                            if (index > 0) {
                                const sigHash = sha256(sigStatement.raw);
                                aggregatedPdfSignatureHashes.add(sigHash);
                            }
                        });
                    }
                } catch (error: any) {
                    console.error('Error processing PDF signing for aggregation:', error);
                }
            }
            
            // Mark ALL rating statements as aggregated - they will be displayed separately
            if (statement.type === 'rating') {
                const statementHash = sha256(statement.raw);
                aggregatedRatingHashes.add(statementHash);
            }
            
            // Mark ALL observation statements as aggregated - they will be displayed with verification statements
            if (statement.type === 'observation') {
                const statementHash = sha256(statement.raw);
                aggregatedObservationHashes.add(statementHash);
            }
            
            // Mark ALL verification statements as aggregated - they will be displayed separately at the end
            if (statement.type === 'organisation_verification' || statement.type === 'person_verification') {
                const statementHash = sha256(statement.raw);
                aggregatedVerificationHashes.add(statementHash);
            }
        });

        const sortedStatements = sortStatementsByTime(allStatements);

        sortedStatements.forEach((statement: ParsedStatement) => {
            const statementHash = sha256(statement.raw);
            
            if (statement.type === 'vote' && aggregatedVoteHashes.has(statementHash)) {
                return;
            }
            
            if (statement.type === 'sign_pdf' && aggregatedPdfSignatureHashes.has(statementHash)) {
                return;
            }
            
            if (statement.type === 'rating' && aggregatedRatingHashes.has(statementHash)) {
                return;
            }
            
            if (statement.type === 'observation' && aggregatedObservationHashes.has(statementHash)) {
                return;
            }
            
            if ((statement.type === 'organisation_verification' || statement.type === 'person_verification') && aggregatedVerificationHashes.has(statementHash)) {
                return;
            }
            
            const identity = statement.domain ? this.identities.get(statement.domain) : undefined;
            const card = createStatementCard(statement, this.baseUrl, identity, (stmt) => this.showStatementDetails(stmt));
            container.appendChild(card);
            
            if (statement.type === 'poll') {
                const votes = this.votesByPollHash.get(statementHash);
                if (votes && votes.length > 0) {
                    // Filter votes if showHostOnly is enabled
                    const filteredVotes = this.showHostOnly
                        ? votes.filter(({ statement: voteStatement }) => !voteStatement.isPeer)
                        : votes;
                    
                    if (filteredVotes.length > 0) {
                        const votesContainer = createVotesContainer(statement, filteredVotes, this.identities, (stmt) => this.showStatementDetails(stmt), this.config);
                        container.appendChild(votesContainer);
                    }
                }
            }
            
            // Show PDF with signatures if this is a PDF signing statement (first one for each PDF)
            if (statement.type === 'sign_pdf') {
                try {
                    const compatParsed = parseStatement(statement.raw);
                    const pdfHash = getPdfHash(compatParsed);
                    const signatures = pdfHash ? this.signaturesByPdfHash.get(pdfHash) : undefined;
                    if (signatures && signatures.length > 0) {
                        // Filter signatures if showHostOnly is enabled
                        const filteredSignatures = this.showHostOnly
                            ? signatures.filter(({ statement: sigStatement }) => !sigStatement.isPeer)
                            : signatures;
                        
                        if (filteredSignatures.length > 0) {
                            const signaturesContainer = createPdfSignaturesContainer(
                                pdfHash,
                                filteredSignatures,
                                this.baseUrl,
                                this.identities,
                                (stmt) => this.showStatementDetails(stmt),
                                this.config
                            );
                            container.appendChild(signaturesContainer);
                        }
                    }
                } catch (error: any) {
                    console.error('Error rendering PDF signatures:', error);
                }
            }
            
            
            const responses = this.responsesByHash.get(statementHash);
            if (responses && responses.length > 0) {
                // Filter responses if showHostOnly is enabled
                const filteredResponses = this.showHostOnly
                    ? responses.filter(response => !response.isPeer)
                    : responses;
                
                if (filteredResponses.length > 0) {
                    const responsesContainer = createResponsesContainer(filteredResponses, (stmt) => this.showStatementDetails(stmt));
                    container.appendChild(responsesContainer);
                }
            }
        });
        
        // Display all rating subjects at the end
        this.ratingsBySubject.forEach((ratings, subjectName) => {
            // Filter ratings if showHostOnly is enabled
            const filteredRatings = this.showHostOnly
                ? ratings.filter(({ statement: ratingStatement }) => !ratingStatement.isPeer)
                : ratings;
            
            if (filteredRatings.length > 0) {
                const ratingsContainer = createRatingsContainer(
                    subjectName,
                    filteredRatings,
                    this.identities,
                    this.baseUrl,
                    (stmt) => this.showStatementDetails(stmt)
                );
                container.appendChild(ratingsContainer);
            }
        });
        
        // Display all verifications with their observations at the end
        const verificationStatements = allStatements.filter(stmt =>
            stmt.type === 'organisation_verification' || stmt.type === 'person_verification'
        );
        
        verificationStatements.forEach((verificationStmt) => {
            // Filter if showHostOnly is enabled
            if (this.showHostOnly && verificationStmt.isPeer) {
                return;
            }
            
            // Show the verification statement card
            const identity = verificationStmt.domain ? this.identities.get(verificationStmt.domain) : undefined;
            const verificationCard = createStatementCard(verificationStmt, this.baseUrl, identity, (stmt) => this.showStatementDetails(stmt));
            container.appendChild(verificationCard);
            
            // Create the identity subject format: Name_With_Underscores@domain
            const identitySubject = `${verificationStmt.author.replace(/ /g, '_')}@${verificationStmt.domain}`;
            const observations = this.observationsBySubject.get(identitySubject);
            
            // Show observations if they exist
            if (observations && observations.length > 0) {
                // Filter observations if showHostOnly is enabled
                const filteredObservations = this.showHostOnly
                    ? observations.filter(({ statement: obsStatement }) => !obsStatement.isPeer)
                    : observations;
                
                if (filteredObservations.length > 0) {
                    // Show observations below the verification
                    const observationsContainer = createObservationsContainer(
                        identitySubject,
                        filteredObservations,
                        this.identities,
                        this.baseUrl,
                        (stmt) => this.showStatementDetails(stmt)
                    );
                    container.appendChild(observationsContainer);
                }
            }
        });
    }

    private async showStatementDetails(statement: ParsedStatement): Promise<void> {
        const modal = document.getElementById('statementModal');
        const modalBody = document.getElementById('modalBody');
        if (!modal || !modalBody) return;
        
        document.body.classList.add('modal-open');
        
        // Render the statement details with view mode toggle
        await this.renderModalContent(statement, modalBody);
        
        modal.style.display = 'block';
        
        // Update URL with statement ID parameter for deep linking
        const statementHash = sha256(statement.raw);
        this.setUrlParam(statementHash);
    }
    
    private async renderModalContent(statement: ParsedStatement, modalBody: HTMLElement): Promise<void> {
        const statementHash = sha256(statement.raw);
        
        // Create view mode toggle
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'view-mode-toggle';
        toggleContainer.innerHTML = `
            <button class="view-mode-btn ${!this.showTechnicalDetails ? 'active' : ''}" data-mode="content">
                Content View
            </button>
            <button class="view-mode-btn ${this.showTechnicalDetails ? 'active' : ''}" data-mode="technical">
                Technical Details
            </button>
        `;
        
        // Add event listeners to toggle buttons
        const buttons = toggleContainer.querySelectorAll('.view-mode-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const mode = (e.target as HTMLElement).getAttribute('data-mode');
                this.showTechnicalDetails = mode === 'technical';
                await this.renderModalContent(statement, modalBody);
            });
        });
        
        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'modal-detail-content';
        
        if (this.showTechnicalDetails) {
            // Show technical details
            contentContainer.innerHTML = await renderStatementDetails(statement, this.baseUrl, this.statementsByHash, this.identities);
        } else {
            // Show content view with aggregated data - append DOM elements directly
            await this.renderContentViewDom(statement, statementHash, contentContainer);
        }
        
        // Clear and update modal body
        modalBody.innerHTML = '';
        modalBody.appendChild(toggleContainer);
        modalBody.appendChild(contentContainer);
    }
    
    private async renderContentViewDom(statement: ParsedStatement, statementHash: string, container: HTMLElement): Promise<void> {
        // Use the existing createStatementCard function to render exactly like in the feed
        const identity = statement.domain ? this.identities.get(statement.domain) : undefined;
        const card = createStatementCard(statement, this.baseUrl, identity, (stmt) => this.showStatementDetails(stmt));
        container.appendChild(card);
        
        // Add aggregated votes if this is a poll
        if (statement.type === 'poll') {
            const votes = this.votesByPollHash.get(statementHash);
            if (votes && votes.length > 0) {
                const filteredVotes = this.showHostOnly
                    ? votes.filter(({ statement: voteStatement }) => !voteStatement.isPeer)
                    : votes;
                
                if (filteredVotes.length > 0) {
                    const votesContainer = createVotesContainer(statement, filteredVotes, this.identities, (stmt) => this.showStatementDetails(stmt), this.config);
                    container.appendChild(votesContainer);
                }
            }
        }
        
        // Add PDF signatures if this is a PDF signing statement
        if (statement.type === 'sign_pdf') {
            try {
                const compatParsed = parseStatement(statement.raw);
                const pdfHash = getPdfHash(compatParsed);
                const signatures = pdfHash ? this.signaturesByPdfHash.get(pdfHash) : undefined;
                if (signatures && signatures.length > 0) {
                    const filteredSignatures = this.showHostOnly
                        ? signatures.filter(({ statement: sigStatement }) => !sigStatement.isPeer)
                        : signatures;
                    
                    if (filteredSignatures.length > 0) {
                        const signaturesContainer = createPdfSignaturesContainer(
                            pdfHash,
                            filteredSignatures,
                            this.baseUrl,
                            this.identities,
                            (stmt) => this.showStatementDetails(stmt),
                            this.config
                        );
                        container.appendChild(signaturesContainer);
                    }
                }
            } catch (error: any) {
                console.error('Error rendering PDF signatures in content view:', error);
            }
        }
        
        // Add responses
        const responses = this.responsesByHash.get(statementHash);
        if (responses && responses.length > 0) {
            const filteredResponses = this.showHostOnly
                ? responses.filter(response => !response.isPeer)
                : responses;
            
            if (filteredResponses.length > 0) {
                const responsesContainer = createResponsesContainer(filteredResponses, (stmt) => this.showStatementDetails(stmt));
                container.appendChild(responsesContainer);
            }
        }
    }
    
    public showStatementByHash(hash: string): void {
        // Check host statements first
        let statement = this.statementsByHash.get(hash);
        
        // If not found, check peer statements
        if (!statement) {
            statement = this.peerStatements.find(stmt => sha256(stmt.raw) === hash);
        }
        
        if (statement) {
            this.showStatementDetails(statement);
        } else {
            console.warn(`Statement with hash ${hash} not found`);
        }
    }
    
    private setUrlParam(statementId: string): void {
        // Update URL with statement parameter without triggering navigation
        const url = new URL(window.location.href);
        url.searchParams.set('statement', statementId);
        window.history.replaceState(null, '', url.toString());
    }
    
    private clearUrlParam(): void {
        // Remove statement parameter from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('statement');
        window.history.replaceState(null, '', url.toString());
    }
    
    private handleUrlParam(): void {
        const urlParams = new URLSearchParams(window.location.search);
        const statementId = urlParams.get('statement');
        if (statementId) {
            // Wait for statements to be loaded before trying to show
            if (this.statementsByHash.size > 0) {
                this.showStatementByHash(statementId);
            } else {
                // If statements aren't loaded yet, wait and try again
                setTimeout(() => this.handleUrlParam(), 100);
            }
        }
    }
    
}
