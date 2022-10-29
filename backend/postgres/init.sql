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
    content VARCHAR(1000) NOT NULL, -- for grouping joint statements
    content_hash VARCHAR(500) NOT NULL,
    source_node_id int,
    latest_verification_ts TIMESTAMP,
    verification_method VARCHAR(4) -- dns, api
);
DROP TABLE IF EXISTS verifications;
CREATE TABLE IF NOT EXISTS verifications (
    id SERIAL PRIMARY KEY,
    statement_id INT NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    version INT NOT NULL, 
    verifer_domain VARCHAR(100) NOT NULL,
    verified_domain VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,-- ISO 3166 country name
    number VARCHAR(100) NOT NULL,
    authority VARCHAR(100) NOT NULL,
    method VARCHAR(100) NOT NULL, -- twitter_reference_blue_badge | linkedin_reference_100_employees | wikipedia_reference_100_days_unchanged | personal_contact_to_employee
    source VARCHAR(100) NOT NULL
);
DROP TABLE IF EXISTS admin_users;
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  password VARCHAR(150) NOT NULL
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

INSERT INTO public.statements (created_at, updated_at, type, version, domain, statement, "time", hash_b64, content, content_hash) VALUES ('2022-09-04 14:59:31.674536', '2022-09-04 14:59:31.674536', 'statement', 1, 'rixdata.net', 'domain: rixdata.net
time: Sun, 04 Sep 2022 14:48:50 GMT
statement: hello world', 'Sun, 04 Sep 2022 14:48:50 GMT', 'gfWVrxXZqsX7ozIiy/3jUM51LeF/a1i29+319aSAEvM=', 'hello world', 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=');
INSERT INTO public.statements (created_at, updated_at, type, version, domain, statement, "time", hash_b64, content, content_hash) VALUES ('2022-09-04 15:00:47.554061', '2022-09-04 15:00:47.554061', 'statement', 1, 'gritapp.info', 'domain: gritapp.info
time: Sun, 04 Sep 2022 14:59:31 GMT
statement: hello world', 'Sun, 04 Sep 2022 14:59:31 GMT', 'A4GwguTQcjW1AZQPfvFFrWqTsPZoV8uYssNW4VOH1Jo=', 'hello world', 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=');
INSERT INTO public.p2p_nodes (domain) VALUES ('stated.rixdata.net');

