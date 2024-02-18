CREATE TABLE IF NOT EXISTS observation (
    id SERIAL PRIMARY KEY,
    statement_hash VARCHAR(500) UNIQUE NOT NULL,
    approach VARCHAR(500),
    confidence VARCHAR(500),
    _subject VARCHAR(500) NOT NULL,
    subject_reference VARCHAR(500),
    observed_property VARCHAR(500) NOT NULL,
    observed_value VARCHAR(500),
    CONSTRAINT observation_statement_hash_fkey
        FOREIGN KEY (statement_hash) REFERENCES statements (hash_b64)
        ON DELETE CASCADE
);
