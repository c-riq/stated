import { StatementEditor } from './StatementEditor.js';
import { loadConfig, applyBranding } from './config-loader.js';

document.addEventListener('DOMContentLoaded', async () => {
    const config = await loadConfig('./config.json');
    applyBranding(config);
    
    new StatementEditor(config);
});