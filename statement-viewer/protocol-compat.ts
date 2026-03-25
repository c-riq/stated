// Protocol version migration: Parse any version (5, 5.1, 5.2, 5.3) and migrate to v5.3 format
// v5 -> v5.1: Minor fixes
// v5.1 -> v5.2: Attachments moved from content to separate field
// v5.2 -> v5.3: Added observation statement type

import {
    parseStatement as parseStatementLib_v5_3,
    parseSignedStatement,
    sha256,
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
    PDFSigning,
    StatementTypeValue
} from 'stated-protocol-v5.3';
import type { SupportedLanguage } from 'stated-protocol-v5.3/dist/constants';

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
 * Fully parsed statement in v5.3 format with all typed content parsed.
 * This is the ONLY type clients should use.
 */
export type FullyParsedStatement = {
    /** The original statement string (for hash/crypto verification) */
    raw: string;
    /** The original format version detected */
    originalVersion: SupportedVersion;
    /** Statement hash for verification */
    hash: string;
    /** Basic statement metadata */
    domain: string;
    author: string;
    time: Date;
    tags?: string[];
    content: string;
    type?: StatementTypeValue;
    formatVersion: string;
    supersededStatement?: string;
    translations?: Partial<Record<SupportedLanguage, string>>;
    /** Migrated attachments (from inline fields for v5/v5.1, or from statement.attachments for v5.2+) */
    attachments?: string[];
    /** Cryptographic signature info (if signed) */
    signature?: {
        signature: string;
        publicKey: string;
        algorithm: string;
    };
    /** Parsed typed content in v5.3 format (if statement has a type) */
    parsedContent?:
        | { type: 'organisation_verification'; data: OrganisationVerification }
        | { type: 'person_verification'; data: PersonVerification }
        | { type: 'sign_pdf'; data: PDFSigning }
        | { type: 'vote'; data: Vote }
        | { type: 'rating'; data: Rating }
        | { type: 'poll'; data: Poll }
        | { type: 'response'; data: ResponseContent }
        | { type: 'dispute_statement_authenticity'; data: DisputeAuthenticity }
        | { type: 'dispute_statement_content'; data: DisputeContent }
        | { type: 'observation'; data: Observation };
};

/**
 * Parse any statement version and migrate to v5.3 format.
 * Preserves original statement string for hash/crypto verification.
 * Migration is lossless - all data preserved in v5.3 structure.
 */
/**
 * Parse any statement version and return fully parsed v5.3 format.
 * This is the ONLY function clients should call.
 * Returns everything needed: metadata, typed content, attachments, crypto info.
 */
