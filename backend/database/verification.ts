
const log = false;

import { DBCallback, DBErrorCallback, sanitize } from ".";

export const createOrganisationVerificationFactory = (pool) => ({ statement_hash, verifier_domain, verified_domain, 
    name, legal_entity_type, country, province, city, serialNumber, foreignDomain=null }) => (new Promise((resolve: DBCallback, reject) => {
    try {
      sanitize({ statement_hash, verifier_domain, verified_domain, name, legal_entity_type, country, province, city, foreignDomain })
      pool.query(`
              INSERT INTO organisation_verifications 
                (statement_hash, verifier_domain, verified_domain, name, legal_entity_type, 
                  country, province, city, serial_number, foreign_domain) 
              VALUES 
                ($1, $2, $3, $4, $5, 
                  $6, $7, $8, $9, $10)
              ON CONFLICT (statement_hash) DO NOTHING
              RETURNING *`,
        [statement_hash, verifier_domain, verified_domain, name, legal_entity_type, country, province, city, serialNumber, foreignDomain], (error, results) => {
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
  
  export const createPersonVerificationFactory = (pool) => ({ statement_hash, verifier_domain, verified_domain,
     name,
     countryOfBirth, cityOfBirth, dateOfBirth, foreignDomain }) => (new Promise((resolve: DBCallback, reject) => {
    try {
      sanitize({ statement_hash, verifier_domain, verified_domain, name,
        countryOfBirth, cityOfBirth, dateOfBirth, foreignDomain})
      pool.query(`
              INSERT INTO person_verifications 
                (statement_hash, verifier_domain, verified_domain, name, 
                  birth_country, birth_city, birth_date, foreign_domain) 
              VALUES 
                ($1, $2, $3, $4, $5, 
                  $6, $7, $8)
              RETURNING *`,
        [statement_hash, verifier_domain, verified_domain, name,
          countryOfBirth, cityOfBirth, dateOfBirth, foreignDomain], (error, results) => {
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



export const getOrganisationVerificationsForStatementFactory = pool => ({ hash_b64 }) => (new Promise((resolve: DBCallback, reject) => {
    try {
      sanitize({ hash_b64 })
      pool.query(`
              WITH domains AS (
                SELECT 
                 domain,
                 author
                FROM statements
                WHERE hash_b64=$1
                LIMIT 1
              )
              SELECT 
                  v.*,
                  s.*
              FROM organisation_verifications v
                JOIN statements s ON v.statement_hash=s.hash_b64
              WHERE (
                v.verified_domain IN (SELECT domain FROM domains)
                OR
                v.foreign_domain IN (SELECT domain FROM domains)
              )
              AND LOWER(v.name) IN (SELECT LOWER(author) FROM domains);
              `,[hash_b64], (error, results) => {
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
  }));
  
  
  export const getPersonVerificationsForStatementFactory = pool => ({ hash_b64 }) => (new Promise((resolve: DBCallback, reject) => {
    try {
      sanitize({ hash_b64 })
      pool.query(`
              WITH domains AS (
                SELECT 
                 domain,
                 author
                FROM statements
                WHERE hash_b64=$1
                LIMIT 1
              )
              SELECT 
                  v.*,
                  s.*
              FROM person_verifications v
                JOIN statements s ON v.statement_hash=s.hash_b64
              WHERE 
              (
                v.verified_domain IN (SELECT domain FROM domains)
                OR
                v.foreign_domain IN (SELECT domain FROM domains)
              )
              AND 
                LOWER(v.name) IN (SELECT LOWER(author) FROM domains);
              `,[hash_b64], (error, results) => {
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
  }));
  
  export const getVerificationsForDomainFactory = pool => ({ domain = null }) => (new Promise((resolve: DBCallback, reject) => {
    try {
      sanitize({ domain })
      pool.query(`
              WITH _ AS( SELECT $1 as _)
              SELECT 
                  *
              FROM organisation_verifications
              JOIN statements ON organisation_verifications.statement_hash=statements.hash_b64
              ${domain ? 'WHERE verified_domain = $1' : ''} LIMIT 500;
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
  
  export const getAllVerificationsFactory = pool => () => (new Promise((resolve: DBCallback, reject) => {
    try {
      pool.query(`
              SELECT 
                  v.*,
                  s.*
              FROM organisation_verifications v
                JOIN statements s ON v.statement_hash=s.hash_b64;
              `, (error, results) => {
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
  }));

  export const checkIfVerificationExistsFactory = pool => ({hash}) => (new Promise((resolve: DBCallback, reject) => {
    try {
      pool.query(`
      SELECT EXISTS (
        SELECT 
        FROM organisation_verifications 
        WHERE statement_hash=$1
    );`,[hash], (error, results) => {
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
  }));
  