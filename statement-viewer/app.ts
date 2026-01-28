import { StatementViewer } from './StatementViewer.js';
import type { AppConfig } from './types.js';

let viewerInstance: StatementViewer;

async function loadConfig(): Promise<AppConfig> {
    try {
        const response = await fetch('./config.json');
        return await response.json();
    } catch (error) {
        console.error('Failed to load config.json, using defaults:', error);
        // Return default config if loading fails
        return {
            branding: {
                logo: 'logo.png',
                title: 'globalcoordination.org',
                subtitle: 'Statement Viewer'
            },
            editor: {
                defaults: {
                    domain: 'mofa.country-a.com',
                    author: 'Ministry of Foreign Affairs of Country A'
                },
                api: {
                    endpoint: 'https://api.country-a.com/update',
                    sourceEndpoint: 'https://mofa.country-a.com'
                }
            }
        };
    }
}

function applyBranding(config: AppConfig) {
    // Update logo
    const logos = document.querySelectorAll('.header-logo');
    logos.forEach(logo => {
        if (logo instanceof HTMLImageElement) {
            logo.src = config.branding.logo;
        }
    });
    
    // Update title and subtitle
    const titleElements = document.querySelectorAll('.header-left h1');
    titleElements.forEach(titleEl => {
        const link = titleEl.querySelector('a');
        const subtitleSpan = titleEl.querySelector('.subtitle');
        if (link) {
            link.textContent = config.branding.title;
        }
        if (subtitleSpan) {
            subtitleSpan.textContent = config.branding.subtitle;
        }
    });
    
    // Update page title
    document.title = `${config.branding.subtitle} - ${config.branding.title}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    const config = await loadConfig();
    applyBranding(config);
    
    viewerInstance = new StatementViewer();
    
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