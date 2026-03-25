// Protocol version compatibility: v5_1 (statements specify "5"), v5.2, and v5.3
// v5 -> v5.1: Minor fixes
// v5.1 -> v5.2: Attachments moved from content to separate field
// v5.2 -> v5.3: Added observation statement type 

import {
    parseStatement as parseStatementLib_v5_3,
    parseOrganisationVerification as parseOrganisationVerification_v5_3,
    parsePDFSigning as parsePDFSigning_v5_3,
    parsePersonVerification as parsePersonVerification_v5_3,
    parseVote as parseVote_v5_3,
    parseResponseContent as parseResponseContent_v5_3,
    parseRating as parseRating_v5_3,
    parsePoll as parsePoll_v5_3,
    parseDisputeAuthenticity as parseDisputeAuthenticity_v5_3,
    parseDisputeContent as parseDisputeContent_v5_3,
    parseObservation as parseObservation_v5_3
} from 'stated-protocol-v5.3';
import type {
    OrganisationVerification as OrganisationVerification_v5_3,
    PersonVerification as PersonVerification_v5_3,
    Rating as Rating_v5_3,
    Vote as Vote_v5_3,
    ResponseContent as ResponseContent_v5_3,
    Poll as Poll_v5_3,
    DisputeAuthenticity as DisputeAuthenticity_v5_3,
    DisputeContent as DisputeContent_v5_3,
    Observation as Observation_v5_3,
    PDFSigning as PDFSigning_v5_3
} from 'stated-protocol-v5.3';

import { parseStatement as parseStatementLib_v5_2 } from 'stated-protocol-v5.2';

import {
    parseOrganisationVerification as parseOrganisationVerification_v5_1,
    parsePDFSigning as parsePDFSigning_v5_1,
    parsePersonVerification as parsePersonVerification_v5_1,
    parseDisputeAuthenticity as parseDisputeAuthenticity_v5_1,
    parseDisputeContent as parseDisputeContent_v5_1,
    parseStatement as parseStatementLib_v5_1
} from 'stated-protocol-v5.1';
import type {
    OrganisationVerification as OrganisationVerification_v5_1,
    PDFSigning as PDFSigning_v5_1,
    PersonVerification as PersonVerification_v5_1,
    DisputeAuthenticity as DisputeAuthenticity_v5_1,
    DisputeContent as DisputeContent_v5_1
} from 'stated-protocol-v5.1';

export type SupportedVersion = '5' | '5.1' | '5.2' | '5.3';

export const PARSER_EQUIVALENCE_MAP = {
    Vote: {
        '5': parseVote_v5_3,
        '5.1': parseVote_v5_3,
        '5.2': parseVote_v5_3,
        '5.3': parseVote_v5_3
    },
    Rating: {
        '5': parseRating_v5_3,
        '5.1': parseRating_v5_3,
        '5.2': parseRating_v5_3,
        '5.3': parseRating_v5_3
    },
    ResponseContent: {
        '5': parseResponseContent_v5_3,
        '5.1': parseResponseContent_v5_3,
        '5.2': parseResponseContent_v5_3,
        '5.3': parseResponseContent_v5_3
    },
    Poll: {
        '5': parsePoll_v5_3,
        '5.1': parsePoll_v5_3,
        '5.2': parsePoll_v5_3,
        '5.3': parsePoll_v5_3
    },
    OrganisationVerification: {
        '5': parseOrganisationVerification_v5_1,
        '5.1': parseOrganisationVerification_v5_1,
        '5.2': parseOrganisationVerification_v5_3,
        '5.3': parseOrganisationVerification_v5_3
    },
    PDFSigning: {
        '5': parsePDFSigning_v5_1,
        '5.1': parsePDFSigning_v5_1,
        '5.2': parsePDFSigning_v5_3,
        '5.3': parsePDFSigning_v5_3
    },
    Statement: {
        '5': parseStatementLib_v5_1,
        '5.1': parseStatementLib_v5_1,
        '5.2': parseStatementLib_v5_2,
        '5.3': parseStatementLib_v5_3
    },
    PersonVerification: {
        '5': parsePersonVerification_v5_1,
        '5.1': parsePersonVerification_v5_1,
        '5.2': parsePersonVerification_v5_3,
        '5.3': parsePersonVerification_v5_3
    },
    DisputeAuthenticity: {
        '5': parseDisputeAuthenticity_v5_3,
        '5.1': parseDisputeAuthenticity_v5_3,
        '5.2': parseDisputeAuthenticity_v5_3,
        '5.3': parseDisputeAuthenticity_v5_3
    },
    DisputeContent: {
        '5': parseDisputeContent_v5_3,
        '5.1': parseDisputeContent_v5_3,
        '5.2': parseDisputeContent_v5_3,
        '5.3': parseDisputeContent_v5_3
    },
    Observation: {
        '5.3': parseObservation_v5_3
    }
} as const;

