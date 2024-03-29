import { Pool } from "pg";
import { DBCallback, checkIfMigrationsAreDone } from ".";

export const matchDomainFactory = (pool: Pool) => ({ domain_substring}:{domain_substring?: string}) => (new Promise((resolve: DBCallback<SSLCertCacheDB&OrganisationVerificationDB>, reject) => {
    try {
      checkIfMigrationsAreDone()
      pool.query(`
              with regex AS ( SELECT '.*' || $1 || '.*' pattern)
              ,
              ssl AS(
                SELECT 
                  host domain,
                  subject_o AS organisation,
                  subject_c AS country,
                  subject_st AS state,
                  subject_l AS city,
                  '' department,
                  '' statement_hash,
                  first_seen first_verification_time
                FROM ssl_cert_cache
                  JOIN regex ON host ~ regex.pattern
                WHERE LOWER(subject_o) NOT LIKE '%cloudflare%'
                  AND valid_from < CURRENT_TIMESTAMP
                  AND CURRENT_TIMESTAMP < valid_to
                ORDER BY _rank ASC LIMIT 20
              )
              ,
              _stated AS (
                SELECT
                  verified_domain domain,
                  name organisation,
                  country,
                  province state,
                  city,
                  department,
                  statement_hash,
                  first_verification_time
                FROM organisation_verifications
                  JOIN regex ON verified_domain ~ regex.pattern
                  JOIN statements ON organisation_verifications.statement_hash = statements.hash_b64
                ORDER BY first_verification_time ASC
                LIMIT 20
              )
              SELECT * FROM ssl UNION SELECT * FROM _stated
              ;
              `,[domain_substring || ''], (error, results) => {
        if (error) {
          console.log(error)
          console.trace()
          return reject(error)
        } else {
          return resolve(results)
        }
      })
    } catch (error) {
      console.log(error)
      console.trace()
      return reject(error)
    }
  }))
  
  export const setCertCacheFactory = (pool: Pool) => ({ host, subject_o, subject_c, subject_st, subject_l, subject_serialnumber, subject_cn, subjectaltname,
    issuer_o, issuer_c, issuer_cn, sha256, valid_from, valid_to }: SSLCertCacheDB) => (new Promise((resolve: DBCallback<any>, reject) => {
    try {
      checkIfMigrationsAreDone()
      pool.query(`INSERT INTO ssl_cert_cache 
        (host, subject_o, subject_c, subject_st, subject_l, 
          subject_serialnumber, subject_cn, subjectaltname, sha256, valid_from, 
          valid_to, first_seen, last_seen, issuer_o, issuer_c,
          issuer_cn) 
  VALUES ($1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $12 , $13,
          $14)
  ON CONFLICT (sha256) DO NOTHING
  RETURNING *;`,
  [host, subject_o, subject_c, subject_st, subject_l,
    subject_serialnumber, subject_cn, subjectaltname, sha256, valid_from,
    valid_to, issuer_o, issuer_c, issuer_cn], (error, results) => {
        if (error) {
          console.log(error)
          console.trace()
          return reject(error)
        } else {
          return resolve(results)
        }
      })
    } catch (error) {
      console.log(error)
      console.trace()
      return reject(error)
    }
  }))
  
  export const getCertCacheFactory = (pool: Pool) => ({ domain }:{domain: string}) => (new Promise((resolve: DBCallback<SSLCertCacheDB>, reject) => {
    if (!domain) return reject(Error('no domain'))
    try {
      checkIfMigrationsAreDone()
      pool.query(`
              WITH certs AS(
              SELECT 
                host AS domain,
                subject_o,
                subject_c,
                subject_st,
                subject_l,
                issuer_o, issuer_c, issuer_cn,
                sha256,
                row_number() over(partition by host order by valid_from desc) AS rnk
              FROM ssl_cert_cache
                where host=$1
                AND valid_from < CURRENT_TIMESTAMP
                AND CURRENT_TIMESTAMP < valid_to
              AND LOWER(subject_O) NOT LIKE '%cloudflare%'
              )
              SELECT * FROM certs WHERE rnk = 1
              ;
              `,[domain], (error, results) => {
        if (error) {
          console.log(error)
          console.trace()
          return reject(error)
        } else {
          return resolve(results)
        }
      })
    } catch (error) {
      console.log(error)
      console.trace()
      return reject(error)
    }
  }))
  