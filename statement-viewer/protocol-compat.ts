// Protocol version compatibility: v5_1 (statements specify "5") and v5.2

import {
    parseVote,
    parseStatement as parseStatementLib,
    parseResponseContent,
    parseOrganisationVerification,
    parsePDFSigning,
    parseRating
} from 'stated-protocol';
import type {
    OrganisationVerification,
    PDFSigning,
    Rating,
    Vote,
    ResponseContent
} from 'stated-protocol';

import {
    parseVote as parseVote_v5_1,
    parseStatement as parseStatementLib_v5_1,
    parseResponseContent as parseResponseContent_v5_1,
    parseOrganisationVerification as parseOrganisationVerification_v5_1,
    parsePDFSigning as parsePDFSigning_v5_1,
    parseRating as parseRating_v5_1
} from 'stated-protocol-v5.1';
import type {
    OrganisationVerification as OrganisationVerification_v5_1,
    PDFSigning as PDFSigning_v5_1,
    Rating as Rating_v5_1,
    Vote as Vote_v5_1,
    ResponseContent as ResponseContent_v5_1
} from 'stated-protocol-v5.1';

type ProtocolVersion = '5' | '5.1' | '5.2';

export type OrganisationVerificationCompat =
    | (OrganisationVerification & { _version: '5.2' })
    | (OrganisationVerification_v5_1 & { _version: '5' | '5.1'; pictureHash?: string });

export type PDFSigningCompat =
    | (PDFSigning & { _version: '5.2' })
    | (PDFSigning_v5_1 & { _version: '5' | '5.1'; hash?: string });

export type RatingCompat =
    | (Rating & { _version: '5.2' })
    | (Rating_v5_1 & { _version: '5' | '5.1' });

export type VoteCompat =
    | (Vote & { _version: '5.2' })
    | (Vote_v5_1 & { _version: '5' | '5.1' });

export type ResponseContentCompat =
    | (ResponseContent & { _version: '5.2' })
    | (ResponseContent_v5_1 & { _version: '5' | '5.1' });

function isV5_1Version(version?: string): version is '5' | '5.1' {
    return version === '5' || version === '5.1';
}

export function parseStatementCompat(statement: { statement: string }): ReturnType<typeof parseStatementLib> & { formatVersion: string } {
    // Try v5.1 parser first (supports version 5 and 5.1)
    try {
        const parsed = parseStatementLib_v5_1(statement);
        return { ...parsed, formatVersion: parsed.formatVersion };
    } catch (e) {
        // Fall back to v5.2 parser
        const parsed = parseStatementLib(statement);
        return { ...parsed, formatVersion: parsed.formatVersion };
    }
}

export function parseOrganisationVerificationCompat(
    content: string,
    formatVersion: string
): OrganisationVerificationCompat {
    if (isV5_1Version(formatVersion)) {
        return { ...parseOrganisationVerification_v5_1(content), _version: formatVersion };
    }
    return { ...parseOrganisationVerification(content), _version: '5.2' };
}

export function parsePDFSigningCompat(
    content: string,
    formatVersion: string
): PDFSigningCompat {
    if (isV5_1Version(formatVersion)) {
        return { ...parsePDFSigning_v5_1(content), _version: formatVersion };
    }
    return { ...parsePDFSigning(content), _version: '5.2' };
}

export function parseVoteCompat(
    content: string,
    formatVersion: string
): VoteCompat {
    if (isV5_1Version(formatVersion)) {
        return { ...parseVote_v5_1(content), _version: formatVersion };
    }
    return { ...parseVote(content), _version: '5.2' };
}

export function parseResponseContentCompat(
    content: string,
    formatVersion: string
): ResponseContentCompat {
    if (isV5_1Version(formatVersion)) {
        return { ...parseResponseContent_v5_1(content), _version: formatVersion };
    }
    return { ...parseResponseContent(content), _version: '5.2' };
}

export function parseRatingCompat(
    content: string,
    formatVersion: string
): RatingCompat {
    if (isV5_1Version(formatVersion)) {
        return { ...parseRating_v5_1(content), _version: formatVersion };
    }
    return { ...parseRating(content), _version: '5.2' };
}

export function extractPdfHash(
    pdfSigningData: PDFSigningCompat,
    attachments?: string[]
): string {
    if (pdfSigningData._version === '5' || pdfSigningData._version === '5.1') {
        return pdfSigningData.hash || '';
    }
    return attachments && attachments[0] ? attachments[0].split('.')[0] : '';
}

export function extractProfilePicture(
    verification: OrganisationVerificationCompat,
    attachments?: string[]
): string | undefined {
    if (verification._version === '5' || verification._version === '5.1') {
        return verification.pictureHash;
    }
    return attachments && attachments[0];
}