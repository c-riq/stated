// Statement Viewer Application
// Fetches and displays statements from static text files following the Stated protocol v5

// Import stated-protocol-parser library
import { sha256, verifySignature, parseSignedStatement, parseStatementsFile as parseStatementsFileLib } from './lib/index.js';

class StatementViewer {
    constructor() {
        this.baseUrl = '';
        this.statements = [];
        this.peerStatements = [];
        this.statementsByHash = new Map();
        this.responsesByHash = new Map();
        this.init();
    }

    init() {
        // Set up event listeners
        document.getElementById('loadStatements').addEventListener('click', () => this.loadStatements());
        
        // Load from URL parameter if present
        const urlParams = new URLSearchParams(window.location.search);
        const baseUrl = urlParams.get('baseUrl');
        if (baseUrl) {
            document.getElementById('baseUrl').value = baseUrl;
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

            const statements = statementTexts.map(statementText => this.parseStatement(statementText));
            
            if (isPeer) {
                return statements;
            } else {
                this.statements = statements;
                
                // Build hash map for main statements
                this.statements.forEach(stmt => {
                    const hash = sha256(stmt.raw);
                    this.statementsByHash.set(hash, stmt);
                });
                
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

    parseStatement(text) {
        const statement = {
            raw: text,
            formatVersion: null,
            domain: null,
            author: null,
            representative: null,
            time: null,
            tags: [],
            supersededStatement: null,
            content: null,
            type: null,
            translations: {},
            attachments: [],
            signature: null
        };

        // Check for signature block
        const signatureMatch = text.match(/---\nStatement hash: ([^\n]+)\nPublic key: ([^\n]+)\nSignature: ([^\n]+)\nAlgorithm: ([^\n]+)\n?$/);
        if (signatureMatch) {
            statement.signature = {
                hash: signatureMatch[1],
                publicKey: signatureMatch[2],
                signature: signatureMatch[3],
                algorithm: signatureMatch[4]
            };
            // Remove signature block from text for parsing
            text = text.substring(0, signatureMatch.index);
        }

        const lines = text.split('\n');
        let i = 0;
        let inContent = false;
        let inTranslation = false;
        let currentTranslationLang = null;
        let contentLines = [];
        let translationLines = [];

        while (i < lines.length) {
            const line = lines[i];

            if (line.startsWith('Stated protocol version: ')) {
                statement.formatVersion = line.substring('Stated protocol version: '.length);
            } else if (line.startsWith('Publishing domain: ')) {
                statement.domain = line.substring('Publishing domain: '.length);
            } else if (line.startsWith('Author: ')) {
                statement.author = line.substring('Author: '.length);
            } else if (line.startsWith('Authorized signing representative: ')) {
                statement.representative = line.substring('Authorized signing representative: '.length);
            } else if (line.startsWith('Time: ')) {
                statement.time = line.substring('Time: '.length);
            } else if (line.startsWith('Tags: ')) {
                statement.tags = line.substring('Tags: '.length).split(', ').map(t => t.trim());
            } else if (line.startsWith('Superseded statement: ')) {
                statement.supersededStatement = line.substring('Superseded statement: '.length);
            } else if (line === 'Statement content:') {
                inContent = true;
            } else if (line.match(/^Translation ([a-z]{2,3}):$/)) {
                inContent = false;
                inTranslation = true;
                if (currentTranslationLang && translationLines.length > 0) {
                    statement.translations[currentTranslationLang] = translationLines.join('\n');
                }
                currentTranslationLang = line.match(/^Translation ([a-z]{2,3}):$/)[1];
                translationLines = [];
            } else if (line.startsWith('Attachments: ')) {
                inContent = false;
                inTranslation = false;
                statement.attachments = line.substring('Attachments: '.length).split(', ').map(a => a.trim());
            } else if (inTranslation) {
                // Remove 4-space indentation from translation lines
                const unindented = line.startsWith('    ') ? line.substring(4) : line;
                translationLines.push(unindented);
            } else if (inContent) {
                // Remove 4-space indentation from content lines
                const unindented = line.startsWith('    ') ? line.substring(4) : line;
                contentLines.push(unindented);
            }

            i++;
        }

        // Save last translation if any
        if (currentTranslationLang && translationLines.length > 0) {
            statement.translations[currentTranslationLang] = translationLines.join('\n');
        }

        statement.content = contentLines.join('\n').trim();

        // Detect statement type from content
        const typeMatch = statement.content.match(/^Type: (.+)$/m);
        if (typeMatch) {
            statement.type = typeMatch[1];
        }

        return statement;
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
            
            // Re-render to show responses
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

        // Sort statements by time (newest first)
        const sortedStatements = [...this.statements].sort((a, b) => {
            const timeA = new Date(a.time);
            const timeB = new Date(b.time);
            return timeB - timeA;
        });

        sortedStatements.forEach(statement => {
            const card = this.createStatementCard(statement);
            container.appendChild(card);
            
            // Add responses if any
            const statementHash = sha256(statement.raw);
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

        // Header with meta information
        const header = document.createElement('div');
        header.className = 'statement-header';

        const meta = document.createElement('div');
        meta.className = 'statement-meta';

        const domain = document.createElement('div');
        domain.className = 'statement-domain';
        domain.textContent = statement.domain || 'Unknown domain';
        meta.appendChild(domain);

        if (statement.author) {
            const author = document.createElement('div');
            author.className = 'statement-author';
            author.textContent = statement.author;
            meta.appendChild(author);
        }

        if (statement.time) {
            const time = document.createElement('div');
            time.className = 'statement-time';
            time.textContent = new Date(statement.time).toLocaleString();
            meta.appendChild(time);
        }

        header.appendChild(meta);

        // Type badge
        if (statement.type) {
            const typeBadge = document.createElement('div');
            typeBadge.className = 'statement-type';
            typeBadge.textContent = statement.type;
            header.appendChild(typeBadge);
        }

        card.appendChild(header);

        // Content
        const content = document.createElement('div');
        content.className = 'statement-content';
        content.textContent = statement.content;
        card.appendChild(content);

        // Tags
        if (statement.tags && statement.tags.length > 0) {
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'statement-tags';
            statement.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagsContainer.appendChild(tagElement);
            });
            card.appendChild(tagsContainer);
        }

        // Attachments
        if (statement.attachments && statement.attachments.length > 0) {
            const attachmentsContainer = document.createElement('div');
            attachmentsContainer.className = 'statement-attachments';
            
            statement.attachments.forEach(attachment => {
                const attachmentUrl = this.baseUrl + 'attachments/' + attachment;
                const extension = attachment.split('.').pop().toLowerCase();
                
                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                    // Display images inline
                    const imageContainer = document.createElement('div');
                    imageContainer.className = 'attachment-image-container';
                    
                    const img = document.createElement('img');
                    img.src = attachmentUrl;
                    img.alt = attachment;
                    img.className = 'attachment-image';
                    img.loading = 'lazy';
                    
                    // Add click to open in new tab
                    img.addEventListener('click', () => {
                        window.open(attachmentUrl, '_blank');
                    });
                    
                    imageContainer.appendChild(img);
                    attachmentsContainer.appendChild(imageContainer);
                } else if (extension === 'pdf') {
                    // Embed PDF viewer
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
                    
                    // Add download link
                    const downloadLink = document.createElement('a');
                    downloadLink.href = attachmentUrl;
                    downloadLink.download = attachment;
                    downloadLink.className = 'attachment-download-link';
                    downloadLink.textContent = '⬇ Download PDF';
                    downloadLink.target = '_blank';
                    pdfContainer.appendChild(downloadLink);
                    
                    attachmentsContainer.appendChild(pdfContainer);
                } else {
                    // Other file types - show as link
                    const attachmentLink = document.createElement('a');
                    attachmentLink.href = attachmentUrl;
                    attachmentLink.textContent = attachment;
                    attachmentLink.target = '_blank';
                    attachmentLink.className = 'attachment-link';
                    
                    const attachmentItem = document.createElement('div');
                    attachmentItem.className = 'attachment-item';
                    attachmentItem.appendChild(attachmentLink);
                    attachmentsContainer.appendChild(attachmentItem);
                }
            });
            
            card.appendChild(attachmentsContainer);
        }

        // Signature information
        if (statement.signature) {
            const signatureBox = document.createElement('div');
            
            if (statement.signatureVerified) {
                signatureBox.className = 'statement-signature signature-valid';
                
                const title = document.createElement('h4');
                title.textContent = '✓ Cryptographically Signed & Verified';
                signatureBox.appendChild(title);
            } else {
                signatureBox.className = 'statement-signature signature-invalid';
                
                const title = document.createElement('h4');
                title.textContent = '✗ Signature Verification Failed';
                signatureBox.appendChild(title);
                
                const warning = document.createElement('div');
                warning.className = 'signature-warning';
                if (!statement.hashMatches) {
                    warning.textContent = 'Warning: Statement hash does not match. The content may have been tampered with.';
                } else {
                    warning.textContent = 'Warning: Signature is invalid. This statement may not be authentic.';
                }
                signatureBox.appendChild(warning);
            }

            const info = document.createElement('div');
            info.className = 'signature-info';
            info.innerHTML = `
                <div><strong>Algorithm:</strong> ${this.escapeHtml(statement.signature.algorithm)}</div>
                <div><strong>Public Key:</strong> ${this.escapeHtml(statement.signature.publicKey)}</div>
                <div><strong>Statement Hash:</strong> ${this.escapeHtml(statement.signature.hash)}</div>
            `;
            signatureBox.appendChild(info);
            card.appendChild(signatureBox);
        }

        return card;
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
        
        // Signature indicator for responses
        if (statement.signature) {
            const signatureIndicator = document.createElement('div');
            signatureIndicator.className = statement.signatureVerified
                ? 'response-signature-indicator verified'
                : 'response-signature-indicator unverified';
            signatureIndicator.textContent = statement.signatureVerified
                ? '✓ Signed & Verified'
                : '✗ Signature Invalid';
            card.appendChild(signatureIndicator);
        }
        
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