import { buildStatement, generateKeyPair, buildSignedStatement, sha256 } from './lib/index.js';

export interface StatementFormData {
    domain: string;
    author: string;
    content: string;
    tags: string[];
    type?: string;
    supersededStatement?: string;
    attachments?: string[];
    translations?: Record<string, string>;
    signStatement: boolean;
}

export class StatementEditor {
    private form: HTMLFormElement | null;
    private outputArea: HTMLTextAreaElement | null;
    private previewArea: HTMLDivElement | null;
    private privateKey: string = '';
    private publicKey: string = '';
    private generatedStatement: string = '';

    constructor() {
        this.form = document.getElementById('statementForm') as HTMLFormElement;
        this.outputArea = document.getElementById('outputStatement') as HTMLTextAreaElement;
        this.previewArea = document.getElementById('statementPreview') as HTMLDivElement;
        
        this.init();
    }

    private init(): void {
        if (!this.form) return;

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateStatement();
        });

        // Generate key pair button
        const generateKeysBtn = document.getElementById('generateKeys');
        if (generateKeysBtn) {
            generateKeysBtn.addEventListener('click', () => this.generateKeys());
        }

        // Copy statement button
        const copyBtn = document.getElementById('copyStatement');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyStatement());
        }

        // Download statement button
        const downloadBtn = document.getElementById('downloadStatement');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadStatement());
        }

        // Add tag button
        const addTagBtn = document.getElementById('addTag');
        if (addTagBtn) {
            addTagBtn.addEventListener('click', () => this.addTag());
        }

        // Add translation button
        const addTranslationBtn = document.getElementById('addTranslation');
        if (addTranslationBtn) {
            addTranslationBtn.addEventListener('click', () => this.addTranslation());
        }

        // Add attachment button
        const addAttachmentBtn = document.getElementById('addAttachment');
        if (addAttachmentBtn) {
            addAttachmentBtn.addEventListener('click', () => this.addAttachment());
        }

        // Sign statement checkbox
        const signCheckbox = document.getElementById('signStatement') as HTMLInputElement;
        if (signCheckbox) {
            signCheckbox.addEventListener('change', () => this.toggleSigningFields());
        }

        // Statement type selector
        const typeSelect = document.getElementById('statementType') as HTMLSelectElement;
        if (typeSelect) {
            typeSelect.addEventListener('change', () => this.updateTypeHelp());
        }

        // Initialize
        this.toggleSigningFields();
        this.updateTypeHelp();
    }

    private toggleSigningFields(): void {
        const signCheckbox = document.getElementById('signStatement') as HTMLInputElement;
        const signingFields = document.getElementById('signingFields');
        
        if (signingFields) {
            signingFields.style.display = signCheckbox?.checked ? 'block' : 'none';
        }
    }

    private updateTypeHelp(): void {
        const typeSelect = document.getElementById('statementType') as HTMLSelectElement;
        const typeHelp = document.getElementById('typeHelp');
        
        if (!typeSelect || !typeHelp) return;

        const helpTexts: Record<string, string> = {
            '': 'A basic statement without a specific type.',
            'poll': 'Create a poll with multiple choice options. Format: Type: poll\\nPoll: Question?\\nOptions: Option1, Option2, Option3',
            'vote': 'Vote on an existing poll. Format: Type: vote\\nPoll hash: <hash>\\nVote: <option>',
            'organisation_verification': 'Verify an organization\'s identity. Includes name, country, legal form, domain, etc.',
            'person_verification': 'Verify a person\'s identity. Includes name, date of birth, country, etc.',
            'response': 'Respond to another statement. Format: Type: response\\nStatement hash: <hash>\\nResponse: Your response',
            'rating': 'Rate another statement. Format: Type: rating\\nStatement hash: <hash>\\nRating: 1-5',
            'sign_pdf': 'Sign a PDF document. Format: Type: sign_pdf\\nPDF hash: <hash>',
            'dispute_statement_authenticity': 'Dispute the authenticity of a statement.',
            'dispute_statement_content': 'Dispute the content of a statement.'
        };

        typeHelp.textContent = helpTexts[typeSelect.value] || '';
    }

    private async generateKeys(): Promise<void> {
        try {
            const keyPair = await generateKeyPair();
            this.privateKey = keyPair.privateKey;
            this.publicKey = keyPair.publicKey;

            const privateKeyInput = document.getElementById('privateKey') as HTMLInputElement;
            const publicKeyInput = document.getElementById('publicKey') as HTMLInputElement;

            if (privateKeyInput) privateKeyInput.value = this.privateKey;
            if (publicKeyInput) publicKeyInput.value = this.publicKey;

            this.showMessage('Key pair generated successfully!', 'success');
        } catch (error: any) {
            this.showMessage(`Error generating keys: ${error.message}`, 'error');
        }
    }

    private getFormData(): StatementFormData {
        const domain = (document.getElementById('domain') as HTMLInputElement).value.trim();
        const author = (document.getElementById('author') as HTMLInputElement).value.trim();
        const content = (document.getElementById('content') as HTMLTextAreaElement).value.trim();
        const typeSelect = document.getElementById('statementType') as HTMLSelectElement;
        const type = typeSelect.value || undefined;
        const supersededStatement = (document.getElementById('supersededStatement') as HTMLInputElement).value.trim() || undefined;
        const signStatement = (document.getElementById('signStatement') as HTMLInputElement).checked;

        // Get tags
        const tags: string[] = [];
        document.querySelectorAll('.tag-item input').forEach((input) => {
            const value = (input as HTMLInputElement).value.trim();
            if (value) tags.push(value);
        });

        // Get translations
        const translations: Record<string, string> = {};
        document.querySelectorAll('.translation-item').forEach((item) => {
            const lang = (item.querySelector('.translation-lang') as HTMLInputElement).value.trim();
            const text = (item.querySelector('.translation-text') as HTMLTextAreaElement).value.trim();
            if (lang && text) translations[lang] = text;
        });

        // Get attachments
        const attachments: string[] = [];
        document.querySelectorAll('.attachment-item input').forEach((input) => {
            const value = (input as HTMLInputElement).value.trim();
            if (value) attachments.push(value);
        });

        return {
            domain,
            author,
            content,
            tags: tags.length > 0 ? tags : undefined as any,
            type,
            supersededStatement,
            attachments: attachments.length > 0 ? attachments : undefined,
            translations: Object.keys(translations).length > 0 ? translations : undefined,
            signStatement
        };
    }

    private async generateStatement(): Promise<void> {
        try {
            const formData = this.getFormData();

            // Validate required fields
            if (!formData.domain) {
                this.showMessage('Domain is required', 'error');
                return;
            }
            if (!formData.author) {
                this.showMessage('Author is required', 'error');
                return;
            }
            if (!formData.content) {
                this.showMessage('Content is required', 'error');
                return;
            }

            // Build the statement content with type if specified
            let content = formData.content;
            if (formData.type && !content.startsWith('Type:')) {
                content = `Type: ${formData.type}\n${content}`;
            }

            // Build the statement
            const statement = buildStatement({
                domain: formData.domain,
                author: formData.author,
                time: new Date(),
                content: content,
                tags: formData.tags,
                supersededStatement: formData.supersededStatement,
                attachments: formData.attachments,
                translations: formData.translations
            });

            // Sign if requested
            if (formData.signStatement) {
                const privateKeyInput = document.getElementById('privateKey') as HTMLInputElement;
                const publicKeyInput = document.getElementById('publicKey') as HTMLInputElement;

                this.privateKey = privateKeyInput.value.trim();
                this.publicKey = publicKeyInput.value.trim();

                if (!this.privateKey || !this.publicKey) {
                    this.showMessage('Please generate or enter key pair for signing', 'error');
                    return;
                }

                this.generatedStatement = await buildSignedStatement(statement, this.privateKey, this.publicKey);
            } else {
                this.generatedStatement = statement;
            }

            // Display the statement
            if (this.outputArea) {
                this.outputArea.value = this.generatedStatement;
            }

            // Show preview
            this.showPreview();

            // Calculate and show hash
            const hash = sha256(this.generatedStatement);
            const hashDisplay = document.getElementById('statementHash');
            if (hashDisplay) {
                hashDisplay.textContent = `Statement Hash: ${hash}`;
            }

            this.showMessage('Statement generated successfully!', 'success');
        } catch (error: any) {
            this.showMessage(`Error generating statement: ${error.message}`, 'error');
        }
    }

    private showPreview(): void {
        if (!this.previewArea) return;

        const lines = this.generatedStatement.split('\n');
        let html = '<div class="statement-preview-content">';
        
        lines.forEach(line => {
            if (line.startsWith('Stated protocol version:') || 
                line.startsWith('Publishing domain:') || 
                line.startsWith('Author:') ||
                line.startsWith('Time:') ||
                line.startsWith('Tags:') ||
                line.startsWith('Type:') ||
                line.startsWith('Superseded statement:') ||
                line.startsWith('Statement content:') ||
                line.startsWith('---') ||
                line.startsWith('Statement hash:') ||
                line.startsWith('Public key:') ||
                line.startsWith('Signature:') ||
                line.startsWith('Algorithm:')) {
                html += `<div class="preview-field"><strong>${this.escapeHtml(line)}</strong></div>`;
            } else if (line.trim()) {
                html += `<div class="preview-content">${this.escapeHtml(line)}</div>`;
            } else {
                html += '<div class="preview-spacer"></div>';
            }
        });
        
        html += '</div>';
        this.previewArea.innerHTML = html;
    }

    private copyStatement(): void {
        if (!this.outputArea || !this.generatedStatement) {
            this.showMessage('No statement to copy', 'error');
            return;
        }

        this.outputArea.select();
        document.execCommand('copy');
        this.showMessage('Statement copied to clipboard!', 'success');
    }

    private downloadStatement(): void {
        if (!this.generatedStatement) {
            this.showMessage('No statement to download', 'error');
            return;
        }

        const hash = sha256(this.generatedStatement);
        const filename = `${hash}.txt`;
        
        const blob = new Blob([this.generatedStatement], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showMessage(`Statement downloaded as ${filename}`, 'success');
    }

    private addTag(): void {
        const tagsContainer = document.getElementById('tagsContainer');
        if (!tagsContainer) return;

        const tagItem = document.createElement('div');
        tagItem.className = 'tag-item';
        tagItem.innerHTML = `
            <input type="text" placeholder="Tag name" class="form-input">
            <button type="button" class="btn-remove" onclick="this.parentElement.remove()">Remove</button>
        `;
        tagsContainer.appendChild(tagItem);
    }

    private addTranslation(): void {
        const translationsContainer = document.getElementById('translationsContainer');
        if (!translationsContainer) return;

        const translationItem = document.createElement('div');
        translationItem.className = 'translation-item';
        translationItem.innerHTML = `
            <input type="text" placeholder="Language code (e.g., es, fr, de)" class="form-input translation-lang">
            <textarea placeholder="Translated content" class="form-textarea translation-text" rows="3"></textarea>
            <button type="button" class="btn-remove" onclick="this.parentElement.remove()">Remove</button>
        `;
        translationsContainer.appendChild(translationItem);
    }

    private addAttachment(): void {
        const attachmentsContainer = document.getElementById('attachmentsContainer');
        if (!attachmentsContainer) return;

        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'attachment-item';
        attachmentItem.innerHTML = `
            <input type="text" placeholder="Attachment hash" class="form-input">
            <button type="button" class="btn-remove" onclick="this.parentElement.remove()">Remove</button>
        `;
        attachmentsContainer.appendChild(attachmentItem);
    }

    private showMessage(message: string, type: 'success' | 'error'): void {
        const messageDiv = document.getElementById('message');
        if (!messageDiv) return;

        messageDiv.textContent = message;
        messageDiv.className = `message message-${type}`;
        messageDiv.style.display = 'block';

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}