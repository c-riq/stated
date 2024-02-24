
const log = false;

import { Pool } from "pg";
import { DBCallback, checkIfMigrationsAreDone } from ".";

export const getAllNodesFactory = (pool: Pool) => () => (new Promise((resolve: DBCallback<P2PNodeDB>, reject) => {
    try {
      pool.query(`
              SELECT 
                  *
              FROM p2p_nodes;
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
  
  export const addNodeFactory = (pool: Pool) => ({ domain }:{domain:string}) => (new Promise((resolve: DBCallback<any>, reject) => {
    try {
      checkIfMigrationsAreDone()
      pool.query(`
              INSERT INTO p2p_nodes (domain, first_seen, last_seen) VALUES
                  ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              ON CONFLICT (domain) DO NOTHING
              RETURNING *
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
  }));
  
  
  export const updateNodeFactory = (pool: Pool) => (
    { domain, last_received_statement_id, certificate_authority, fingerprint, ip }:
    Omit<P2PNodeDB, "first_seen"|"last_seen"|"id"|"reputation">) => (new Promise((resolve: DBCallback<any>, reject) => {
    try {
      checkIfMigrationsAreDone()
      pool.query(`
              UPDATE p2p_nodes
              SET 
              last_received_statement_id = $1,
              last_seen = CURRENT_TIMESTAMP,
              certificate_authority = $3,
              ${fingerprint ? `fingerprint = $4,` : ''}
              ip = $5
              WHERE domain = $2
                AND (last_received_statement_id IS NULL
                  OR
                  last_received_statement_id <= $1
                ) 
                OR (FALSE AND $3 = $4);
              `,[last_received_statement_id,
                domain, 
                certificate_authority || 'certificate_authority', 
                fingerprint || 'fingerprint',
                ip], (error, results) => {
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
