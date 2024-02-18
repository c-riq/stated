
const log = false;

import { DBCallback, checkIfMigrationsAreDone } from ".";

export const createOrganisationVerificationFactory = (pool) => ({ statement_hash, verifier_domain, verified_domain, 
    name, legal_entity_type, country, province, city, serialNumber, foreignDomain=null, confidence=null, department=null }) => (new Promise((resolve: DBCallback, reject) => {
    try {
      checkIfMigrationsAreDone()
      pool.query(`
              INSERT INTO organisation_verifications 
                (statement_hash, verifier_domain, verified_domain, name, legal_entity_type, 
                  country, province, city, serial_number, foreign_domain, confidence, department) 
              VALUES 
                ($1, $2, $3, $4, $5, 
                  $6, $7, $8, $9, $10,
                  $11, $12)
              ON CONFLICT (statement_hash) DO NOTHING
              RETURNING *`,
        [statement_hash, verifier_domain, verified_domain, name, legal_entity_type, country, province, city,
           serialNumber, foreignDomain, confidence, department], (error, results) => {
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
      checkIfMigrationsAreDone()
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
  
  export const getPersonVerificationsFactory = pool => ({ hash_b64 = null, name = null, domain = null }) => (new Promise((resolve: DBCallback, reject) => {
    try {
      checkIfMigrationsAreDone()
      pool.query(`
              WITH domains AS (
                SELECT 
                 domain,
                 author,
                 $1 as input1,
                 $2 as input2,
                 $3 as input3
                FROM statements
                WHERE hash_b64=$1
                LIMIT 1
              )
              SELECT 
                  v.*,
                  s.*
              FROM person_verifications v
                JOIN statement_with_superseding s 
                  ON v.statement_hash=s.hash_b64
                  AND superseding_statement IS NULL
              WHERE 
              (
                LENGTH($1) = 0
                OR
                v.verified_domain IN (SELECT domain FROM domains)
                OR
                v.foreign_domain IN (SELECT domain FROM domains)
              )
              AND (
                LENGTH($1) = 0
                OR
                LOWER(v.name) IN (SELECT LOWER(author) FROM domains)
              )
              AND (
                LENGTH($2) = 0
                OR
                LOWER(v.name) = LOWER($2)
              )
              AND (
                LENGTH($3) = 0
                OR
                v.verified_domain = $3
                OR
                v.foreign_domain = $3
              )
              ;`,[hash_b64 || '', name || '', domain || ''], (error, results) => {
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
  
  export const getOrganisationVerificationsFactory = pool => ({ hash_b64 = null, domain = null, name = null }) => (new Promise((resolve: DBCallback<OrganisationVerificationDB & StatementWithSupersedingDB>, reject) => {
    try {
      checkIfMigrationsAreDone()
      pool.query(`
            WITH domains AS (
              SELECT 
              domain,
              author,
              $1 as input1,
              $2 as input2,
              $3 as input3
              FROM statements
              WHERE hash_b64=$1
              LIMIT 1
            )
            SELECT 
                v.*,
                s.*
            FROM organisation_verifications v
              JOIN statement_with_superseding s 
                ON v.statement_hash=s.hash_b64
                AND superseding_statement IS NULL
            WHERE 
            (
              LENGTH($1) = 0
              OR
              v.verified_domain IN (SELECT domain FROM domains)
              OR
              v.foreign_domain IN (SELECT domain FROM domains)
            )
            AND (
              LENGTH($1) = 0
              OR
              LOWER(v.name) IN (SELECT LOWER(author) FROM domains)
            )
            AND (
              LENGTH($2) = 0
              OR
              LOWER(v.name) = LOWER($2)
            )
            AND (
              LENGTH($3) = 0
              OR
              v.verified_domain = $3
              OR
              v.foreign_domain = $3
            )
              LIMIT 2000;
              `,[hash_b64 || '', name || '', domain || ''], (error, results) => {
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
  

  export const matchNameFactory = pool => ({name_substring}) => (new Promise((resolve: DBCallback, reject) => {
    try {
      pool.query(`
        with regex AS ( SELECT '.*' || $1 || '.*' pattern)
        SELECT
          verified_domain domain,
          name organisation,
          country,
          province state,
          city,
          statement_hash,
          first_verification_time
        FROM organisation_verifications
          JOIN regex ON (name ~ regex.pattern OR verified_domain ~ regex.pattern)
          JOIN statements ON organisation_verifications.statement_hash = statements.hash_b64
        ORDER BY first_verification_time ASC
        LIMIT 20;
      `,[name_substring], (error, results) => {
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
