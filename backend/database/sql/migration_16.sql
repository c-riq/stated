ALTER TABLE domain_ownership_beliefs DROP CONSTRAINT domain_ownership_beliefs_domain_key;

ALTER TABLE domain_ownership_beliefs RENAME TO identity_beliefs_and_reputation;

-- Add new unique constraint on domain and name combination
ALTER TABLE identity_beliefs_and_reputation ADD CONSTRAINT identity_beliefs_and_reputation_no_domain_name_duplicates UNIQUE (domain, name);

ALTER TABLE identity_beliefs_and_reputation ADD COLUMN reputation_fallback DOUBLE PRECISION;

INSERT INTO identity_beliefs_and_reputation (
    domain, name, name_confidence, legal_entity_type,
    legal_entity_type_confidence, country, country_confidence,
    city, city_confidence, reputation) 
VALUES ('rixdata.net', 'Rix Data NL B.V.', 1.0,
    'limited liability corporation', 1.0, 'NL', 1.0, 
    'Amsterdam', 1.0, 1.0);
