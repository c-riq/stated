SELECT 'CREATE DATABASE dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dev')\gexec

\c dev

-- DROP TABLE IF EXISTS p2p_nodes;

DROP TABLE IF EXISTS statements;
CREATE TABLE IF NOT EXISTS statements (
    id SERIAL PRIMARY KEY,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    type VARCHAR(100) NOT NULL, -- statement | domain_verification | profile
    version INT NOT NULL, 
    domain VARCHAR(100) NOT NULL,
    statement VARCHAR(1500) NOT NULL, 
    time VARCHAR(100) NOT NULL,
    hash_b64 VARCHAR(500) UNIQUE NOT NULL,
    referenced_statement VARCHAR(500), -- response, vote, dispute
    tags VARCHAR(1000),
    content VARCHAR(1000) NOT NULL, -- for search
    content_hash VARCHAR(500) NOT NULL, -- for grouping joint statements
    source_node_id int,
    latest_verification_ts TIMESTAMP,
    verification_method VARCHAR(4) -- dns, api
);
DROP TABLE IF EXISTS verifications;
CREATE TABLE IF NOT EXISTS verifications (
    id SERIAL PRIMARY KEY,
    statement_hash VARCHAR(500) UNIQUE NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    version INT NOT NULL, 
    verifer_domain VARCHAR(100) NOT NULL,
    verified_domain VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,-- ISO 3166 country name
    province VARCHAR(100),
    city VARCHAR(100)
);
DROP TABLE IF EXISTS p2p_nodes;
CREATE TABLE IF NOT EXISTS p2p_nodes (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(150) UNIQUE NOT NULL,
  ip VARCHAR(150),
  last_seen timestamp,
  reputation real,
  last_received_statement_id bigint
);


