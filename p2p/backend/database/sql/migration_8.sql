CREATE TABLE IF NOT EXISTS hidden_statements (
    id SERIAL PRIMARY KEY,
    type statement_type NOT NULL,
    domain VARCHAR(100) NOT NULL,
    author VARCHAR(100) NOT NULL, 
    statement VARCHAR(1500) NOT NULL, 
    proclaimed_publication_time TIMESTAMP,
    hash_b64 VARCHAR(500) UNIQUE NOT NULL,
    referenced_statement VARCHAR(500), -- response, vote, dispute
    tags VARCHAR(1000),
    content VARCHAR(1000) NOT NULL, -- for search
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