export type VersionedOrganisationVerification =
    | (OrganisationVerification_v5_3 & { statementVersion: '5.2' | '5.3' })
    | (OrganisationVerification_v5_1 & { statementVersion: '5' | '5.1' });

export type VersionedPDFSigning =
    | { statementVersion: '5.2' | '5.3' }
    | (PDFSigning_v5_1 & { statementVersion: '5' | '5.1' });

export type VersionedPersonVerification =
    | (PersonVerification_v5_3 & { statementVersion: '5.2' | '5.3' })
    | (PersonVerification_v5_1 & { statementVersion: '5' | '5.1' });

// Types that are EQUIVALENT across all versions - just add statementVersion
export type VersionedRating = Rating_v5_3 & { statementVersion: SupportedVersion };
export type VersionedVote = Vote_v5_3 & { statementVersion: SupportedVersion };
export type VersionedResponseContent = ResponseContent_v5_3 & { statementVersion: SupportedVersion };
export type VersionedPoll = Poll_v5_3 & { statementVersion: SupportedVersion };
export type VersionedDisputeAuthenticity = DisputeAuthenticity_v5_3 & { statementVersion: SupportedVersion };
export type VersionedDisputeContent = DisputeContent_v5_3 & { statementVersion: SupportedVersion };
export type VersionedObservation = Observation_v5_3 & { statementVersion: '5.3' };

function isV5_1Version(version: SupportedVersion): version is Extract<SupportedVersion, '5' | '5.1'> {
    return version === '5' || version === '5.1';
}

export function parseStatementCompat(statement: { statement: string }): ReturnType<typeof parseStatementLib_v5_3> & { formatVersion: string } {
    // Try parsing with v5.3 first (accepts "5.3")
    try {
        const parsed = parseStatementLib_v5_3(statement);
        return { ...parsed, formatVersion: parsed.formatVersion };
    } catch (e) {
        // Try v5.2 (accepts "5.2")
        try {
            const parsed = parseStatementLib_v5_2(statement);
            return { ...parsed, formatVersion: parsed.formatVersion };
        } catch (e) {
            // Try v5.1 (accepts "5" or "5.1")
            const parsed = parseStatementLib_v5_1(statement);
            return { ...parsed, formatVersion: parsed.formatVersion };
        }
    }
}

export function parseOrganisationVerificationCompat(
    content: string,
    formatVersion: SupportedVersion
): VersionedOrganisationVerification {
    const parser = PARSER_EQUIVALENCE_MAP.OrganisationVerification[formatVersion];
    
    if (isV5_1Version(formatVersion)) {
        const parsed = parser(content) as OrganisationVerification_v5_1;
        return { ...parsed, statementVersion: formatVersion };
    }
    const parsed = parser(content) as OrganisationVerification_v5_3;
    return { ...parsed, statementVersion: formatVersion };
}

