export interface ParsedStatement {
    raw: string;
    domain?: string;
    author?: string;
    time?: string;
    tags?: string[];
    content: string;
    type?: string;
    signature?: string;
    formatVersion?: string;
    attachments?: string[];
    supersededStatement?: string;
    supersededBy?: ParsedStatement;
    translations?: Record<string, string>;
    signatureVerified?: boolean;
    hashMatches?: boolean;
    isPeer?: boolean;
    peerDomain?: string;
    publicKey?: string;
}

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