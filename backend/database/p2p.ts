
const log = false;

import { DBCallback, DBErrorCallback, sanitize } from ".";

export const getAllNodesFactory = pool => () => (new Promise((resolve: DBCallback, reject) => {
    try {
      pool.query(`
              SELECT 
                  domain,
                  id,
                  last_received_statement_id
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
  
  export const addNodeFactory = pool => ({ domain }) => (new Promise((resolve: DBCallback, reject) => {
    try {
      sanitize({ domain })
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
  
  
  export const updateNodeFactory = pool => ({ domain, lastReceivedStatementId, certificateAuthority, fingerprint, ip }) => (new Promise((resolve: DBCallback, reject) => {
    try {
      sanitize({ domain, lastReceivedStatementId, certificateAuthority, fingerprint, ip })
      pool.query(`
              UPDATE p2p_nodes
              SET 
              last_received_statement_id = $1,
              last_seen = CURRENT_TIMESTAMP,
              ${certificateAuthority ? `certificate_authority = $3,` : ''}
              ${fingerprint ? `fingerprint = $4,` : ''}
              ip = $5
              WHERE domain = $2
                AND (last_received_statement_id IS NULL
                  OR
                  last_received_statement_id <= $1
                ) 
                OR (FALSE AND $3 = $4);
              `,[lastReceivedStatementId,
                domain, 
                certificateAuthority || 'certificateAuthority', 
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
