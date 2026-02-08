import { StatementViewer } from './StatementViewer.js';
import { loadConfig, applyBranding } from './config-loader.js';

let viewerInstance: StatementViewer;

document.addEventListener('DOMContentLoaded', async () => {
    // Detect which config to load based on URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const configParam = urlParams.get('config') || 'default';
    const configFile = configParam === 'companies' ? './config-companies.json' : './config.json';
    
    const config = await loadConfig(configFile);
    applyBranding(config);
    
    viewerInstance = new StatementViewer(config.statementsPath);
    
    // Make the viewer instance globally accessible for verification statement links
    (window as any).viewVerificationStatement = (hash: string) => {
        if (viewerInstance) {
            viewerInstance.showStatementByHash(hash);
        }
    };
    
    // Make the viewer instance globally accessible for superseding statement links
    (window as any).viewSupersedingStatement = (hash: string) => {
        if (viewerInstance) {
            viewerInstance.showStatementByHash(hash);
        }
    };
});