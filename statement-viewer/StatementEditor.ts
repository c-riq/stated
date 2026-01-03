import {
    buildStatement,
    generateKeyPair,
    buildSignedStatement,
    buildPollContent,
    buildVoteContent,
    buildResponseContent,
    buildRating,
    buildPDFSigningContent,
    sha256,
    parseStatementsFile,
    generateStatementsFile,
    isRatingValue,
    parseStatement,
    parsePoll,
    parseVote,
    parseResponseContent,
    parseRating,
    parsePDFSigning
} from './lib/index.js';

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
    private privateKey: string = '';
    private publicKey: string = '';
    private generatedStatement: string = '';
    private apiEndpoint: string = 'https://api.country-a.com/update';
    private sourceEndpoint: string = 'https://mofa.country-a.com';
    private attachmentFiles: Map<string, File> = new Map();

    constructor() {
        this.form = document.getElementById('statementForm') as HTMLFormElement;
        this.outputArea = document.getElementById('outputStatement') as HTMLTextAreaElement;
        
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

        // Submit to API button
        const submitBtn = document.getElementById('submitToAPI');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitToAPI());
        }

        // Sign statement checkbox
        const signCheckbox = document.getElementById('signStatement') as HTMLInputElement;
        if (signCheckbox) {
            signCheckbox.addEventListener('change', () => this.toggleSigningFields());
        }

        // Statement type selector
        const typeSelect = document.getElementById('statementType') as HTMLSelectElement;
        if (typeSelect) {
            typeSelect.addEventListener('change', () => {
                this.updateTypeHelp();
                this.updateTypedFields();
            });
        }

        // Initialize
        this.toggleSigningFields();
        this.updateTypeHelp();
        this.updateTypedFields();
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
        const contentHelp = document.getElementById('contentHelp');
        
        if (!typeSelect || !typeHelp) return;

        const helpTexts: Record<string, string> = {
            '': 'A basic statement without a specific type.',
            'poll': 'Create a poll with multiple choice options.',
            'vote': 'Vote on an existing poll.',
            'organisation_verification': 'Verify an organization\'s identity.',
            'person_verification': 'Verify a person\'s identity.',
            'response': 'Respond to another statement.',
            'rating': 'Rate another statement (1-5 stars).',
            'sign_pdf': 'Sign a PDF document.',
            'dispute_statement_authenticity': 'Dispute the authenticity of a statement.',
            'dispute_statement_content': 'Dispute the content of a statement.'
        };

        typeHelp.textContent = helpTexts[typeSelect.value] || '';
        
        // Update content help based on type
        if (contentHelp) {
            if (typeSelect.value) {
                contentHelp.textContent = 'Use the fields below to build your typed statement. The content will be generated automatically.';
            } else {
                contentHelp.textContent = 'The main content of your statement.';
            }
        }
    }

    private updateTypedFields(): void {
        const typeSelect = document.getElementById('statementType') as HTMLSelectElement;
        const typedFieldsContainer = document.getElementById('typedFields');
        const contentGroup = document.querySelector('.form-group:has(#content)') as HTMLElement;
        const contentTextarea = document.getElementById('content') as HTMLTextAreaElement;
        
        if (!typeSelect || !typedFieldsContainer) return;

        const type = typeSelect.value;
        
        if (!type) {
            typedFieldsContainer.style.display = 'none';
            typedFieldsContainer.innerHTML = '';
            if (contentGroup) contentGroup.style.display = 'block';
            if (contentTextarea) contentTextarea.required = true;
            return;
        }

        typedFieldsContainer.style.display = 'block';
        if (contentGroup) contentGroup.style.display = 'none';
        if (contentTextarea) contentTextarea.required = false;

        let fieldsHTML = '';

        switch (type) {
            case 'poll':
                fieldsHTML = `
                    <div class="form-group">
                        <label for="pollQuestion">Poll Question *</label>
                        <input type="text" id="pollQuestion" class="form-input" placeholder="Should we...?" required>
                    </div>
                    <div class="form-group">
                        <label for="pollOptions">Options (comma-separated) *</label>
                        <input type="text" id="pollOptions" class="form-input" placeholder="Yes, No, Maybe" required>
                    </div>
                    <div class="form-group">
                        <label for="pollDeadline">Deadline (optional)</label>
                        <input type="datetime-local" id="pollDeadline" class="form-input">
                    </div>
                    <div class="form-group">
                        <label for="pollScope">Scope Description (optional)</label>
                        <input type="text" id="pollScope" class="form-input" placeholder="All members">
                    </div>
                `;
                break;

            case 'vote':
                fieldsHTML = `
                    <div class="form-group">
                        <label for="voteHash">Poll Statement Hash *</label>
                        <input type="text" id="voteHash" class="form-input" placeholder="Statement hash of the poll" required>
                    </div>
                    <div class="form-group">
                        <label for="votePoll">Poll Question *</label>
                        <input type="text" id="votePoll" class="form-input" placeholder="Copy the poll question" required>
                    </div>
                    <div class="form-group">
                        <label for="voteChoice">Your Vote *</label>
                        <input type="text" id="voteChoice" class="form-input" placeholder="Your chosen option" required>
                    </div>
                `;
                break;

            case 'response':
                fieldsHTML = `
                    <div class="form-group">
                        <label for="responseHash">Statement Hash *</label>
                        <input type="text" id="responseHash" class="form-input" placeholder="Hash of statement you're responding to" required>
                    </div>
                    <div class="form-group">
                        <label for="responseContent">Your Response *</label>
                        <textarea id="responseContent" class="form-textarea" rows="4" placeholder="Your response..." required></textarea>
                    </div>
                `;
                break;

            case 'rating':
                fieldsHTML = `
                    <div class="form-group">
                        <label for="ratingHash">Statement Hash *</label>
                        <input type="text" id="ratingHash" class="form-input" placeholder="Hash of statement you're rating" required>
                    </div>
                    <div class="form-group">
                        <label for="ratingValue">Rating (1-5) *</label>
                        <input type="number" id="ratingValue" class="form-input" min="1" max="5" placeholder="5" required>
                    </div>
                `;
                break;

            case 'sign_pdf':
                fieldsHTML = `
                    <div class="form-group">
                        <label for="pdfHash">PDF Hash *</label>
                        <input type="text" id="pdfHash" class="form-input" placeholder="Hash of the PDF file" required>
                    </div>
                `;
                break;
        }

        typedFieldsContainer.innerHTML = fieldsHTML;
    }

    private buildTypedContent(type: string): string {
        switch (type) {
            case 'poll': {
                const pollQuestion = (document.getElementById('pollQuestion') as HTMLInputElement)?.value.trim();
                const pollOptionsStr = (document.getElementById('pollOptions') as HTMLInputElement)?.value.trim();
                const pollDeadline = (document.getElementById('pollDeadline') as HTMLInputElement)?.value;
                const pollScope = (document.getElementById('pollScope') as HTMLInputElement)?.value.trim();

                const options = pollOptionsStr.split(',').map(opt => opt.trim());
                
                return buildPollContent({
                    poll: pollQuestion,
                    options,
                    deadline: pollDeadline ? new Date(pollDeadline) : undefined,
                    scopeDescription: pollScope || undefined,
                    allowArbitraryVote: undefined
                });
            }

            case 'vote': {
                const voteHash = (document.getElementById('voteHash') as HTMLInputElement)?.value.trim();
                const votePoll = (document.getElementById('votePoll') as HTMLInputElement)?.value.trim();
                const voteChoice = (document.getElementById('voteChoice') as HTMLInputElement)?.value.trim();

                return buildVoteContent({
                    pollHash: voteHash,
                    poll: votePoll,
                    vote: voteChoice
                });
            }

            case 'response': {
                const responseHash = (document.getElementById('responseHash') as HTMLInputElement)?.value.trim();
                const responseText = (document.getElementById('responseContent') as HTMLTextAreaElement)?.value.trim();

                return buildResponseContent({
                    hash: responseHash,
                    response: responseText
                });
            }

            case 'rating': {
                const ratingHash = (document.getElementById('ratingHash') as HTMLInputElement)?.value.trim();
                const ratingValue = parseInt((document.getElementById('ratingValue') as HTMLInputElement)?.value.trim());

                if (!isRatingValue(ratingValue)) {
                    throw new Error('Rating must be between 1 and 5');
                }

                return buildRating({
                    subjectName: 'Statement',
                    subjectType: undefined,
                    subjectReference: ratingHash,
                    rating: ratingValue,
                    documentFileHash: undefined,
                    quality: undefined,
                    comment: undefined
                });
            }

            case 'sign_pdf': {
                const pdfHash = (document.getElementById('pdfHash') as HTMLInputElement)?.value.trim();

                return buildPDFSigningContent({
                    hash: pdfHash
                });
            }

            default:
                return '';
        }
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

    private async getFormData(): Promise<StatementFormData> {
        const domain = (document.getElementById('domain') as HTMLInputElement).value.trim();
        const author = (document.getElementById('author') as HTMLInputElement).value.trim();
        const typeSelect = document.getElementById('statementType') as HTMLSelectElement;
        const type = typeSelect.value || undefined;
        const supersededStatement = (document.getElementById('supersededStatement') as HTMLInputElement).value.trim() || undefined;
        const signStatement = (document.getElementById('signStatement') as HTMLInputElement).checked;

        // Get content - either from textarea or build from typed fields
        let content = '';
        if (type) {
            content = this.buildTypedContent(type);
        } else {
            content = (document.getElementById('content') as HTMLTextAreaElement).value.trim();
        }

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

        // Get attachment hashes (calculated from uploaded files)
        const attachments: string[] = [];
        for (const [filename, file] of this.attachmentFiles.entries()) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);
            const hash = sha256(buffer);
            const ext = filename.split('.').pop();
            attachments.push(`${hash}.${ext}`);
        }

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
            const formData = await this.getFormData();

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

            // Calculate and show hash
            const hash = sha256(this.generatedStatement);
            const hashDisplay = document.getElementById('statementHash');
            if (hashDisplay) {
                hashDisplay.textContent = `Statement Hash: ${hash}`;
            }

            // Validate the generated statement
            const validationDisplay = document.getElementById('statementValidation');
            if (validationDisplay) {
                this.validateStatement(this.generatedStatement, formData.type, validationDisplay);
            }

            this.showMessage('Statement generated successfully! Click "Submit to API" to publish.', 'success');
        } catch (error: any) {
            this.showMessage(`Error generating statement: ${error.message}`, 'error');
        }
    }

    private validateStatement(statement: string, type: string | undefined, displayElement: HTMLElement): void {
        const results: string[] = [];

        try {
            // Parse the full statement
            const parsed = parseStatement({ statement });
            results.push('✅ Statement format is valid');

            // If it's a typed statement, validate the content
            if (type && parsed.content) {
                try {
                    switch (type) {
                        case 'poll':
                            parsePoll(parsed.content);
                            results.push('✅ Poll content is valid');
                            break;
                        case 'vote':
                            parseVote(parsed.content);
                            results.push('✅ Vote content is valid');
                            break;
                        case 'response':
                            parseResponseContent(parsed.content);
                            results.push('✅ Response content is valid');
                            break;
                        case 'rating':
                            parseRating(parsed.content);
                            results.push('✅ Rating content is valid');
                            break;
                        case 'sign_pdf':
                            parsePDFSigning(parsed.content);
                            results.push('✅ PDF signing content is valid');
                            break;
                    }
                } catch (contentError: any) {
                    results.push(`❌ Content validation failed: ${contentError.message}`);
                }
            }

            displayElement.innerHTML = results.join('<br>');
            displayElement.className = 'validation-success';
        } catch (error: any) {
            displayElement.innerHTML = `❌ Statement validation failed: ${error.message}`;
            displayElement.className = 'validation-error';
        }
    }

    private async submitToAPI(): Promise<void> {
        if (!this.generatedStatement) {
            this.showMessage('Please generate a statement first', 'error');
            return;
        }

        const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
        const apiKey = apiKeyInput?.value.trim();

        if (!apiKey) {
            this.showMessage('Please enter an API key', 'error');
            return;
        }

        const progressContainer = document.getElementById('uploadProgress');
        if (!progressContainer) return;

        try {
            // Show progress container
            progressContainer.style.display = 'block';
            progressContainer.innerHTML = '<h4>Upload Progress</h4>';

            const hash = sha256(this.generatedStatement);

            // Step 1: Fetch current statements.txt from country-a.com
            this.addProgressStep(progressContainer, 'Fetching current statements.txt from country-a.com...', 'pending');
            const statementsResponse = await fetch(`${this.sourceEndpoint}/.well-known/statements.txt`);
            let existingStatements: string[] = [];
            
            if (statementsResponse.ok) {
                const statementsText = await statementsResponse.text();
                existingStatements = parseStatementsFile(statementsText);
                this.updateProgressStep(progressContainer, 0, 'Fetched statements.txt from country-a.com', 'success');
            } else {
                this.updateProgressStep(progressContainer, 0, 'No existing statements.txt (will create new)', 'success');
            }

            // Step 2: Append new statement and generate new statements.txt
            this.addProgressStep(progressContainer, 'Generating updated statements.txt...', 'pending');
            existingStatements.push(this.generatedStatement);
            const newStatementsFile = generateStatementsFile(existingStatements);
            this.updateProgressStep(progressContainer, 1, 'Generated updated statements.txt', 'success');

            // Step 3: Upload statements.txt (without cache invalidation)
            this.addProgressStep(progressContainer, 'Uploading statements.txt...', 'pending');
            await this.uploadToAPI('.well-known/statements.txt', newStatementsFile, 'text/plain', apiKey, false, false);
            this.updateProgressStep(progressContainer, 2, 'Uploaded statements.txt', 'success');

            // Step 4: Upload individual statement file (without cache invalidation)
            this.addProgressStep(progressContainer, `Uploading statements/${hash}.txt...`, 'pending');
            await this.uploadToAPI(`.well-known/statements/${hash}.txt`, this.generatedStatement, 'text/plain', apiKey, false, false);
            this.updateProgressStep(progressContainer, 3, `Uploaded statements/${hash}.txt`, 'success');

            // Step 5: Fetch and update statements/index.txt from country-a.com
            this.addProgressStep(progressContainer, 'Fetching statements/index.txt from country-a.com...', 'pending');
            const indexResponse = await fetch(`${this.sourceEndpoint}/.well-known/statements/index.txt`);
            let indexContent = '';
            
            if (indexResponse.ok) {
                indexContent = await indexResponse.text();
                this.updateProgressStep(progressContainer, 4, 'Fetched statements/index.txt from country-a.com', 'success');
            } else {
                this.updateProgressStep(progressContainer, 4, 'No existing index.txt (will create new)', 'success');
            }

            const indexLines = indexContent.split('\n').filter(line => line.trim());
            if (!indexLines.includes(`${hash}.txt`)) {
                this.addProgressStep(progressContainer, 'Updating statements/index.txt...', 'pending');
                indexLines.push(`${hash}.txt`);
                const newIndexContent = indexLines.join('\n') + '\n';
                await this.uploadToAPI('.well-known/statements/index.txt', newIndexContent, 'text/plain', apiKey, false, false);
                this.updateProgressStep(progressContainer, 5, 'Updated statements/index.txt', 'success');
            } else {
                this.addProgressStep(progressContainer, 'Statement already in index.txt', 'success');
            }

            // Step 6: Upload attachments if any (without cache invalidation)
            if (this.attachmentFiles.size > 0) {
                this.addProgressStep(progressContainer, `Uploading ${this.attachmentFiles.size} attachment(s)...`, 'pending');
                await this.uploadAttachments(apiKey, progressContainer);
                this.updateProgressStep(progressContainer, progressContainer.querySelectorAll('.progress-step').length - 1, `Uploaded ${this.attachmentFiles.size} attachment(s)`, 'success');
            }

            // Step 7: Invalidate cache once after all uploads
            this.addProgressStep(progressContainer, 'Invalidating CloudFront cache...', 'pending');
            await this.invalidateCache(apiKey);
            this.updateProgressStep(progressContainer, progressContainer.querySelectorAll('.progress-step').length - 1, 'Cache invalidated', 'success');

            // Final success message
            this.addProgressStep(progressContainer, '✅ Statement published successfully!', 'success');
            this.showMessage('Statement published successfully!', 'success');
        } catch (error: any) {
            if (progressContainer) {
                this.addProgressStep(progressContainer, `❌ Error: ${error.message}`, 'error');
            }
            this.showMessage(`Error submitting statement: ${error.message}`, 'error');
        }
    }

    private addProgressStep(container: HTMLElement, message: string, status: 'pending' | 'success' | 'error'): void {
        const step = document.createElement('div');
        step.className = `progress-step progress-${status}`;
        
        const icon = status === 'pending' ? '⏳' : status === 'success' ? '✓' : '✗';
        step.innerHTML = `<span class="progress-icon">${icon}</span> <span class="progress-text">${message}</span>`;
        
        container.appendChild(step);
    }

    private updateProgressStep(container: HTMLElement, index: number, message: string, status: 'success' | 'error'): void {
        const steps = container.querySelectorAll('.progress-step');
        if (steps[index]) {
            const step = steps[index] as HTMLElement;
            step.className = `progress-step progress-${status}`;
            const icon = status === 'success' ? '✓' : '✗';
            step.innerHTML = `<span class="progress-icon">${icon}</span> <span class="progress-text">${message}</span>`;
        }
    }

    private async uploadToAPI(path: string, content: string, contentType: string, apiKey: string, isBase64: boolean = false, invalidateCache: boolean = false): Promise<void> {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
            },
            body: JSON.stringify({
                path,
                content,
                contentType,
                isBase64,
                invalidateCache,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Failed to upload ${path}`);
        }
    }

    private async invalidateCache(apiKey: string): Promise<void> {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
            },
            body: JSON.stringify({
                invalidateCache: true,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to invalidate cache');
        }
    }

    private async uploadAttachments(apiKey: string, progressContainer?: HTMLElement): Promise<void> {
        const attachmentsIndexResponse = await fetch(`${this.sourceEndpoint}/.well-known/statements/attachments/index.txt`);
        let attachmentsIndex: string[] = [];
        
        if (attachmentsIndexResponse.ok) {
            const indexText = await attachmentsIndexResponse.text();
            attachmentsIndex = indexText.split('\n').filter(line => line.trim());
        }

        for (const [filename, file] of this.attachmentFiles.entries()) {
            // Read file as buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);
            
            // Calculate hash
            const hash = sha256(buffer);
            const ext = filename.split('.').pop();
            const attachmentFilename = `${hash}.${ext}`;

            // Convert to base64 for upload
            const base64Content = btoa(String.fromCharCode(...buffer));

            // Determine content type
            const contentType = this.getContentType(ext || '');

            // Show progress for this attachment
            if (progressContainer) {
                this.addProgressStep(progressContainer, `  Uploading ${filename}...`, 'pending');
            }

            // Upload attachment (with isBase64 flag, without cache invalidation)
            await this.uploadToAPI(
                `.well-known/statements/attachments/${attachmentFilename}`,
                base64Content,
                contentType,
                apiKey,
                true,  // isBase64 = true for binary files
                false  // invalidateCache = false, we'll do it once at the end
            );

            if (progressContainer) {
                this.updateProgressStep(
                    progressContainer,
                    progressContainer.querySelectorAll('.progress-step').length - 1,
                    `  Uploaded ${filename} as ${attachmentFilename}`,
                    'success'
                );
            }

            // Update index if needed
            if (!attachmentsIndex.includes(attachmentFilename)) {
                attachmentsIndex.push(attachmentFilename);
            }
        }

        // Upload updated attachments index (without cache invalidation)
        if (progressContainer) {
            this.addProgressStep(progressContainer, '  Updating attachments/index.txt...', 'pending');
        }
        const newAttachmentsIndex = attachmentsIndex.join('\n') + '\n';
        await this.uploadToAPI('.well-known/statements/attachments/index.txt', newAttachmentsIndex, 'text/plain', apiKey, false, false);
        if (progressContainer) {
            this.updateProgressStep(
                progressContainer,
                progressContainer.querySelectorAll('.progress-step').length - 1,
                '  Updated attachments/index.txt',
                'success'
            );
        }
    }

    private getContentType(ext: string): string {
        const contentTypes: Record<string, string> = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'pdf': 'application/pdf',
            'mp4': 'video/mp4',
            'json': 'application/json',
            'txt': 'text/plain',
        };
        return contentTypes[ext.toLowerCase()] || 'application/octet-stream';
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
            <input type="file" class="form-input attachment-file">
            <button type="button" class="btn-remove" onclick="this.parentElement.remove()">Remove</button>
        `;
        
        const fileInput = attachmentItem.querySelector('.attachment-file') as HTMLInputElement;
        fileInput.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files[0]) {
                const file = target.files[0];
                this.attachmentFiles.set(file.name, file);
            }
        });
        
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