import { DBCallback, sanitize } from ".";

export const matchDomainFactory = (pool) => ({ domain_substring }) => (new Promise((resolve: DBCallback, reject) => {
    try {
      sanitize({ domain_substring })
      pool.query(`
              with regex AS ( SELECT '.*' || $1 || '.*' pattern)
              SELECT 
                host domain,
                subject_o AS organization,
                subject_c AS country,
                subject_st AS state,
                subject_l AS city,
                _rank
              FROM ssl_cert_cache
                JOIN regex ON host ~ regex.pattern
              WHERE LOWER(subject_l) NOT LIKE '%cloudflare%'
              ORDER BY _rank ASC LIMIT 20
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
  
  export const setCertCacheFactory = (pool) => ({ domain, O, C, ST, L,
    issuer_o, issuer_c, issuer_cn, sha256, validFrom, validTo }) => (new Promise((resolve: DBCallback, reject) => {
    try {
      sanitize({ domain, O, C, ST, L, issuer_o, issuer_c, issuer_cn, sha256, validFrom, validTo })
      pool.query(`INSERT INTO ssl_cert_cache (host, subject_o, subject_c, subject_st, subject_l, 
        sha256, valid_from, valid_to, first_seen, last_seen,
        issuer_o, issuer_c, issuer_cn) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $9 , $10, $11)
  ON CONFLICT (sha256) DO NOTHING
  RETURNING *;`,
  [domain, O, C, ST, L, sha256, validFrom, validTo, issuer_o, issuer_c, issuer_cn], (error, results) => {
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
  
  export const getCertCacheFactory = (pool) => ({ domain }) => (new Promise((resolve: DBCallback, reject) => {
    if (!domain) return reject(Error('no domain'))
    try {
      sanitize({ domain })
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
  