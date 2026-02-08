import type { AppConfig, PeerInfo } from './types.js';
import { API_KEY_STORAGE_KEY } from './constants.js';

export class ConfigEditor {
    private config: AppConfig;
    private configPath: string = './config.json';
    private readonly API_KEY_STORAGE_KEY = API_KEY_STORAGE_KEY;

    constructor(config: AppConfig) {
        this.config = config;
        this.init();
    }

    private init(): void {
        this.renderConfigForm();
        this.attachEventListeners();
    }

    private renderConfigForm(): void {
        const container = document.getElementById('configEditorContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="editor-container">
                <div class="editor-panel">
                    <h2>Configuration Editor</h2>
                    <p class="config-description">
                        Edit your application configuration. Changes will be saved to config.json.
                    </p>

                    <form id="configForm">
                        <!-- Branding Section -->
                        <div class="form-section">
                            <h3>Branding</h3>
                            
                            <div class="form-group">
                                <label for="brandingLogo">Logo Path</label>
                                <input type="text" id="brandingLogo" class="form-input" 
                                       value="${this.escapeHtml(this.config.branding.logo)}" required>
                                <small>Path to your logo image file</small>
                            </div>

                            <div class="form-group">
                                <label for="brandingTitle">Title</label>
                                <input type="text" id="brandingTitle" class="form-input" 
                                       value="${this.escapeHtml(this.config.branding.title)}" required>
                            </div>

                            <div class="form-group">
                                <label for="brandingSubtitle">Subtitle</label>
                                <input type="text" id="brandingSubtitle" class="form-input" 
                                       value="${this.escapeHtml(this.config.branding.subtitle)}" required>
                            </div>
                        </div>

                        <!-- Statements Path Section -->
                        <div class="form-section">
                            <h3>Statements</h3>
                            
                            <div class="form-group">
                                <label for="statementsPath">Statements Path</label>
                                <input type="text" id="statementsPath" class="form-input" 
                                       value="${this.escapeHtml(this.config.statementsPath)}" required>
                                <small>Path to the statements directory</small>
                            </div>
                        </div>

                        <!-- Editor Section -->
                        <div class="form-section">
                            <h3>Editor Settings</h3>
                            
                            <div class="form-group">
                                <label for="editorDefaultDomain">Default Domain</label>
                                <input type="text" id="editorDefaultDomain" class="form-input"
                                       value="${this.escapeHtml(this.config.editor.defaults.domain)}" required>
                                <small>Pre-filled domain for new statements</small>
                            </div>

                            <div class="form-group">
                                <label for="editorDefaultAuthor">Default Author</label>
                                <input type="text" id="editorDefaultAuthor" class="form-input"
                                       value="${this.escapeHtml(this.config.editor.defaults.author)}" required>
                                <small>Pre-filled author for new statements</small>
                            </div>

                            <div class="form-group">
                                <label for="editorApiEndpoint">API Endpoint</label>
                                <input type="url" id="editorApiEndpoint" class="form-input" 
                                       value="${this.escapeHtml(this.config.editor.api.endpoint)}" required>
                                <small>API endpoint for submitting statements</small>
                            </div>

                            <div class="form-group">
                                <label for="editorSourceEndpoint">Source Endpoint</label>
                                <input type="url" id="editorSourceEndpoint" class="form-input" 
                                       value="${this.escapeHtml(this.config.editor.api.sourceEndpoint)}" required>
                                <small>Source endpoint for fetching statements</small>
                            </div>
                        </div>

                        <!-- Sync Section -->
                        <div class="form-section">
                            <h3>Synchronization Settings</h3>
                            
                            <div class="form-group">
                                <label for="syncCronSchedule">Cron Schedule</label>
                                <input type="text" id="syncCronSchedule" class="form-input"
                                       value="${this.escapeHtml(this.config.sync.cronSchedule)}" required>
                                <small>Cron expression for sync frequency (e.g., "0 */6 * * *" for every 6 hours)</small>
                            </div>
                        </div>

                        <!-- Peers Section -->
                        <div class="form-section">
                            <h3>Peer Nodes</h3>
                            <p class="section-description">
                                Manage trusted peer nodes for statement synchronization.
                            </p>
                            
                            <div id="peersList">
                                ${this.renderPeersList()}
                            </div>

                            <button type="button" id="addPeerBtn" class="btn btn-secondary">
                                Add Peer
                            </button>
                        </div>

                        <!-- API Key Section -->
                        <div class="form-section">
                            <h3>API Key</h3>
                            
                            <div class="form-group">
                                <label for="configApiKey">API Key *</label>
                                <div style="display: flex; gap: 8px;">
                                    <input type="password" id="configApiKey" class="form-input"
                                           placeholder="Enter your API key" style="flex: 1;" required>
                                    <button type="button" id="deleteApiKeyBtn" class="btn-secondary" title="Delete saved API key">✕</button>
                                </div>
                                <small>Required to publish statements. Stored locally in your browser — not included in config.json export.</small>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Save Configuration</button>
                            <button type="button" id="resetConfigBtn" class="btn btn-secondary">Reset to Defaults</button>
                            <button type="button" id="exportConfigBtn" class="btn btn-secondary">Export JSON</button>
                        </div>
                    </form>

                    <div id="configMessage" class="message" style="display: none;"></div>
                </div>
            </div>
        `;
    }

    private renderPeersList(): string {
        if (!this.config.sync.peers || this.config.sync.peers.length === 0) {
            return '<p class="no-peers">No peers configured yet.</p>';
        }

        return this.config.sync.peers.map((peer, index) => `
            <div class="peer-item" data-index="${index}">
                <div class="peer-header">
                    <h4>Peer ${index + 1}</h4>
                    <button type="button" class="btn-icon delete-peer" data-index="${index}" title="Delete peer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <div class="form-group">
                    <label for="peerDomain${index}">Domain *</label>
                    <input type="text" id="peerDomain${index}" class="form-input peer-domain" 
                           value="${this.escapeHtml(peer.domain)}" required 
                           data-index="${index}">
                </div>

                <div class="form-group">
                    <label for="peerLastSync${index}">Last Sync Time</label>
                    <input type="datetime-local" id="peerLastSync${index}" class="form-input peer-last-sync"
                           value="${peer.lastSyncTime ? this.formatDateTimeLocal(peer.lastSyncTime) : ''}"
                           data-index="${index}">
                    <small>Leave empty if never synced</small>
                </div>

                <div class="form-group">
                    <label for="peerLastEtag${index}">Last Sync ETag</label>
                    <input type="text" id="peerLastEtag${index}" class="form-input peer-last-etag"
                           value="${this.escapeHtml(peer.lastSyncEtag || '')}"
                           data-index="${index}">
                    <small>ETag from the last successful sync with this peer (optional)</small>
                </div>

                <div class="form-group">
                    <label>
                        <input type="checkbox" id="peerPulling${index}" class="peer-pulling"
                               ${peer.pullUpdates ? 'checked' : ''}
                               data-index="${index}">
                        Pull updates from this peer
                    </label>
                </div>

                <div class="form-group">
                    <label for="peerTrust${index}">Trust Score (0-1)</label>
                    <input type="number" id="peerTrust${index}" class="form-input peer-trust"
                           min="0" max="1" step="0.01"
                           value="${peer.trustScore}" required
                           data-index="${index}">
                    <small>Trust level: 0 = untrusted, 1 = fully trusted</small>
                </div>
            </div>
        `).join('');
    }

    private attachEventListeners(): void {
        const form = document.getElementById('configForm') as HTMLFormElement;
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveConfig();
            });
        }

        const addPeerBtn = document.getElementById('addPeerBtn');
        if (addPeerBtn) {
            addPeerBtn.addEventListener('click', () => this.addPeer());
        }

        const resetBtn = document.getElementById('resetConfigBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetConfig());
        }

        const exportBtn = document.getElementById('exportConfigBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportConfig());
        }

        // API key input - save on change
        const apiKeyInput = document.getElementById('configApiKey') as HTMLInputElement;
        if (apiKeyInput) {
            apiKeyInput.addEventListener('input', () => {
                const apiKey = apiKeyInput.value.trim();
                if (apiKey) {
                    this.saveApiKey(apiKey);
                }
            });
        }

        // Delete API key button
        const deleteApiKeyBtn = document.getElementById('deleteApiKeyBtn');
        if (deleteApiKeyBtn) {
            deleteApiKeyBtn.addEventListener('click', () => this.deleteApiKey());
        }

        // Load saved API key
        this.loadApiKey();

        // Attach delete peer listeners
        this.attachPeerDeleteListeners();
    }

    private attachPeerDeleteListeners(): void {
        document.querySelectorAll('.delete-peer').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt((e.currentTarget as HTMLElement).dataset.index || '0');
                this.deletePeer(index);
            });
        });
    }

    private addPeer(): void {
        const newPeer: PeerInfo = {
            domain: '',
            pullUpdates: true,
            trustScore: 0.5
        };

        this.config.sync.peers.push(newPeer);
        this.updatePeersList();
    }

    private deletePeer(index: number): void {
        if (confirm('Are you sure you want to delete this peer?')) {
            this.config.sync.peers.splice(index, 1);
            this.updatePeersList();
        }
    }

    private updatePeersList(): void {
        const peersList = document.getElementById('peersList');
        if (peersList) {
            peersList.innerHTML = this.renderPeersList();
            this.attachPeerDeleteListeners();
        }
    }

    private collectFormData(): AppConfig {
        // Collect peers data
        const peers: PeerInfo[] = [];
        document.querySelectorAll('.peer-item').forEach((item) => {
            const index = parseInt((item as HTMLElement).dataset.index || '0');
            const domain = (document.getElementById(`peerDomain${index}`) as HTMLInputElement)?.value || '';
            const lastSyncInput = (document.getElementById(`peerLastSync${index}`) as HTMLInputElement)?.value;
            const lastEtag = (document.getElementById(`peerLastEtag${index}`) as HTMLInputElement)?.value;
            const isPulling = (document.getElementById(`peerPulling${index}`) as HTMLInputElement)?.checked || false;
            const trustScore = parseFloat((document.getElementById(`peerTrust${index}`) as HTMLInputElement)?.value || '0.5');

            if (domain) {
                peers.push({
                    domain,
                    lastSyncTime: lastSyncInput ? new Date(lastSyncInput).toISOString() : undefined,
                    lastSyncEtag: lastEtag || undefined,
                    pullUpdates: isPulling,
                    trustScore
                });
            }
        });

        return {
            branding: {
                logo: (document.getElementById('brandingLogo') as HTMLInputElement).value,
                title: (document.getElementById('brandingTitle') as HTMLInputElement).value,
                subtitle: (document.getElementById('brandingSubtitle') as HTMLInputElement).value
            },
            statementsPath: (document.getElementById('statementsPath') as HTMLInputElement).value,
            editor: {
                defaults: {
                    domain: (document.getElementById('editorDefaultDomain') as HTMLInputElement).value,
                    author: (document.getElementById('editorDefaultAuthor') as HTMLInputElement).value
                },
                api: {
                    endpoint: (document.getElementById('editorApiEndpoint') as HTMLInputElement).value,
                    sourceEndpoint: (document.getElementById('editorSourceEndpoint') as HTMLInputElement).value
                }
            },
            sync: {
                peers,
                cronSchedule: (document.getElementById('syncCronSchedule') as HTMLInputElement).value
            }
        };
    }

    private async saveConfig(): Promise<void> {
        try {
            const newConfig = this.collectFormData();
            
            // Validate the configuration
            if (!this.validateConfig(newConfig)) {
                this.showMessage('Please fix validation errors before saving.', 'error');
                return;
            }

            // In a real application, you would send this to a backend API
            // For now, we'll just download it as a file
            const configJson = JSON.stringify(newConfig, null, 2);
            
            // Update internal config
            this.config = newConfig;

            // Download the config file
            this.downloadConfigFile(configJson);

            this.showMessage('Configuration saved successfully! Download the config.json file and replace the existing one.', 'success');
        } catch (error) {
            console.error('Error saving config:', error);
            this.showMessage('Error saving configuration: ' + (error as Error).message, 'error');
        }
    }

    private validateConfig(config: AppConfig): boolean {
        // Basic validation
        if (!config.branding.logo || !config.branding.title) {
            this.showMessage('Branding logo and title are required.', 'error');
            return false;
        }

        if (!config.editor.defaults.domain || !config.editor.defaults.author) {
            this.showMessage('Default domain and default author are required.', 'error');
            return false;
        }

        if (!config.sync.cronSchedule) {
            this.showMessage('Sync cron schedule is required.', 'error');
            return false;
        }

        // Validate peers
        for (const peer of config.sync.peers) {
            if (!peer.domain) {
                this.showMessage('All peers must have a domain.', 'error');
                return false;
            }
            if (peer.trustScore < 0 || peer.trustScore > 1) {
                this.showMessage('Trust scores must be between 0 and 1.', 'error');
                return false;
            }
        }

        return true;
    }

    private downloadConfigFile(content: string): void {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    private resetConfig(): void {
        if (confirm('Are you sure you want to reset to the current configuration? This will discard unsaved changes.')) {
            this.renderConfigForm();
            this.attachEventListeners();
            this.showMessage('Configuration reset to current values.', 'success');
        }
    }

    private exportConfig(): void {
        const config = this.collectFormData();
        const configJson = JSON.stringify(config, null, 2);
        this.downloadConfigFile(configJson);
        this.showMessage('Configuration exported successfully!', 'success');
    }

    private showMessage(message: string, type: 'success' | 'error'): void {
        const messageEl = document.getElementById('configMessage');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `message message-${type}`;
            messageEl.style.display = 'block';

            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 5000);
        }
    }

    private saveApiKey(apiKey: string): void {
        try {
            localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
        } catch (error) {
            console.error('Failed to save API key:', error);
        }
    }

    private loadApiKey(): void {
        try {
            const savedKey = localStorage.getItem(this.API_KEY_STORAGE_KEY);
            if (savedKey) {
                const input = document.getElementById('configApiKey') as HTMLInputElement;
                if (input) input.value = savedKey;
            }
        } catch (error) {
            console.error('Failed to load API key:', error);
        }
    }

    private deleteApiKey(): void {
        try {
            localStorage.removeItem(this.API_KEY_STORAGE_KEY);
            const input = document.getElementById('configApiKey') as HTMLInputElement;
            if (input) input.value = '';
            this.showMessage('API key deleted successfully.', 'success');
        } catch (error: any) {
            this.showMessage(`Failed to delete API key: ${error.message}`, 'error');
        }
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    private formatDateTimeLocal(isoString: string): string {
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
}