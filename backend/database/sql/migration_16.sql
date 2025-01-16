DROP TABLE IF EXISTS domain_ownership_beliefs;

CREATE TABLE identity_beliefs_and_reputation (
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
    'limited liability corporation', 1.0, 'NL', 1.0, 
    'Amsterdam', 1.0, 1.0);
