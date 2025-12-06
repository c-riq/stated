-- TODO: refine approach

-- calculate authors dispute rates

-- lower reputation based on dispute rate


WITH trusted_disputes AS (
    SELECT 
        s.referenced_statement
    FROM statements s
    LEFT JOIN identity_beliefs_and_reputation ib
        ON s.author = ib.name
        AND s.domain = ib.domain
        AND COALESCE(ib.reputation, ib.reputation_fallback) > 0.95
    WHERE (
        s.type = 'dispute_statement_content'
        OR s.type = 'dispute_statement_authenticity'
    )
)
, dispute_rates AS (
    SELECT 
        s.author name,
        s.domain,
        SUM(1) as statement_count,
        SUM(CASE WHEN s.referenced_statement is not null THEN 1 ELSE 0 END) as dispute_count,
        -- TODO: add dispute confidence as a factor
        SUM(CASE WHEN s.referenced_statement is not null THEN 1 ELSE 0 END)::float / count(*) as dispute_rate
    FROM statements s LEFT JOIN trusted_disputes td
        ON s.hash_b64 = td.referenced_statement
    GROUP BY s.author, s.domain
)
, updated_reputations AS (
    SELECT 
        ib.domain,
        ib.name,
        LEAST(reputation_fallback, 1 - dispute_rate) as reputation_fallback
    FROM dispute_rates JOIN identity_beliefs_and_reputation ib
        ON dispute_rates.domain = ib.domain
        AND dispute_rates.name = ib.name
)

UPDATE identity_beliefs_and_reputation ibr
SET reputation_fallback = ur.reputation_fallback
FROM updated_reputations ur
WHERE ibr.domain = ur.domain 
AND ibr.name = ur.name;

-- add new identities with accuracy confidence * verifier reputation * 0.7 as starting value

WITH trusted_disputes AS (
    SELECT 
        s.referenced_statement
    FROM statements s
    LEFT JOIN identity_beliefs_and_reputation ib
        ON s.author = ib.name
        AND s.domain = ib.domain
        AND COALESCE(ib.reputation, ib.reputation_fallback) > 0.95
    WHERE (
        s.type = 'dispute_statement_content'
        OR s.type = 'dispute_statement_authenticity'
    )
)

, beliefs_from_verifications AS (
    SELECT
        COALESCE(ov.verified_domain, ov.foreign_domain) as domain,
        ov.name,
        MAX(ov.confidence * COALESCE(ib.reputation, ib.reputation_fallback)) as name_confidence,
        ov.legal_entity_type,
        MAX(ov.confidence * COALESCE(ib.reputation, ib.reputation_fallback)) as legal_entity_type_confidence,
        ov.country,
        MAX(ov.confidence * COALESCE(ib.reputation, ib.reputation_fallback)) as country_confidence,
        ov.province,
        MAX(ov.confidence * COALESCE(ib.reputation, ib.reputation_fallback)) as province_confidence,
        ov.city,
        MAX(ov.confidence * COALESCE(ib.reputation, ib.reputation_fallback)) as city_confidence,
        MAX(ov.confidence * COALESCE(ib.reputation, ib.reputation_fallback) * 0.7) as reputation_fallback
    FROM
        organisation_verifications ov
        JOIN statements s 
            ON ov.statement_hash = s.hash_b64
        LEFT JOIN identity_beliefs_and_reputation ib 
            ON s.author = ib.name
            AND s.domain = ib.domain
            AND COALESCE(ib.reputation, ib.reputation_fallback) > 0.95
        LEFT JOIN trusted_disputes td
            ON ov.statement_hash = td.referenced_statement
    WHERE
        td.referenced_statement IS NULL
        AND (ov.verified_domain IS NOT NULL 
            OR ov.foreign_domain IS NOT NULL)
        AND ( -- exclude self verification
            s.author != ov.name 
            OR s.domain != ov.verified_domain)
    GROUP BY
        COALESCE(ov.verified_domain, ov.foreign_domain),
        ov.name,
        ov.legal_entity_type,
        ov.country,
        ov.province,
        ov.city
)
-- add new identities and take maximmum reputation_fallback

INSERT INTO identity_beliefs_and_reputation (
    domain, 
    name, 
    name_confidence,
    legal_entity_type,
    legal_entity_type_confidence,
    country,
    country_confidence,
    province,
    province_confidence,
    city,
    city_confidence,
    reputation_fallback
)
SELECT 
    domain, 
    name, 
    name_confidence,
    legal_entity_type,
    legal_entity_type_confidence,
    country,
    country_confidence,
    province,
    province_confidence,
    city,
    city_confidence,
    reputation_fallback
FROM beliefs_from_verifications 
WHERE name_confidence IS NOT NULL
ON CONFLICT (domain, name) DO UPDATE SET
    name_confidence = EXCLUDED.name_confidence,
    legal_entity_type = EXCLUDED.legal_entity_type,
    legal_entity_type_confidence = EXCLUDED.legal_entity_type_confidence,
    country = EXCLUDED.country,
    country_confidence = EXCLUDED.country_confidence,
    province = EXCLUDED.province,
    province_confidence = EXCLUDED.province_confidence,
    city = EXCLUDED.city,
    city_confidence = EXCLUDED.city_confidence,
    reputation_fallback = GREATEST(identity_beliefs_and_reputation.reputation_fallback, EXCLUDED.reputation_fallback);
