
import { Pool } from "pg";
import { DBCallback, VerificationLogDB, StatementDB } from ".";

export const getStatementsToVerifyFactory = (pool: Pool) => ({n, ownDomain}: {n: any, ownDomain: any}) => (new Promise((
  resolve: DBCallback<VerificationLogDB&StatementDB&{n:string}>, reject) => {
    try {
      pool.query(`
        with missing_log as (
            SELECT
                hash_b64,
                domain, 
                verification_method,
                first_verification_time max_t,
                first_verification_time min_t,
                statement,
                1 as n
            from statements
            left join verification_log on statements.hash_b64 = verification_log.statement_hash
            where verification_log.statement_hash is null
            and statements.domain != $2
            LIMIT $1
        ),
        outdated_log as (
            SELECT
                hash_b64,
                domain,
                verification_method,
                max(t) max_t,
                min(t) min_t,
                max(statement) statement,
                count(*) n
            FROM verification_log
            join statements on statements.hash_b64 = verification_log.statement_hash
            where statements.domain != $2
            GROUP BY 1,2,3
            ORDER BY max_t asc
            LIMIT $1
        )
        SELECT
            *
        FROM missing_log
        UNION
        SELECT
            *
        FROM outdated_log
        ORDER BY max_t, min_t asc
        LIMIT $1;
              `,[n, ownDomain], (error, results) => {
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
  
  export const addLogFactory = (pool: Pool) => ({ hash_b64, api, dns, txt }:{hash_b64: string, api?:boolean, dns?: boolean, txt?:boolean}) => 
  (new Promise((resolve: DBCallback<any>, reject) => {
    try {
      pool.query(`
              INSERT INTO verification_log (statement_hash, t, api, dns, txt) VALUES
                  ($1, CURRENT_TIMESTAMP, $2, $3, $4)
              RETURNING *
              `,[hash_b64, !!api, !!dns, !!txt], (error, results) => {
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
  
  
  export const getLogsForStatementFactory = (pool: Pool) => ({ hash_b64 }:{hash_b64: string}) => (new Promise((resolve: DBCallback<VerificationLogDB>, reject) => {
    try {
      pool.query(`
              select * from verification_log where statement_hash = $1 order by t asc;
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
  }))