export function parseStatement(statementString: string): FullyParsedStatement {
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

    // Parse cryptographic signature if present
    let signatureInfo: { signature: string; publicKey: string; algorithm: string } | undefined;
    try {
        const signedParsed = parseSignedStatement(statementString);
        if (signedParsed) {
            signatureInfo = {
                signature: signedParsed.signature,
                publicKey: signedParsed.publicKey,
                algorithm: signedParsed.algorithm
            };
        }
    } catch {
        // Not a signed statement
    }

    // Parse typed content if statement has a type
    let parsedContent: FullyParsedStatement['parsedContent'];
    if (parsed.type) {
        try {
            switch (parsed.type) {
                case 'organisation_verification':
                    parsedContent = {
                        type: 'organisation_verification',
                        data: parseOrganisationVerificationContent(parsed.content, version)
                    };
                    break;
                case 'person_verification':
                    parsedContent = {
                        type: 'person_verification',
                        data: parsePersonVerificationContent(parsed.content, version)
                    };
                    break;
                case 'sign_pdf':
                    parsedContent = {
                        type: 'sign_pdf',
                        data: parsePDFSigningContent(parsed.content, version)
                    };
                    break;
                case 'vote':
                    parsedContent = {
                        type: 'vote',
                        data: parseVoteContent(parsed.content, version)
                    };
                    break;
                case 'rating':
                    parsedContent = {
                        type: 'rating',
                        data: parseRatingContent(parsed.content, version)
                    };
                    break;
                case 'poll':
                    parsedContent = {
                        type: 'poll',
                        data: parsePollContent(parsed.content, version)
                    };
                    break;
                case 'response':
                    parsedContent = {
                        type: 'response',
                        data: parseResponseContentData(parsed.content, version)
                    };
                    break;
                case 'dispute_statement_authenticity':
                    parsedContent = {
                        type: 'dispute_statement_authenticity',
                        data: parseDisputeAuthenticityContent(parsed.content, version)
                    };
                    break;
                case 'dispute_statement_content':
                    parsedContent = {
                        type: 'dispute_statement_content',
                        data: parseDisputeContentData(parsed.content, version)
                    };
                    break;
                case 'observation':
                    parsedContent = {
                        type: 'observation',
                        data: parseObservationContent(parsed.content, version)
                    };
                    break;
            }
        } catch (error) {
            console.error(`Error parsing typed content for type ${parsed.type}:`, error);
        }
    }

    return {
        raw: statementString,
        originalVersion: version,
        hash: sha256(statementString),
        domain: parsed.domain,
        author: parsed.author,
        time: parsed.time,
        tags: parsed.tags,
        content: parsed.content,
        type: parsed.type as StatementTypeValue | undefined,
        formatVersion: parsed.formatVersion,
        supersededStatement: parsed.supersededStatement,
        translations: parsed.translations,
        attachments: migratedAttachments,
        signature: signatureInfo,
        parsedContent
    };
}

export function parseOrganisationVerificationContent(content: string, version: SupportedVersion): OrganisationVerification {
    if (version === '5' || version === '5.1') {
        // Parse with v5.1 parser and migrate to v5.3 format
        const v5_1_data = parseOrganisationVerification_v5_1(content);
        // v5.1 has pictureHash in content, v5.3 moved it to attachments
        // Construct v5.3 OrganisationVerification without pictureHash
        const v5_3_data: OrganisationVerification = {
            name: v5_1_data.name,
            englishName: v5_1_data.englishName,
            country: v5_1_data.country,
            city: v5_1_data.city,
            province: v5_1_data.province,
            legalForm: v5_1_data.legalForm,
            department: v5_1_data.department,
            domain: v5_1_data.domain,
            foreignDomain: v5_1_data.foreignDomain,
            serialNumber: v5_1_data.serialNumber,
            confidence: v5_1_data.confidence,
            reliabilityPolicy: v5_1_data.reliabilityPolicy,
            employeeCount: v5_1_data.employeeCount,
            latitude: v5_1_data.latitude,
            longitude: v5_1_data.longitude,
            population: v5_1_data.population,
            publicKey: v5_1_data.publicKey
        };
        return v5_3_data;
    }
    return parseOrganisationVerification_v5_3(content);
}

