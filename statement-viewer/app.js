// Statement Viewer Application
// Fetches and displays statements from static text files following the Stated protocol v5

// Note: For browser usage, we use a simplified parser.
// The full stated-protocol-parser library is used in Node.js (generate-samples.cjs)

class StatementViewer {
    constructor() {
        this.baseUrl = '';
        this.statements = [];
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

    parseStatementsFile(text) {
        // Split by double newline to separate statements
        const statementTexts = text.split('\n\n').filter(s => s.trim());
        
        if (statementTexts.length === 0) {
            this.showError('No statements found in the file');
            return;
        }

        this.statements = statementTexts.map(statementText => this.parseStatement(statementText));
        this.renderStatements();
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
            
            const attachmentsTitle = document.createElement('h4');
            attachmentsTitle.textContent = 'Attachments';
            attachmentsContainer.appendChild(attachmentsTitle);
            
            statement.attachments.forEach(attachment => {
                const attachmentLink = document.createElement('a');
                attachmentLink.href = this.baseUrl + 'attachments/' + attachment;
                attachmentLink.textContent = attachment;
                attachmentLink.target = '_blank';
                attachmentLink.className = 'attachment-link';
                
                const attachmentItem = document.createElement('div');
                attachmentItem.className = 'attachment-item';
                attachmentItem.appendChild(attachmentLink);
                attachmentsContainer.appendChild(attachmentItem);
            });
            
            card.appendChild(attachmentsContainer);
        }

        // Signature information
        if (statement.signature) {
            const signatureBox = document.createElement('div');
            signatureBox.className = 'statement-signature';
            
            const title = document.createElement('h4');
            title.textContent = '✓ Cryptographically Signed';
            signatureBox.appendChild(title);

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