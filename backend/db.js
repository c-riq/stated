import * as pg from 'pg'
const { Pool } = pg.default

const pool = new Pool({
  user: 'sdf',
  host: 'localhost',
  database: 'dev',
  password: 'sdf',
  port: 5432,
})
console.log(pool)

import {forbiddenStrings} from './statementFormats.js'
import {performMigrations} from './migrations.js'

let migrationsDone = false
setInterval(
async () => {
  if(!migrationsDone){
    performMigrations(pool, ()=>migrationsDone=true)
  }
},500)

const s = (f) => {
  // sql&xss satitize all input to exported functions, checking all string values of a single input object
  return (o) => {
    if (!migrationsDone){
      return {error: 'database migrations not finished'}
    }
    if (typeof o == 'undefined') {
      return f()
    }
    if(forbiddenStrings(Object.values(o)).length > 0) {
      return { error: ('Values contain forbidden Characters: ' + forbiddenStrings(Object.values(o)))}
    } else {
      return f(o)
    }
  }
}

const createStatement = ({ type, version, domain, statement, time, hash_b64, tags, content, content_hash_b64, verification_method, source_node_id }) => (new Promise((resolve, reject) => {
  try {
    console.log(type, version, domain, statement, time, hash_b64, tags, content, content_hash_b64, verification_method, source_node_id)
    pool.query(`INSERT INTO statements (type, version, domain, statement, time,
                            hash_b64, tags, content, content_hash, verification_method, source_node_id, first_verification_ts, latest_verification_ts) 
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    ON CONFLICT (hash_b64) DO UPDATE
                      SET latest_verification_ts = CURRENT_TIMESTAMP
                    RETURNING *`,
      [type, version, domain, statement, time, hash_b64, tags, content, content_hash_b64, verification_method, source_node_id], (error, results) => {
        if (error) {
          console.log(error)
          resolve({ error })
        } else {
          resolve({ inserted: results.rows[0] })
        }
      })
  } catch (error) {
    resolve({ error })
  }
}))

