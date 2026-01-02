import { StatementViewer } from './StatementViewer.js';

let viewerInstance: StatementViewer;

document.addEventListener('DOMContentLoaded', () => {
    viewerInstance = new StatementViewer();
    
    // Make the viewer instance globally accessible for verification statement links
    (window as any).viewVerificationStatement = (hash: string) => {
        if (viewerInstance) {
            viewerInstance.showStatementByHash(hash);
        }
    };
});