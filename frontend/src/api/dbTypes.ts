enum StatementTypeDB {
    Statement = "statement",
    DisputeStatementAuthenticity = "dispute_statement_authenticity",
    Response = "response",
    OrganisationVerification = "organisation_verification",
    PersonVerification = "person_verification",
    Poll = "poll",
    Vote = "vote",
    Rating = "rating",
    SignPdf = "sign_pdf",
    Bounty = "bounty",
    DisputeStatementContent = "dispute_statement_content",
    Boycott = "boycott",
    Observation = "observation",
    Unsupported = "unsupported",
}

enum VerificationMethodDB {
    Api = "api",
    Dns = "dns",
}

type UnverifiedStatementDB = {
    id: number;
    statement: string;
    author: string;
    hash_b64: string;
    source_node_id: number | null;
    received_time: Date;
    source_verification_method: VerificationMethodDB | null;
    verification_retry_count: number | null;
};

type StatementDB = {
    id: number;
    type: StatementTypeDB;
    domain: string;
    author: string;
    statement: string;
    proclaimed_publication_time: Date | null;
    hash_b64: string;
    referenced_statement: string | null;
    tags: string | null;
    content: string;
    content_hash: string;
    source_node_id: number | null;
    first_verification_time: Date | null;
    latest_verification_time: Date | null;
    verification_method: VerificationMethodDB | null;
    derived_entity_created: boolean;
    derived_entity_creation_retry_count: number | null;
    superseded_statement: string | null;
};

type StatementWithSupersedingDB = StatementDB & {
    superseding_statement: string | null;
};

type VerificationLogDB = {
    id: number;
    statement_hash: string;
    t: Date;
    api: boolean;
    dns: boolean;
    txt: boolean;
};

type OrganisationVerificationDB = {
    id: number;
    statement_hash: string;
    verifier_domain: string;
    verified_domain: string | null;
    foreign_domain: string | null;
    name: string;
    legal_entity_type: string;
    serial_number: string | null;
    country: string;
    province: string | null;
    city: string | null;
    department: string | null;
    confidence: number | null;
};

type PersonVerificationDB = {
    id: number;
    statement_hash: string;
    verifier_domain: string;
    verified_domain: string | null;
    foreign_domain: string | null;
    name: string;
    birth_country: string;
    birth_city: string | null;
    birth_date: string | null;
};

type DomainOwnershipBeliefDB = {
    id: number;
    domain: string;
    name: string;
    name_confidence: number;
    legal_entity_type: string;
    legal_entity_type_confidence: number;
    country: string;
    country_confidence: number;
    province: string | null;
    province_confidence: number | null;
    city: string | null;
    city_confidence: number | null;
    reputation: number | null;
};

type VoteDB = {
    id: number;
    statement_hash: string;
    poll_hash: string;
    option: string;
    domain: string;
    qualified: boolean | null;
};

type PollDB = {
    id: number;
    statement_hash: string;
    participants_entity_type: string | null;
    participants_country: string | null;
    participants_city: string | null;
    deadline: Date | null;
};

type RatingDB = {
    id: number;
    statement_hash: string;
    organisation: string;
    domain: string;
    rating: number;
    comment: string;
};

type DisputeDB = {
    id: number;
    statement_hash: string;
    disputed_statement_hash: string;
    domain: string;
    p2p_node_id: number | null;
};

type P2PNodeDB = {
    id: number;
    domain: string;
    ip: string | null;
    first_seen: Date | null;
    last_seen: Date | null;
    reputation: number | null;
    last_received_statement_id: bigint | null;
    certificate_authority: string | null;
    fingerprint: string | null;
};

type MigrationDB = {
    id: number;
    created_at: Date;
    from_version: bigint;
    to_version: bigint;
};

type SSLCertCacheDB = {
    sha256: string;
    host: string | null;
    subject_o: string | null;
    subject_c: string | null;
    subject_st: string | null;
    subject_l: string | null;
    subject_cn: string | null;
    subject_serialnumber: string | null;
    subjectaltname: string | null;
    issuer_o: string | null;
    issuer_c: string | null;
    issuer_cn: string | null;
    valid_from: Date | null;
    valid_to: Date | null;
    first_seen: Date | null;
    last_seen: Date | null;
    _rank: number | null;
};

// extended types

type StatementWithDetailsDB = StatementDB & {
    skip_id: string;
    max_skip_id: string;
    repost_count: string | null;
    poll_hash: string | null;
    votes: Object[] | null;
};


type StatementWithHiddenDB = StatementDB & {
    hidden: boolean | null;
};
