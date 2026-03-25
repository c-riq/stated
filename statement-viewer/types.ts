import type { FullyParsedStatement } from './protocol-compat.js';

// ParsedStatement extends FullyParsedStatement with viewer-specific fields
export type ParsedStatement = Omit<FullyParsedStatement, 'time'> & {
    // Convert time to string for easier handling in the viewer
    time?: string;
    // Additional fields used by StatementViewer
    supersededBy?: ParsedStatement;
    signatureVerified?: boolean;
    hashMatches?: boolean;
    isPeer?: boolean;
    peerDomain?: string;
    publicKey?: string; // Extracted from signature for convenience
};

export interface Identity {
    domain: string;
    author: string;
    publicKey?: string;
    profilePicture?: string;
    verificationStatement?: ParsedStatement;
    isSelfVerified: boolean;
}

export interface VoteEntry {
    statement: ParsedStatement;
    vote: string;
    voteData: any;
}

export interface PDFSignatureEntry {
    statement: ParsedStatement;
    pdfHash: string;
    signatureData: any;
}

export interface RatingEntry {
    statement: ParsedStatement;
    rating: number;
    ratingData: any;
}

export interface SignatureInfo {
    algorithm: string;
    publicKey: string;
    hash: string;
    signature: string;
}

export interface StatementMaps {
    statementsByHash: Map<string, ParsedStatement>;
    responsesByHash: Map<string, ParsedStatement[]>;
    votesByPollHash: Map<string, VoteEntry[]>;
}

export interface AppConfig {
    branding: {
        logo: string;
        title: string;
        subtitle: string;
    };
    statementsPath: string;
    requestEmailPublicationByDefault: boolean;
    organisationName: string;
    organisationContactEmail: string;
    editor: {
        defaults: {
            domain: string;
            author: string;
        };
        api: {
            endpoint: string;
            sourceEndpoint: string;
        };
    };
}