const getStatements = ({ minId, searchQuery }) => (new Promise((resolve, reject) => {
  try {
    pool.query(`
            WITH reposts as(
                SELECT 
                    content as _content, 
                    count(distinct domain) as repost_count, 
                    first_value(min(id)) over(partition by content order by min(created_at) asc) as first_id,
                    $1 || $2 input
                FROM statements 
                WHERE (type = 'statement' OR type = 'poll')
                ${minId ? 'AND id > $1' : ''}
                ${searchQuery ? 'AND (content LIKE \'%\'||$2||\'%\' OR tags LIKE \'%\'||$2||\'%\')' : ''}
                GROUP BY 1
                ORDER BY repost_count DESC
                LIMIT 20
            )
            SELECT * FROM (
              SELECT 
                  s.id,
                  s.type,
                  s.domain,
                  v.name,
                  s.statement,
                  r.repost_count,
                  s.time,
                  s.created_at,
                  s.hash_b64,
                  s.tags,
                  s.content,
                  s.content_hash,
                  rank() over(partition by s.id order by v.created_at desc) _rank
                FROM statements s
                    JOIN reposts r
                        ON id=first_id
                    LEFT JOIN verifications v 
                        ON s.domain=v.verified_domain 
                        AND v.verifer_domain='rixdata.net'
                ) AS results 
              WHERE _rank=1;
            `,[minId || 'minId', searchQuery || 'searchQuery']
            , (error, results) => {
      if (error) {
        console.log(error)
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    resolve({ error })
  }
}))

const createVerification = ({ statement_hash, version, verifer_domain, verified_domain, name, country, province, city }) => (new Promise((resolve, reject) => {
  try {
    console.log([statement_hash, version, verifer_domain, verified_domain, name, country, province, city])
    pool.query(`
            INSERT INTO verifications 
              (statement_hash, version, verifer_domain, verified_domain, name, country, province, city) 
            VALUES 
              ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
      [statement_hash, version, verifer_domain, verified_domain, name, country, province, city], (error, results) => {
        if (error) {
          console.log(error)
          resolve({ error })
        } else {
          resolve(`Verification inserted with ID: ${results.rows[0].id}`)
        }
      })
  } catch (error) {
    resolve({ error })
  }
}))


const getVerifications = ({ hash_b64 }) => (new Promise((resolve, reject) => {
  try {
    pool.query(`
            WITH domains AS (
              SELECT domain 
              FROM statements
              WHERE hash_b64=$1
              LIMIT 1
            )
            SELECT 
                v.*,
                s.*
            FROM verifications v
              JOIN statements s ON v.statement_hash=s.hash_b64
            WHERE v.verified_domain IN (SELECT domain FROM domains);
            `,[hash_b64], (error, results) => {
      if (error) {
        console.log(error)
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    resolve({ error })
  }
}));

const getAllVerifications = () => (new Promise((resolve, reject) => {
  try {
    pool.query(`
            SELECT 
                s.*
            FROM verifications v
              JOIN statements s ON v.statement_id=s.id
            `, (error, results) => {
      if (error) {
        console.log(error)
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    resolve({ error })
  }
}));

const getAllNodes = () => (new Promise((resolve, reject) => {
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
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    resolve({ error })
  }
}));

const addNode = ({ domain }) => (new Promise((resolve, reject) => {
  try {
    pool.query(`
            INSERT INTO p2p_nodes (domain, last_seen) VALUES
                ($1, CURRENT_TIMESTAMP)
            ON CONFLICT (domain) DO UPDATE
              SET last_seen = CURRENT_TIMESTAMP
            RETURNING *
            `,[domain], (error, results) => {
      if (error) {
        console.log(error)
        resolve({ error })
      } else {
        resolve({ inserted: results.rows[0] })
      }
    })
  } catch (error) {
    resolve({ error })
  }
}));

const getJoiningStatements = ({ hash_b64 }) => (new Promise((resolve, reject) => {
  try {
    pool.query(`
            WITH content_hashes AS(
              SELECT content_hash
              FROM statements
              WHERE hash_b64=$1
            )
            SELECT * FROM (
              SELECT 
                  s.*,
                  v.name,
                  rank() over(partition by s.id order by v.created_at desc) _rank
              FROM statements s        
                LEFT JOIN verifications v 
                  ON s.domain=v.verified_domain 
                  AND v.verifer_domain='rixdata.net'
              WHERE content_hash IN (SELECT content_hash FROM content_hashes)
              AND hash_b64 <> $1) AS result
            WHERE _rank = 1;
            `,[hash_b64], (error, results) => {
      if (error) {
        console.log(error)
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    resolve({ error })
  }
}))

const getStatement = ({ hash_b64 }) => (new Promise((resolve, reject) => {
  console.log('getStatement', hash_b64)
  try {
    pool.query(`
            SELECT 
                s.*,
                v.name
            FROM statements s        
              LEFT JOIN verifications v 
                ON s.domain=v.verified_domain 
                --AND v.verifer_domain='rixdata.net'
            WHERE hash_b64=$1;
            `,[hash_b64], (error, results) => {
      if (error) {
        console.log(error)
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    resolve({ error })
  }
}))

const setLastReceivedStatementId = ({ domain, id }) => (new Promise((resolve, reject) => {
  console.log('setLastReceivedStatementId', domain, id)
  try {
    pool.query(`
            UPDATE p2p_nodes
            SET last_received_statement_id = $1
            WHERE domain = $2
              AND (last_received_statement_id IS NULL
                OR
                last_received_statement_id < $1
              );
            `,[id, domain], (error, results) => {
      if (error) {
        console.log(error)
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    resolve({ error })
  }
}))

const statementExists = ({ hash_b64 }) => (new Promise((resolve, reject) => {
  try {
    pool.query(`
            SELECT 1 FROM statements WHERE hash_b64 = $1 LIMIT 1;
            `, [hash_b64], (error, results) => {

      //console.log('statementExists', hash_b64, results, error)
      if (error) {
        console.log(error)
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    resolve({ error })
  }
}))

const getOwnStatement = ({ hash_b64, ownDomain }) => (new Promise((resolve, reject) => {
  try {
    pool.query(`
            SELECT 
              *,
              $1 || $2 input
            FROM statements s
            WHERE hash_b64=$1
              ${ownDomain ? "AND domain=$2" : ""}
            ;
            `,[hash_b64, ownDomain || 'ownDomain'], (error, results) => {
      if (error) {
        console.log(error)
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    resolve({ error })
  }
}))

export default {
  createStatement: s(createStatement),
  getStatements: s(getStatements),
  getStatement: s(getStatement),
  getOwnStatement: s(getOwnStatement),
  createVerification: s(createVerification),
  getVerifications: s(getVerifications),
  getAllVerifications: s(getAllVerifications),
  getAllNodes: s(getAllNodes),
  addNode: s(addNode),
  getJoiningStatements: s(getJoiningStatements),
  setLastReceivedStatementId: s(setLastReceivedStatementId),
  statementExists: s(statementExists),
}
