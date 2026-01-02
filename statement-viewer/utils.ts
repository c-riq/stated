import { ParsedStatement } from './types.js';
import { pollKeys, organisationVerificationKeys, personVerificationKeys, voteKeys, disputeAuthenticityKeys, disputeContentKeys, responseKeys, PDFSigningKeys, ratingKeys } from './lib/index.js';

export function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    
    return date.toLocaleDateString();
}

export function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function sortStatementsByTime(statements: ParsedStatement[], ascending: boolean = false): ParsedStatement[] {
    return [...statements].sort((a: ParsedStatement, b: ParsedStatement) => {
        const timeA = new Date(a.time || 0);
        const timeB = new Date(b.time || 0);
        return ascending ? timeA.getTime() - timeB.getTime() : timeB.getTime() - timeA.getTime();
    });
}

export function styleTypedStatementContent(content: string): string {
    if (!content.trim().startsWith('Type:')) {
        return escapeHtml(content);
    }

    const allRegexes = [
        pollKeys,
        organisationVerificationKeys,
        personVerificationKeys,
        voteKeys,
        disputeAuthenticityKeys,
        disputeContentKeys,
        responseKeys,
        PDFSigningKeys,
        ratingKeys
    ];

    let styledContent = escapeHtml(content);
    
    allRegexes.forEach(regex => {
        styledContent = styledContent.replace(regex, (match) => {
            return `<span class="statement-keyword">${match}</span>`;
        });
    });

    return styledContent;
}