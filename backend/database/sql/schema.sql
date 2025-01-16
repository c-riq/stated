-- TODO: delete log table to allow deletion action propagation in p2p network
-- TODO?: add response and observation tables
CREATE TYPE statement_type AS ENUM 
    ('statement', 'dispute_statement_authenticity', 'response',
    'organisation_verification', 'person_verification', 
    'poll', 'vote', 'rating', 'sign_pdf', 'bounty',
    'dispute_statement_content', 'boycott', 'observation', 'unsupported');
CREATE TYPE verification_method AS ENUM 
    ('api', 'dns');
CREATE TABLE IF NOT EXISTS unverified_statements (
    id SERIAL PRIMARY KEY,
    statement VARCHAR(3000) NOT NULL, 
    author VARCHAR(100) NOT NULL, 
    hash_b64 VARCHAR(500) UNIQUE NOT NULL,
    source_node_id INT,
    received_time TIMESTAMP NOT NULL,
    source_verification_method verification_method,
    verification_retry_count INT
);
CREATE TABLE IF NOT EXISTS statements (
    id SERIAL PRIMARY KEY,
    type statement_type NOT NULL,
    domain VARCHAR(100) NOT NULL,
    author VARCHAR(100) NOT NULL, 
    statement VARCHAR(3000) NOT NULL, 
    proclaimed_publication_time TIMESTAMP,
    hash_b64 VARCHAR(500) UNIQUE NOT NULL,
    referenced_statement VARCHAR(500), -- response, vote, dispute
    tags VARCHAR(1000),
    content VARCHAR(3000) NOT NULL, -- for search
    content_hash VARCHAR(500) NOT NULL, -- for grouping joint statements and preventing duplicates
    source_node_id INT,
    first_verification_time TIMESTAMP,
    latest_verification_time TIMESTAMP,
    verification_method verification_method, -- dns, api
    derived_entity_created BOOLEAN NOT NULL,
    derived_entity_creation_retry_count INT,
    superseded_statement VARCHAR(500) NULL,
    CONSTRAINT no_domain_author_content_duplicates UNIQUE (domain, author, content_hash)
);
CREATE TABLE IF NOT EXISTS hidden_statements (
    id SERIAL PRIMARY KEY,
    type statement_type NOT NULL,
    domain VARCHAR(100) NOT NULL,
    author VARCHAR(100) NOT NULL, 
    statement VARCHAR(3000) NOT NULL, 
    proclaimed_publication_time TIMESTAMP,
    hash_b64 VARCHAR(500) UNIQUE NOT NULL,
    referenced_statement VARCHAR(500), -- response, vote, dispute
    tags VARCHAR(1000),
    content VARCHAR(3000) NOT NULL, -- for search
    content_hash VARCHAR(500) NOT NULL, -- for grouping joint statements and preventing duplicates
    source_node_id INT,
    first_verification_time TIMESTAMP,
    latest_verification_time TIMESTAMP,
    verification_method verification_method, -- dns, api
    derived_entity_created BOOLEAN NOT NULL,
    derived_entity_creation_retry_count INT,
    superseded_statement VARCHAR(500) NULL,
    CONSTRAINT no_hidden_domain_author_content_duplicates UNIQUE (domain, author, content_hash)
);
CREATE TABLE IF NOT EXISTS verification_log (
    id SERIAL PRIMARY KEY,
    statement_hash VARCHAR(500) NOT NULL,
    t TIMESTAMP NOT NULL,
    api BOOLEAN NOT NULL,
    dns BOOLEAN NOT NULL,
    txt BOOLEAN NOT NULL,
    CONSTRAINT no_statement_time_duplicates UNIQUE (statement_hash, t),
    CONSTRAINT verification_log_statement_hash_fkey
        FOREIGN KEY (statement_hash) REFERENCES statements (hash_b64)
        ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS organisation_verifications (
    id SERIAL PRIMARY KEY,
    statement_hash VARCHAR(500) UNIQUE NOT NULL,
    verifier_domain VARCHAR(100) NOT NULL,
    verified_domain VARCHAR(100),
    foreign_domain VARCHAR(100),
    name VARCHAR(100) NOT NULL,
    legal_entity_type VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100),
    country VARCHAR(100) NOT NULL,-- ISO 3166 country name
    province VARCHAR(100),
    city VARCHAR(100),
    department VARCHAR(100),
    confidence DOUBLE PRECISION,
    CONSTRAINT organisation_verifications_statement_hash_fkey
        FOREIGN KEY (statement_hash) REFERENCES statements (hash_b64)
        ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS person_verifications (
    id SERIAL PRIMARY KEY,
    statement_hash VARCHAR(500) UNIQUE NOT NULL,
    verifier_domain VARCHAR(100) NOT NULL,
    verified_domain VARCHAR(100),
    foreign_domain VARCHAR(100),
    name VARCHAR(100) NOT NULL,
    birth_country VARCHAR(100) NOT NULL,
    birth_city VARCHAR(100),
    birth_date VARCHAR(100),
    CONSTRAINT person_verifications_statement_hash_fkey
        FOREIGN KEY (statement_hash) REFERENCES statements (hash_b64)
        ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS identity_beliefs_and_reputation (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_confidence DOUBLE PRECISION NOT NULL,
    legal_entity_type VARCHAR(100) NOT NULL,
    legal_entity_type_confidence DOUBLE PRECISION NOT NULL,
    country VARCHAR(100) NOT NULL,
    country_confidence DOUBLE PRECISION NOT NULL,
    province VARCHAR(100),
    province_confidence DOUBLE PRECISION,
    city VARCHAR(100),
    city_confidence DOUBLE PRECISION,
    reputation DOUBLE PRECISION,
    reputation_fallback DOUBLE PRECISION,
    CONSTRAINT identity_beliefs_and_reputation_no_domain_name_duplicates UNIQUE (domain, name)
);
INSERT INTO identity_beliefs_and_reputation (
    domain, name, name_confidence, legal_entity_type,
    legal_entity_type_confidence, country, country_confidence,
    city, city_confidence, reputation) 
VALUES ('rixdata.net', 'Rix Data NL B.V.', 1.0,
    'corporation', 1.0, 'NL', 1.0, 
    'Amsterdam', 1.0, 1.0);
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    statement_hash VARCHAR(500) UNIQUE NOT NULL,
    poll_hash VARCHAR(500) NOT NULL,
    option VARCHAR(500) NOT NULL,
    domain VARCHAR(100) NOT NULL,
    qualified BOOLEAN,
    CONSTRAINT votes_statement_hash_fkey
        FOREIGN KEY (statement_hash) REFERENCES statements (hash_b64)
        ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS polls (
    id SERIAL PRIMARY KEY,
    statement_hash VARCHAR(500) UNIQUE NOT NULL,
    participants_entity_type VARCHAR(500),
    participants_country VARCHAR(500),
    participants_city VARCHAR(500),
    deadline timestamp,
    CONSTRAINT polls_statement_hash_fkey
        FOREIGN KEY (statement_hash) REFERENCES statements (hash_b64)
        ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    statement_hash VARCHAR(500) UNIQUE NOT NULL,
    subject_name VARCHAR(500) NOT NULL,
    subject_reference VARCHAR(500),
    rating INT NOT NULL,
    comment VARCHAR(3000) NOT NULL,
    quality VARCHAR(500),
    qualified BOOLEAN DEFAULT FALSE,
    CONSTRAINT ratings_statement_hash_fkey
        FOREIGN KEY (statement_hash) REFERENCES statements (hash_b64)
        ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS p2p_nodes (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(150) UNIQUE NOT NULL,
    ip VARCHAR(150),
    first_seen timestamp,
    last_seen timestamp,
    reputation real,
    last_received_statement_id bigint,
    certificate_authority VARCHAR(100),
    fingerprint VARCHAR(100)
);
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    from_version bigint NOT NULL,
    to_version bigint NOT NULL
);
INSERT INTO migrations (created_at, from_version, to_version) VALUES (CURRENT_TIMESTAMP, 0, 2);
CREATE TABLE IF NOT EXISTS ssl_cert_cache (
    sha256 TEXT PRIMARY KEY,
    host TEXT,
    subject_o TEXT,
    subject_c TEXT,
    subject_st TEXT,
    subject_l TEXT,
    subject_cn TEXT,
    subject_serialnumber TEXT,
    subjectaltname TEXT,
    issuer_o TEXT,
    issuer_c TEXT,
    issuer_cn TEXT,
    valid_from timestamp, 
    valid_to timestamp,
    first_seen timestamp,
    last_seen timestamp,
    _rank INT
);
CREATE VIEW statement_with_superseding AS (
	SELECT s1.*, s2.hash_b64 superseding_statement 
	FROM statements s1 
	LEFT JOIN statements s2 
		ON s1.hash_b64=s2.superseded_statement 
		AND s1.domain=s2.domain AND s1.author=s2.author 
);