export function parsePersonVerificationContent(content: string, version: SupportedVersion): PersonVerification {
    if (version === '5' || version === '5.1') {
        // Parse with v5.1 parser and migrate to v5.3 format
        const v5_1_data = parsePersonVerification_v5_1(content);
        // v5.1 has picture in content, v5.3 moved it to attachments
        // Construct v5.3 PersonVerification without picture
        // PersonVerification requires either ownDomain or foreignDomain
        if (v5_1_data.ownDomain) {
            const v5_3_data: PersonVerification = {
                name: v5_1_data.name,
                countryOfBirth: v5_1_data.countryOfBirth,
                cityOfBirth: v5_1_data.cityOfBirth,
                dateOfBirth: v5_1_data.dateOfBirth,
                jobTitle: v5_1_data.jobTitle,
                employer: v5_1_data.employer,
                verificationMethod: v5_1_data.verificationMethod,
                confidence: v5_1_data.confidence,
                reliabilityPolicy: v5_1_data.reliabilityPolicy,
                publicKey: v5_1_data.publicKey,
                ownDomain: v5_1_data.ownDomain,
                foreignDomain: v5_1_data.foreignDomain
            };
            return v5_3_data;
        } else {
            const v5_3_data: PersonVerification = {
                name: v5_1_data.name,
                countryOfBirth: v5_1_data.countryOfBirth,
                cityOfBirth: v5_1_data.cityOfBirth,
                dateOfBirth: v5_1_data.dateOfBirth,
                jobTitle: v5_1_data.jobTitle,
                employer: v5_1_data.employer,
                verificationMethod: v5_1_data.verificationMethod,
                confidence: v5_1_data.confidence,
                reliabilityPolicy: v5_1_data.reliabilityPolicy,
                publicKey: v5_1_data.publicKey,
                foreignDomain: v5_1_data.foreignDomain!,
                ownDomain: v5_1_data.ownDomain
            };
            return v5_3_data;
        }
    }
    return parsePersonVerification_v5_3(content);
}

export function parsePDFSigningContent(content: string, version: SupportedVersion): PDFSigning {
    if (version === '5' || version === '5.1') {
        // v5.1 PDFSigning has a hash field, but v5.3 is an empty record
        // We just parse it but return the v5.3 type (empty record)
        parsePDFSigning_v5_1(content);
        return {};
    }
    return parsePDFSigning_v5_3(content);
}

export function parseVoteContent(content: string, version: SupportedVersion): Vote {
    return parseVote_v5_3(content);
}

export function parseRatingContent(content: string, version: SupportedVersion): Rating {
    return parseRating_v5_3(content);
}

export function parsePollContent(content: string, version: SupportedVersion): Poll {
    // Poll format is identical across all versions, just use v5.3 parser
    // Always pass '5.3' since that's what the v5.3 parser expects
    return parsePoll_v5_3(content, '5.3');
}

export function parseResponseContentData(content: string, version: SupportedVersion): ResponseContent {
    return parseResponseContent_v5_3(content);
}

export function parseDisputeAuthenticityContent(content: string, version: SupportedVersion): DisputeAuthenticity {
    return parseDisputeAuthenticity_v5_3(content);
}

export function parseDisputeContentData(content: string, version: SupportedVersion): DisputeContent {
    return parseDisputeContent_v5_3(content);
}

export function parseObservationContent(content: string, version: SupportedVersion): Observation {
    if (version !== '5.3') {
        throw new Error(`Observation type only available in version 5.3, got ${version}`);
    }
    return parseObservation_v5_3(content);
}

/**
 * Extract attachment data based on statement type and version.
 * Handles migration from inline fields (v5/v5.1) to attachments (v5.2+).
 */
export function extractAttachment(
    parsedStatement: { attachments?: string[] },
    index: number = 0
): string | undefined {
    return parsedStatement.attachments?.[index];
}

/**
 * Get the PDF hash from a PDF signing statement.
 */
export function getPdfHash(parsedStatement: { type?: string; attachments?: string[] }): string {
    if (parsedStatement.type !== 'sign_pdf') {
        throw new Error('Statement is not a PDF signing statement');
    }
    return parsedStatement.attachments?.[0]?.split('.')[0] || '';
}

/**
 * Get the organization logo from an organization verification statement.
 */
export function getOrganizationLogo(parsedStatement: { type?: string; attachments?: string[] }): string | undefined {
    if (parsedStatement.type !== 'organisation_verification') {
        throw new Error('Statement is not an organization verification statement');
    }
    return parsedStatement.attachments?.[0];
}

/**
 * Get the person picture from a person verification statement.
 */
export function getPersonPicture(parsedStatement: { type?: string; attachments?: string[] }): string | undefined {
    if (parsedStatement.type !== 'person_verification') {
        throw new Error('Statement is not a person verification statement');
    }
    return parsedStatement.attachments?.[0];
}
