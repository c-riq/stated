
const log = false;

import { Pool } from "pg";
import { DBCallback, checkIfMigrationsAreDone } from ".";

export const createOrganisationVerificationFactory = (pool: Pool) => ({ statement_hash, verifier_domain, verified_domain, 
  name, legal_entity_type, country, province, city, serial_number, foreign_domain, confidence, department }: Omit<OrganisationVerificationDB, "id">) => (new Promise((resolve: DBCallback<any>, reject) => {
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
          serial_number, foreign_domain, confidence, department], (error, results) => {
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
  
  export const createPersonVerificationFactory = (pool: Pool) => ({ statement_hash, verifier_domain, verified_domain,
    name, birth_country, birth_city, birth_date, foreign_domain }: Omit<PersonVerificationDB, "id" | "birth_date"> & {birth_date: Date}) => (
      new Promise((resolve: DBCallback<any>, reject) => {
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
          birth_country, birth_city, birth_date, foreign_domain], (error, results) => {
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
  
  export const getPersonVerificationsFactory = (pool: Pool) => ({ hash_b64, name, domain }: { hash_b64?: string, name?: string, domain?: string }) => (new Promise((resolve: DBCallback<PersonVerificationDB&StatementWithSupersedingDB>, reject) => {
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
  
  export const getOrganisationVerificationsFactory = (pool: Pool) => ({ hash_b64, domain, name }: { hash_b64?: string, domain?: string, name?: string }
    ) => (new Promise((resolve: DBCallback<OrganisationVerificationDB & StatementWithSupersedingDB>, reject) => {
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
  
  export const getAllVerificationsFactory = (pool: Pool) => () => (new Promise((resolve: DBCallback<OrganisationVerificationDB & StatementDB>, reject) => {
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

  export const checkIfVerificationExistsFactory = (pool: Pool) => ({hash}: {hash: string}) => (new Promise((resolve: DBCallback<{exists: boolean}>, reject) => {
    try {
      pool.query(`
      SELECT EXISTS (
        SELECT TRUE exists
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
  

  export const matchNameFactory = (pool: Pool) => ({name_substring}: {name_substring: string}) => (new Promise((resolve: DBCallback<{
    verified_domain: string,
    organisation: string,
    country: string,
    state: string,
    city: string,
    statement_hash: string,
    first_verification_time: Date
  }>, reject) => {
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
