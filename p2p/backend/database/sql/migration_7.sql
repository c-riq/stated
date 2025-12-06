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