export function parsePDFSigningCompat(
    content: string,
    formatVersion: SupportedVersion
): VersionedPDFSigning {
    if (isV5_1Version(formatVersion)) {
        const parser = PARSER_EQUIVALENCE_MAP.PDFSigning[formatVersion];
        const parsed = parser(content) as PDFSigning_v5_1;
        return { ...parsed, statementVersion: formatVersion };
    }
    const parser = PARSER_EQUIVALENCE_MAP.PDFSigning[formatVersion];
    parser(content);
    return { statementVersion: formatVersion };
}

export function parseVoteCompat(
    content: string,
    formatVersion: SupportedVersion
): VersionedVote {
    const parser = PARSER_EQUIVALENCE_MAP.Vote[formatVersion];
    return { ...parser(content), statementVersion: formatVersion };
}

export function parseResponseContentCompat(
    content: string,
    formatVersion: SupportedVersion
): VersionedResponseContent {
    const parser = PARSER_EQUIVALENCE_MAP.ResponseContent[formatVersion];
    return { ...parser(content), statementVersion: formatVersion };
}

export function parseRatingCompat(
    content: string,
    formatVersion: SupportedVersion
): VersionedRating {
    const parser = PARSER_EQUIVALENCE_MAP.Rating[formatVersion];
    return { ...parser(content), statementVersion: formatVersion };
}

export function parsePollCompat(
    content: string,
    formatVersion: SupportedVersion
): VersionedPoll {
    const parser = PARSER_EQUIVALENCE_MAP.Poll[formatVersion];
    return { ...parser(content, formatVersion), statementVersion: formatVersion };
}

export function parseObservationCompat(
    content: string,
    formatVersion: SupportedVersion
): VersionedObservation {
    if (formatVersion !== '5.3') {
        throw new Error(`Observation type only available in version 5.3, got ${formatVersion}`);
    }
    const parser = PARSER_EQUIVALENCE_MAP.Observation[formatVersion];
    return { ...parser(content), statementVersion: '5.3' };
}

export function extractPdfHash(
    pdfSigningData: VersionedPDFSigning,
    attachments?: string[]
): string {
    if (pdfSigningData.statementVersion === '5' || pdfSigningData.statementVersion === '5.1') {
        return pdfSigningData.hash || '';
    }
    return attachments && attachments[0] ? attachments[0].split('.')[0] : '';
}

export function extractProfilePicture(
    verification: VersionedOrganisationVerification,
    attachments?: string[]
): string | undefined {
    if (verification.statementVersion === '5' || verification.statementVersion === '5.1') {
        return verification.pictureHash;
    }
    return attachments && attachments[0];
}

export function parsePersonVerificationCompat(
    content: string,
    formatVersion: SupportedVersion
): VersionedPersonVerification {
    const parser = PARSER_EQUIVALENCE_MAP.PersonVerification[formatVersion];
    
    if (isV5_1Version(formatVersion)) {
        const parsed = parser(content) as PersonVerification_v5_1;
        return { ...parsed, statementVersion: formatVersion };
    }
    const parsed = parser(content) as PersonVerification_v5_3;
    return { ...parsed, statementVersion: formatVersion };
}

export function parseDisputeAuthenticityCompat(
    content: string,
    formatVersion: SupportedVersion
): VersionedDisputeAuthenticity {
    const parser = PARSER_EQUIVALENCE_MAP.DisputeAuthenticity[formatVersion];
    return { ...parser(content), statementVersion: formatVersion };
}

export function parseDisputeContentCompat(
    content: string,
    formatVersion: SupportedVersion
): VersionedDisputeContent {
    const parser = PARSER_EQUIVALENCE_MAP.DisputeContent[formatVersion];
    return { ...parser(content), statementVersion: formatVersion };
}

export function extractPersonPicture(
    verification: VersionedPersonVerification,
    attachments?: string[]
): string | undefined {
    if (verification.statementVersion === '5' || verification.statementVersion === '5.1') {
        return verification.picture;
    }
    return attachments && attachments[0];
}
