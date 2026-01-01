// Statement Viewer Application
// Fetches and displays statements from static text files following the Stated protocol v5

// Import stated-protocol-parser library
import { sha256, verifySignature, parseSignedStatement, parseStatementsFile as parseStatementsFileLib, parseVote, parsePoll, parseStatement as parseStatementLib } from './lib/index.js';

class StatementViewer {
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

    init() {
        // Set up event listeners
        document.getElementById('loadStatements').addEventListener('click', () => this.loadStatements());
        
        // Modal close
        const modal = document.getElementById('statementModal');
        const closeBtn = document.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        });
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
            }
        });
        
        // Auto-load from current origin or URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const baseUrl = urlParams.get('baseUrl');
        if (baseUrl) {
            document.getElementById('baseUrl').value = baseUrl;
            this.loadStatements();
        } else {
            // Auto-load from current origin
            const defaultUrl = `${window.location.origin}/.well-known/statements/`;
            document.getElementById('baseUrl').value = defaultUrl;
            this.loadStatements();
        }
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
    }

    showError(message) {
        const errorDiv = document.getElementById('error');
        if (message) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        } else {
            errorDiv.style.display = 'none';
        }
    }

    async loadStatements() {
        this.baseUrl = document.getElementById('baseUrl').value.trim();
        
        if (!this.baseUrl) {
            this.showError('Please enter a base URL');
            return;
        }

        // Ensure baseUrl ends with /
        if (!this.baseUrl.endsWith('/')) {
            this.baseUrl += '/';
        }

        // Clear all data to prevent duplication
        this.statements = [];
        this.peerStatements = [];
        this.statementsByHash.clear();
        this.responsesByHash.clear();
        this.votesByPollHash.clear();

        this.showLoading(true);
        this.showError(null);
        document.getElementById('statementsList').innerHTML = '';

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
            
            // Load peer statements
            await this.loadPeerStatements();
        } catch (error) {
            this.showError(`Error loading statements: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    async loadFromIndex() {
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

            // Load each statement file
            const statements = [];
            for (const filename of filenames) {
                try {
                    const statementUrl = this.baseUrl + filename.trim();
                    const statementResponse = await fetch(statementUrl);
                    if (statementResponse.ok) {
                        const statementText = await statementResponse.text();
                        statements.push(statementText);
                    }
                } catch (error) {
                    console.error(`Error loading ${filename}:`, error);
                }
            }

            if (statements.length > 0) {
                this.parseStatementsFile(statements.join('\n\n'));
            } else {
                this.showError('No statements could be loaded');
            }
        } catch (error) {
            throw new Error(`Failed to load from index: ${error.message}`);
        }
    }

    parseStatementsFile(text, isPeer = false) {
        try {
            // Use the library's parseStatementsFile function to properly split statements
            const statementTexts = parseStatementsFileLib(text);
            
            if (statementTexts.length === 0) {
                if (!isPeer) {
                    this.showError('No statements found in the file');
                }
                return [];
            }

            const statements = statementTexts.map(statementText => {
                const parsed = parseStatementLib({ statement: statementText });
                return {
                    raw: statementText,
                    ...parsed
                };
            });
            
            if (isPeer) {
                return statements;
            } else {
                this.statements = statements;
                
                // Build hash map for main statements
                this.statements.forEach(stmt => {
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
        } catch (error) {
            if (!isPeer) {
                this.showError(`Error parsing statements file: ${error.message}`);
            }
            console.error('Parse error:', error);
            return [];
        }
    }

    async loadPeerStatements() {
        try {
            const peersIndexUrl = this.baseUrl + 'peers/index.txt';
            const response = await fetch(peersIndexUrl);
            
            if (!response.ok) {
                console.log('No peer statements found (peers/index.txt not available)');
                return;
            }

            const indexText = await response.text();
            const peerDomains = indexText.split('\n').filter(line => line.trim());

            console.log(`Found ${peerDomains.length} peer domains`);

            for (const peerDomain of peerDomains) {
                try {
                    const peerStatementsUrl = this.baseUrl + `peers/${peerDomain}/statements.txt`;
                    const peerResponse = await fetch(peerStatementsUrl);
                    
                    if (peerResponse.ok) {
                        const peerText = await peerResponse.text();
                        const peerStatements = this.parseStatementsFile(peerText, true);
                        
                        // Mark statements as from peer
                        peerStatements.forEach(stmt => {
                            stmt.isPeer = true;
                            stmt.peerDomain = peerDomain;
                        });
                        
                        this.peerStatements.push(...peerStatements);
                        console.log(`Loaded ${peerStatements.length} statements from peer ${peerDomain}`);
                    }
                } catch (error) {
                    console.error(`Error loading peer ${peerDomain}:`, error);
                }
            }

            // Verify signatures for peer statements
            await this.verifyPeerSignatures();
            
            // Build response map
            this.buildResponseMap();
            
            // Build votes map (in case votes came from peers)
            this.buildVotesMap();
            
            // Re-render to show responses and votes
            this.renderStatements();
        } catch (error) {
            console.error('Error loading peer statements:', error);
        }
    }

    buildResponseMap() {
        this.responsesByHash.clear();
        
        this.peerStatements.forEach(stmt => {
            // Check if this is a response statement
            const responseMatch = stmt.content.match(/Type: Response\s+Hash of referenced statement: ([^\s]+)/);
            if (responseMatch) {
                const referencedHash = responseMatch[1];
                if (!this.responsesByHash.has(referencedHash)) {
                    this.responsesByHash.set(referencedHash, []);
                }
                this.responsesByHash.get(referencedHash).push(stmt);
            }
        });
        
        console.log(`Built response map with ${this.responsesByHash.size} referenced statements`);
    }

    buildVotesMap() {
        this.votesByPollHash.clear();
        
        // Check both main statements and peer statements for votes
        const allStatements = [...this.statements, ...this.peerStatements];
        
        console.log(`[buildVotesMap] Checking ${allStatements.length} statements for votes`);
        
        allStatements.forEach(stmt => {
            // Check if this is a vote statement
            if (stmt.type && stmt.type.toLowerCase() === 'vote') {
                try {
                    // Parse the vote data from the content using the library's parseVote
                    const voteData = parseVote(stmt.content);
                    const pollHash = voteData.pollHash;
                    const vote = voteData.vote;
                    
                    console.log(`[buildVotesMap] Found vote: "${vote}" for poll hash: ${pollHash}`);
                    
                    if (!this.votesByPollHash.has(pollHash)) {
                        this.votesByPollHash.set(pollHash, []);
                    }
                    this.votesByPollHash.get(pollHash).push({
                        statement: stmt,
                        vote: vote,
                        voteData: voteData
                    });
                } catch (error) {
                    console.error(`[buildVotesMap] Failed to parse vote:`, error);
                }
            }
        });
        
        console.log(`[buildVotesMap] Built votes map with ${this.votesByPollHash.size} polls having votes`);
        this.votesByPollHash.forEach((votes, pollHash) => {
            console.log(`[buildVotesMap] Poll ${pollHash}: ${votes.length} votes`);
        });
    }

    async verifyPeerSignatures() {
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
                } catch (error) {
                    console.error('Error verifying peer signature:', error);
                    statement.signatureVerified = false;
                    statement.hashMatches = false;
                }
            }
        });
        
        await Promise.all(verificationPromises);
    }

    async verifyAllSignatures() {
        const verificationPromises = this.statements.map(async (statement) => {
            if (statement.signature) {
                try {
                    console.log('Verifying statement with signature:', {
                        hash: statement.signature.hash,
                        publicKey: statement.signature.publicKey,
                        algorithm: statement.signature.algorithm,
                        rawLength: statement.raw.length
                    });
                    
                    // Use parseSignedStatement to properly parse and verify
                    const parsed = parseSignedStatement(statement.raw);
                    
                    if (!parsed) {
                        // Parsing failed (hash mismatch or invalid format)
                        statement.signatureVerified = false;
                        statement.hashMatches = false;
                        console.error('Failed to parse signed statement. Raw text:', statement.raw.substring(0, 200));
                        return;
                    }
                    
                    console.log('Successfully parsed signed statement:', {
                        statementHash: parsed.statementHash,
                        publicKey: parsed.publicKey,
                        algorithm: parsed.algorithm
                    });
                    
                    // Hash validation passed (done by parseSignedStatement)
                    statement.hashMatches = true;
                    
                    // Now verify the cryptographic signature
                    const signatureValid = await verifySignature(
                        parsed.statement,
                        parsed.signature,
                        parsed.publicKey
                    );
                    
                    statement.signatureVerified = signatureValid;
                    
                    console.log('Signature verification result:', signatureValid);
                    
                    if (!signatureValid) {
                        console.error('Signature verification failed for statement:', {
                            hash: parsed.statementHash,
                            publicKey: parsed.publicKey
                        });
                    }
                } catch (error) {
                    console.error('Error verifying signature:', error);
                    statement.signatureVerified = false;
                    statement.hashMatches = false;
                }
            }
        });
        
        await Promise.all(verificationPromises);
    }

    renderStatements() {
        const container = document.getElementById('statementsList');
        container.innerHTML = '';

        if (this.statements.length === 0) {
            container.innerHTML = '<p>No statements to display</p>';
            return;
        }

        // Build a set of vote statement hashes that are aggregated into polls
        const aggregatedVoteHashes = new Set();
        this.statements.forEach(statement => {
            if (statement.type && statement.type.toLowerCase() === 'poll') {
                const statementHash = sha256(statement.raw);
                const votes = this.votesByPollHash.get(statementHash);
                if (votes && votes.length > 0) {
                    votes.forEach(({ statement: voteStatement }) => {
                        const voteHash = sha256(voteStatement.raw);
                        aggregatedVoteHashes.add(voteHash);
                    });
                }
            }
        });

        // Sort statements by time (newest first)
        const sortedStatements = [...this.statements].sort((a, b) => {
            const timeA = new Date(a.time);
            const timeB = new Date(b.time);
            return timeB - timeA;
        });

        sortedStatements.forEach(statement => {
            const statementHash = sha256(statement.raw);
            
            // Skip vote statements that are aggregated into polls
            if (statement.type && statement.type.toLowerCase() === 'vote' && aggregatedVoteHashes.has(statementHash)) {
                console.log(`[renderStatements] Skipping aggregated vote statement: ${statementHash}`);
                return;
            }
            
            const card = this.createStatementCard(statement);
            container.appendChild(card);
            
            console.log(`[renderStatements] Statement type: ${statement.type}, hash: ${statementHash}`);
            
            // Add votes if this is a poll
            if (statement.type && statement.type.toLowerCase() === 'poll') {
                console.log(`[renderStatements] This is a poll statement, checking for votes...`);
                const votes = this.votesByPollHash.get(statementHash);
                console.log(`[renderStatements] Found ${votes ? votes.length : 0} votes for this poll`);
                if (votes && votes.length > 0) {
                    console.log(`[renderStatements] Creating votes container with ${votes.length} votes`);
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

    createStatementCard(statement) {
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
        const timeAgo = this.getTimeAgo(new Date(statement.time));
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
            
            statement.attachments.forEach(attachment => {
                const attachmentUrl = this.baseUrl + 'attachments/' + attachment;
                const extension = attachment.split('.').pop().toLowerCase();
                
                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                    const imageContainer = document.createElement('div');
                    imageContainer.className = 'attachment-image-container';
                    
                    const img = document.createElement('img');
                    img.src = attachmentUrl;
                    img.alt = attachment;
                    img.className = 'attachment-image';
                    img.loading = 'lazy';
                    
                    img.addEventListener('click', (e) => {
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
                    downloadLink.addEventListener('click', (e) => e.stopPropagation());
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
        detailsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showStatementDetails(statement);
        });
        actionBar.appendChild(detailsBtn);
        
        card.appendChild(actionBar);

        return card;
    }

    showStatementDetails(statement) {
        const modal = document.getElementById('statementModal');
        const modalBody = document.getElementById('modalBody');
        
        // Prevent body scrolling when modal is open
        document.body.classList.add('modal-open');
        
        modalBody.innerHTML = `
            <h2>Statement Details</h2>
            
            <div class="detail-section">
                <h3>Metadata</h3>
                <table class="detail-table">
                    <tr><td><strong>Domain:</strong></td><td>${this.escapeHtml(statement.domain || 'N/A')}</td></tr>
                    <tr><td><strong>Author:</strong></td><td>${this.escapeHtml(statement.author || 'N/A')}</td></tr>
                    <tr><td><strong>Time:</strong></td><td>${statement.time ? new Date(statement.time).toLocaleString() : 'N/A'}</td></tr>
                    <tr><td><strong>Protocol Version:</strong></td><td>${this.escapeHtml(statement.formatVersion || 'N/A')}</td></tr>
                    ${statement.tags && statement.tags.length > 0 ? `<tr><td><strong>Tags:</strong></td><td>${statement.tags.map(t => this.escapeHtml(t)).join(', ')}</td></tr>` : ''}
                    ${statement.supersededStatement ? `<tr><td><strong>Supersedes:</strong></td><td>${this.escapeHtml(statement.supersededStatement)}</td></tr>` : ''}
                </table>
            </div>

            ${statement.signature ? `
            <div class="detail-section">
                <h3>Signature ${statement.signatureVerified ? '✓ Verified' : '✗ Invalid'}</h3>
                <table class="detail-table">
                    <tr><td><strong>Algorithm:</strong></td><td>${this.escapeHtml(statement.signature.algorithm)}</td></tr>
                    <tr><td><strong>Public Key:</strong></td><td class="monospace">${this.escapeHtml(statement.signature.publicKey)}</td></tr>
                    <tr><td><strong>Statement Hash:</strong></td><td class="monospace">${this.escapeHtml(statement.signature.hash)}</td></tr>
                    <tr><td><strong>Signature:</strong></td><td class="monospace">${this.escapeHtml(statement.signature.signature)}</td></tr>
                </table>
                ${!statement.signatureVerified ? '<p class="warning-text">⚠️ This signature could not be verified. The statement may have been tampered with.</p>' : ''}
            </div>
            ` : ''}

            <div class="detail-section">
                <h3>Raw Statement</h3>
                <pre class="raw-statement">${this.escapeHtml(statement.raw)}</pre>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
        
        return date.toLocaleDateString();
    }

    createResponsesContainer(responses) {
        const container = document.createElement('div');
        container.className = 'responses-container';
        
        const header = document.createElement('div');
        header.className = 'responses-header';
        header.textContent = `${responses.length} Response${responses.length > 1 ? 's' : ''}`;
        container.appendChild(header);
        
        // Sort responses by time
        const sortedResponses = [...responses].sort((a, b) => {
            const timeA = new Date(a.time);
            const timeB = new Date(b.time);
            return timeA - timeB;
        });
        
        sortedResponses.forEach(response => {
            const responseCard = this.createResponseCard(response);
            container.appendChild(responseCard);
        });
        
        return container;
    }

    createVotesContainer(pollStatement, votes) {
        const container = document.createElement('div');
        container.className = 'votes-container';
        
        // Parse the poll data from the content using the library's parsePoll
        let pollQuestion = 'Unknown poll';
        let options = [];
        
        try {
            const pollData = parsePoll(pollStatement.content, pollStatement.formatVersion);
            pollQuestion = pollData.poll;
            options = pollData.options || [];
        } catch (error) {
            console.error('[createVotesContainer] Failed to parse poll:', error);
        }
        
        // Count votes by option
        const voteCounts = {};
        votes.forEach(({ vote }) => {
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
        options.forEach(option => {
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
        Object.keys(voteCounts).forEach(vote => {
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
        const sortedVotes = [...votes].sort((a, b) => {
            const timeA = new Date(a.statement.time);
            const timeB = new Date(b.statement.time);
            return timeA - timeB;
        });
        
        sortedVotes.forEach(({ statement, vote }) => {
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
            voteTime.textContent = new Date(statement.time).toLocaleString();
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

    createResponseCard(statement) {
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
        
        // Extract response text from content
        const responseMatch = statement.content.match(/Response:\s+(.+)/s);
        const responseText = responseMatch ? responseMatch[1].trim() : statement.content;
        
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
                ? '✓ Verified'
                : '✗ Invalid';
            actionBar.appendChild(signatureIndicator);
        }
        
        // Details button
        const detailsBtn = document.createElement('button');
        detailsBtn.className = 'response-details-btn';
        detailsBtn.textContent = 'Details';
        detailsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showStatementDetails(statement);
        });
        actionBar.appendChild(detailsBtn);
        
        card.appendChild(actionBar);
        
        return card;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new StatementViewer();
});