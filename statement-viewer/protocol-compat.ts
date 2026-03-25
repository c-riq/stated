// Protocol version migration: Parse any version (5, 5.1, 5.2, 5.3) and migrate to v5.3 format
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
    Statement,
    OrganisationVerification,
    PersonVerification,
    Rating,
    Vote,
    ResponseContent,
    Poll,
    DisputeAuthenticity,
    DisputeContent,
    Observation,
    PDFSigning
} from 'stated-protocol-v5.3';

import { parseStatement as parseStatementLib_v5_2 } from 'stated-protocol-v5.2';

import {
    parseOrganisationVerification as parseOrganisationVerification_v5_1,
    parsePDFSigning as parsePDFSigning_v5_1,
    parsePersonVerification as parsePersonVerification_v5_1,
    parseStatement as parseStatementLib_v5_1
} from 'stated-protocol-v5.1';
import type {
    OrganisationVerification as OrganisationVerification_v5_1,
    PDFSigning as PDFSigning_v5_1,
    PersonVerification as PersonVerification_v5_1
} from 'stated-protocol-v5.1';

export type SupportedVersion = '5' | '5.1' | '5.2' | '5.3';

/**
 * Parsed statement in v5.3 format with migration metadata
 */
export type ParsedStatement = {
    /** The original statement string (for hash/crypto verification) */
    originalStatement: string;
    /** The original format version detected */
    originalVersion: SupportedVersion;
    /** Statement metadata in v5.3 format */
    statement: Statement & { type?: string; formatVersion: string };
    /** Migrated attachments array (from inline fields for v5/v5.1, or from statement.attachments for v5.2+) */
    migratedAttachments?: string[];
};

/**
 * Parse any statement version and migrate to v5.3 format.
 * Preserves original statement string for hash/crypto verification.
 * Migration is lossless - all data preserved in v5.3 structure.
 */
export function parseStatement(statementString: string): ParsedStatement {
    // Try parsing with each version parser
    let parsed: Statement & { type?: string; formatVersion: string };
    let version: SupportedVersion;

    try {
        parsed = parseStatementLib_v5_3({ statement: statementString });
        version = '5.3';
    } catch (e) {
        try {
            parsed = parseStatementLib_v5_2({ statement: statementString });
            version = '5.2';
        } catch (e) {
            parsed = parseStatementLib_v5_1({ statement: statementString });
            version = parsed.formatVersion === '5' ? '5' : '5.1';
        }
    }

    // Migrate inline fields to attachments for v5/v5.1 statements
    let migratedAttachments: string[] | undefined = parsed.attachments;

    if ((version === '5' || version === '5.1') && parsed.type) {
        if (parsed.type === 'organisation_verification') {
            const orgData = parseOrganisationVerification_v5_1(parsed.content);
            if (orgData.pictureHash && !migratedAttachments) {
                migratedAttachments = [orgData.pictureHash];
            }
        } else if (parsed.type === 'person_verification') {
            const personData = parsePersonVerification_v5_1(parsed.content);
            if (personData.picture && !migratedAttachments) {
                migratedAttachments = [personData.picture];
            }
        } else if (parsed.type === 'sign_pdf') {
            const pdfData = parsePDFSigning_v5_1(parsed.content);
            if (pdfData.hash && !migratedAttachments) {
                migratedAttachments = [pdfData.hash];
            }
        }
    }

    return {
        originalStatement: statementString,
        originalVersion: version,
        statement: parsed,
        migratedAttachments
    };
}

/**
 * Parse typed statement content in v5.3 format
 */
export function parseTypedContent(
    content: string,
    type: string,
    version: SupportedVersion
): OrganisationVerification | PersonVerification | Vote | Rating | Poll | 
   ResponseContent | DisputeAuthenticity | DisputeContent | PDFSigning | Observation {
    
    switch (type) {
        case 'organisation_verification':
            return version === '5' || version === '5.1'
                ? parseOrganisationVerification_v5_1(content)
                : parseOrganisationVerification_v5_3(content);
        
        case 'person_verification':
            return version === '5' || version === '5.1'
                ? parsePersonVerification_v5_1(content)
                : parsePersonVerification_v5_3(content);
        
        case 'sign_pdf':
            return version === '5' || version === '5.1'
                ? parsePDFSigning_v5_1(content)
                : parsePDFSigning_v5_3(content);
        
        case 'vote':
            return parseVote_v5_3(content);
        
        case 'rating':
            return parseRating_v5_3(content);
        
        case 'poll':
            return parsePoll_v5_3(content, version);
        
        case 'response':
            return parseResponseContent_v5_3(content);
        
        case 'dispute_statement_authenticity':
            return parseDisputeAuthenticity_v5_3(content);
        
        case 'dispute_statement_content':
            return parseDisputeContent_v5_3(content);
        
        case 'observation':
            if (version !== '5.3') {
                throw new Error(`Observation type only available in version 5.3, got ${version}`);
            }
            return parseObservation_v5_3(content);
        
        default:
            throw new Error(`Unknown statement type: ${type}`);
    }
}

/**
 * Extract attachment data based on statement type and version.
 * Handles migration from inline fields (v5/v5.1) to attachments (v5.2+).
 */
export function extractAttachment(
    parsedStatement: ParsedStatement,
    index: number = 0
): string | undefined {
    return parsedStatement.migratedAttachments?.[index];
}

/**
 * Get the PDF hash from a PDF signing statement.
 * Handles both v5.1 format (hash in content) and v5.2+ format (hash in attachments).
 */
export function getPdfHash(parsedStatement: ParsedStatement): string {
    if (!parsedStatement.statement.type || parsedStatement.statement.type !== 'sign_pdf') {
        throw new Error('Statement is not a PDF signing statement');
    }

    if (parsedStatement.originalVersion === '5' || parsedStatement.originalVersion === '5.1') {
        const pdfData = parsePDFSigning_v5_1(parsedStatement.statement.content) as PDFSigning_v5_1;
        return pdfData.hash || '';
    }

    return parsedStatement.migratedAttachments?.[0]?.split('.')[0] || '';
}

/**
 * Get the organization logo from an organization verification statement.
 * Handles both v5.1 format (pictureHash in content) and v5.2+ format (logo in attachments).
 */
export function getOrganizationLogo(parsedStatement: ParsedStatement): string | undefined {
    if (!parsedStatement.statement.type || parsedStatement.statement.type !== 'organisation_verification') {
        throw new Error('Statement is not an organization verification statement');
    }

    if (parsedStatement.originalVersion === '5' || parsedStatement.originalVersion === '5.1') {
        const orgData = parseOrganisationVerification_v5_1(parsedStatement.statement.content) as OrganisationVerification_v5_1;
        return orgData.pictureHash;
    }

    return parsedStatement.migratedAttachments?.[0];
}

/**
 * Get the person picture from a person verification statement.
 * Handles both v5.1 format (picture in content) and v5.2+ format (picture in attachments).
 */
export function getPersonPicture(parsedStatement: ParsedStatement): string | undefined {
    if (!parsedStatement.statement.type || parsedStatement.statement.type !== 'person_verification') {
        throw new Error('Statement is not a person verification statement');
    }

    if (parsedStatement.originalVersion === '5' || parsedStatement.originalVersion === '5.1') {
        const personData = parsePersonVerification_v5_1(parsedStatement.statement.content) as PersonVerification_v5_1;
        return personData.picture;
    }

    return parsedStatement.migratedAttachments?.[0];
}
