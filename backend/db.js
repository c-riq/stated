import * as pg from 'pg'
import {forbiddenStrings} from './statementFormats.js'
import {performMigrations} from './migrations.js'

const { Pool } = pg.default

const pgHost = process.env.POSTGRES_HOST || "localhost"
const pgDatabase = process.env.POSTGRES_DB || "dev"
const pgUser = process.env.POSTGRES_USER || "sdf"
const pgPassword = process.env.POSTGRES_PW || "sdf"

const pool = new Pool({
  user: pgUser,
  host: pgHost,
  database: pgDatabase,
  password: pgPassword,
  port: 5432,
})

const log = false

let migrationsDone = false
setInterval(
async () => {
  if(!migrationsDone){
    performMigrations(pool, ()=>migrationsDone=true)
  }
}, 500)

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

const createStatement = ({ type, domain, statement, proclaimed_publication_time, hash_b64, 
  tags, content, content_hash_b64, verification_method, source_node_id }) => (new Promise((resolve, reject) => {
  try {
    log && console.log(type, domain, statement, proclaimed_publication_time, hash_b64, 
      tags, content, content_hash_b64, verification_method, source_node_id)
    pool.query(`INSERT INTO statements (type,                  domain,                 statement,              proclaimed_publication_time,       hash_b64,
                                        tags,                  content,                content_hash,           verification_method,               source_node_id,
                                        first_verification_time, latest_verification_time, derived_entity_created, derived_entity_creation_retry_count) 
                      VALUES ($1, $2, $3, TO_TIMESTAMP($4), $5,
                              $6, $7, $8, $9, $10, 
                              CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE, 0)
                    ON CONFLICT (hash_b64) DO NOTHING
                    RETURNING *`,
      [ type, domain,  statement,        proclaimed_publication_time, hash_b64, 
        tags, content, content_hash_b64, verification_method,         source_node_id], (error, results) => {
        if (error) {
          console.log(error)
          console.trace()
          resolve({ error })
        } else {
          resolve(results)
        }
      })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}))

const getStatementsWithDetail = ({ minId, searchQuery }) => (new Promise((resolve, reject) => {
  try {
    pool.query(`
            WITH reposts as(
                SELECT 
                    content as _content, 
                    count(distinct domain) as repost_count, 
                    first_value(min(id)) over(partition by content order by min(proclaimed_publication_time) asc) as first_id,
                    CAST($1 AS INTEGER) as input1,
                    $2 as input2
                FROM statements 
                WHERE (type = 'statement' OR type = 'poll')
                ${minId ? 'AND id > $1 ' : ''}
                ${searchQuery ? 'AND (content LIKE \'%\'||$2||\'%\' OR tags LIKE \'%\'||$2||\'%\')' : ''}
                GROUP BY 1
                ORDER BY repost_count DESC
                LIMIT 20
            )
            ,votes as (
              SELECT 
                poll_hash,
                json_object_agg(option, cnt) AS votes 
              FROM ( SELECT 
                    poll_hash,
                    option,
                    count(*) as cnt
                FROM votes 
                WHERE qualified = TRUE
                GROUP BY 1,2
              ) AS counts GROUP BY 1
            )
            SELECT * FROM (
              SELECT 
                  s.id,
                  s.type,
                  s.domain,
                  v.name,
                  s.statement,
                  r.repost_count,
                  s.proclaimed_publication_time,
                  s.hash_b64,
                  s.tags,
                  s.content,
                  s.content_hash,
                  rank() over(partition by s.id order by verification_statement.proclaimed_publication_time desc) _rank
                FROM statements s
                    JOIN reposts r
                        ON id=first_id
                    LEFT JOIN verifications v 
                        ON s.domain=v.verified_domain 
                        AND v.verifer_domain='rixdata.net'
                    LEFT JOIN statements verification_statement
                        ON v.statement_hash = verification_statement.hash_b64
                ) AS results 
                LEFT JOIN votes on results.hash_b64=votes.poll_hash
              WHERE _rank=1;
            `,[minId || 0, searchQuery || 'searchQuery']
            , (error, results) => {
      if (error) {
        console.log(error)
        console.trace()
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}))

const getStatements = ({ minId, onlyStatementsWithMissingEntities }) => (new Promise((resolve, reject) => {
  try {
    pool.query(`
              SELECT 
                  id,
                  statement,
                  type,
                  content,
                  domain,
                  hash_b64,
                  first_verification_time,
                  derived_entity_creation_retry_count
                FROM statements 
                WHERE id > $1 ${onlyStatementsWithMissingEntities ? 
                  ' AND derived_entity_created IS FALSE ' + 
                  ' AND derived_entity_creation_retry_count < 6 ' + 
                  ' AND type <> \'statement\' '
                  : ''}
            `,[minId || 0]
            , (error, results) => {
      if (error) {
        console.log(error)
        console.trace()
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}))

const updateStatement = ({ hash_b64, derived_entity_created, 
  increment_derived_entity_creation_retry_count }) => (new Promise((resolve, reject) => {
  if (!hash_b64 || !(derived_entity_created || increment_derived_entity_creation_retry_count)){
    resolve({error: 'missing parameters for updateStatement'})
  }
  try {
    if(hash_b64 && derived_entity_created){
      pool.query(`
      UPDATE statements SET 
        derived_entity_created = $2
        WHERE hash_b64 = $1 
    `,[hash_b64, derived_entity_created]
    , (error, results) => {
      if (error) {
        console.log(error)
        console.trace()
        resolve({ error })
      } else {
        resolve(results)
      }
      })
    } 
    if(hash_b64 && increment_derived_entity_creation_retry_count){
      pool.query(`
      UPDATE statements 
      SET derived_entity_creation_retry_count = derived_entity_creation_retry_count + $2
        WHERE hash_b64 = $1 
    `,[hash_b64, increment_derived_entity_creation_retry_count]
    , (error, results) => {
      if (error) {
        console.log(error)
        console.trace()
        resolve({ error })
      } else {
        resolve(results)
      }
      })
    }
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
    return
  }
}))

const createUnverifiedStatement = ({ statement, hash_b64, source_node_id, source_verification_method }) => (new Promise((resolve, reject) => {
  try {
    log && console.log(statement, hash_b64, source_node_id, source_verification_method)
    pool.query(`INSERT INTO unverified_statements (statement, hash_b64, source_node_id, source_verification_method, received_time, verification_retry_count) 
                      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 0)
                    ON CONFLICT (hash_b64) DO NOTHING
                    RETURNING *`,
      [statement, hash_b64, source_node_id, source_verification_method], (error, results) => {
        if (error) {
          console.log(error)
          console.trace()
          resolve({ error })
        } else {
          resolve(results)
        }
      })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}))

const getUnverifiedStatements = () => (new Promise((resolve, reject) => {
  try {
    pool.query(`
              SELECT 
                statement, hash_b64, source_node_id, source_verification_method, received_time, verification_retry_count
              FROM 
                unverified_statements 
            `, (error, results) => {
      if (error) {
        console.log(error)
        console.trace()
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}))

const updateUnverifiedStatement = ({ hash_b64, increment_verification_retry_count }) => (new Promise((resolve, reject) => {
  try {
      if(hash_b64 && increment_verification_retry_count){
        pool.query(`
        UPDATE unverified_statements SET 
          verification_retry_count = verification_retry_count + $2
          WHERE hash_b64 = $1 
      `,[hash_b64, increment_verification_retry_count]
      , (error, results) => {
        if (error) {
          console.log(error)
          console.trace()
          resolve({ error })
        } else {
          resolve(results)
        }
        })
      } else {
        resolve({error: 'missing values'})
      }
    } catch (error) {
      console.log(error)
      console.trace()
      resolve({ error })
      return
    }
  }
))

const cleanUpUnverifiedStatements = ({max_age_hours, max_verification_retry_count}) => (new Promise((resolve, reject) => {
  try {
    pool.query(`
              DELETE FROM 
                unverified_statements
              WHERE 
                  (
                    received_time < CURRENT_TIMESTAMP + ($1 * INTERVAL '1 hour')
                    AND verification_retry_count > $2
                  )
                  OR hash_b64 IN (SELECT hash_b64 from statements)
            `,[max_age_hours, max_verification_retry_count]
            , (error, results) => {
      if (error) {
        console.log(error)
        console.trace()
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}))

const createVerification = ({ statement_hash, verifer_domain, verified_domain, name, legal_entity_type, country, province, city }) => (new Promise((resolve, reject) => {
  try {
    log && console.log([statement_hash, verifer_domain, verified_domain, name, legal_entity_type, country, province, city])
    pool.query(`
            INSERT INTO verifications 
              (statement_hash, verifer_domain, verified_domain, name, legal_entity_type, 
                country, province, city) 
            VALUES 
              ($1, $2, $3, $4, $5, 
                $6, $7, $8)
            RETURNING *`,
      [statement_hash, verifer_domain, verified_domain, name, legal_entity_type, country, province, city], (error, results) => {
        if (error) {
          console.log(error)
          console.trace()
          resolve({ error })
        } else {
          resolve(results)
        }
      })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}))

const createPoll = ({ statement_hash, participants_entity_type, participants_country, participants_city, deadline }) => 
(new Promise((resolve, reject) => {
  try {
    log && console.log([statement_hash, participants_entity_type, participants_country, participants_city, deadline ])
    pool.query(`
            INSERT INTO polls 
              (statement_hash, participants_entity_type, participants_country, participants_city, deadline) 
            VALUES 
              ($1, $2, $3, $4, $5)
            ON CONFLICT (statement_hash) DO NOTHING
            RETURNING *`,
      [statement_hash, participants_entity_type, participants_country, participants_city, deadline ], (error, results) => {
        if (error) {
          console.log(error)
          console.trace()
          resolve({ error })
        } else {
          resolve(results)
        }
      })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}))

const createVote = ({ statement_hash, poll_hash, option, domain, qualified }) => (new Promise((resolve, reject) => {
  try {
    log && console.log('createVote', [statement_hash, poll_hash, option, domain, qualified])
    pool.query(`
            INSERT INTO votes 
              (statement_hash, poll_hash, option, domain, qualified) 
            VALUES 
              ($1, $2, $3, $4, $5)
            RETURNING *`,
      [statement_hash, poll_hash, option, domain, qualified], (error, results) => {
        if (error) {
          console.log(error)
          console.trace()
          resolve({error})
        } else {
          resolve(results)
        }
      })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}))

const getVerificationsForStatement = ({ hash_b64 }) => (new Promise((resolve, reject) => {
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
        console.trace()
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}));

const getVerifications = ({ domain }) => (new Promise((resolve, reject) => {
  try {
    pool.query(`
            SELECT 
                *
            FROM verifications
            WHERE verified_domain = $1;
            `,[domain], (error, results) => {
      if (error) {
        console.log(error)
        console.trace()
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}))

const getPoll = ({ statement_hash }) => (new Promise((resolve, reject) => {
  console.log('getPoll', statement_hash)
  try {
    pool.query(`
            SELECT 
                *
            FROM polls
            JOIN statements 
              ON polls.statement_hash = statements.hash_b64
              AND polls.statement_hash = $1;
            `,[statement_hash], (error, results) => {
      if (error) {
        console.log(error)
        console.trace()
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}))

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
        console.trace()
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    console.log(error)
    console.trace()
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
        console.trace()
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}));

const addNode = ({ domain }) => (new Promise((resolve, reject) => {
  try {
    pool.query(`
            INSERT INTO p2p_nodes (domain, first_seen, last_seen) VALUES
                ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (domain) DO NOTHING
            RETURNING *
            `,[domain], (error, results) => {
      if (error) {
        console.log(error)
        console.trace()
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    console.log(error)
    console.trace()
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
                  rank() over(partition by s.id order by verification_statement.proclaimed_publication_time desc) _rank
              FROM statements s        
                LEFT JOIN verifications v 
                  ON s.domain=v.verified_domain 
                  AND v.verifer_domain='rixdata.net'
                LEFT JOIN statements verification_statement
                  ON v.statement_hash = verification_statement.hash_b64
              WHERE s.content_hash IN (SELECT content_hash FROM content_hashes)
              AND s.hash_b64 <> $1) AS result
            WHERE _rank = 1;
            `,[hash_b64], (error, results) => {
      if (error) {
        console.log(error)
        console.trace()
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}))

const getVotes = ({ hash_b64 }) => (new Promise((resolve, reject) => {
  try {
    pool.query(`
      SELECT 
        *
      FROM votes v 
        LEFT JOIN statements s 
          ON v.statement_hash = s.hash_b64
      WHERE qualified = TRUE
        AND poll_hash = $1
      `,[hash_b64], (error, results) => {
      if (error) {
        console.log(error)
        console.trace()
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}))

const getStatement = ({ hash_b64 }) => (new Promise((resolve, reject) => {
  log && console.log('getStatement', hash_b64)
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
        console.trace()
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}))

const updateNode = ({ domain, lastReceivedStatementId, certificateAuthority, fingerprint, ip }) => (new Promise((resolve, reject) => {
  try {
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
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}))

const statementExists = ({ hash_b64 }) => (new Promise((resolve, reject) => {
  try {
    log && console.log(hash_b64, 'check')
    pool.query(`
            SELECT 1 FROM statements WHERE hash_b64=$1 LIMIT 1;
            `, [hash_b64], (error, results) => {
      log && console.log('statementExists', hash_b64, results, error)
      if (error) {
        console.log(error)
        console.trace()
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    console.log(error)
    console.trace()
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
        console.trace()
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}))

const getDomainOwnershipBeliefs = ({ domain }) => (new Promise((resolve, reject) => {
  try {
    pool.query(`
            WITH regex AS (
              SELECT '^(http:\/\/|https:\/\/)?(www\.)?' || $1 || '\..*$' as pattern
            ),
             matches AS (SELECT 
              *
            FROM wikidata_org_domains
            CROSS JOIN regex
            WHERE 
              official_website ~ regex.pattern
            )
            SELECT 
              *,
              0.8 / count(*) over() AS confidence,
              'https://www.wikidata.org/wiki/Wikidata:Database_download wikidata-20220103-all.json.gz' AS source
            FROM matches;
            `,[domain], (error, results) => {
      if (error) {
        console.log(error)
        console.trace()
        resolve({ error })
      } else {
        resolve(results)
      }
    })
  } catch (error) {
    console.log(error)
    console.trace()
    resolve({ error })
  }
}))

export default {
  createUnverifiedStatement: s(createUnverifiedStatement),
  getUnverifiedStatements: s(getUnverifiedStatements),
  updateUnverifiedStatement: s(updateUnverifiedStatement),
  cleanUpUnverifiedStatements: s(cleanUpUnverifiedStatements),
  createStatement: s(createStatement),
  updateStatement: s(updateStatement),
  getStatements: s(getStatements),
  getStatementsWithDetail: s(getStatementsWithDetail),
  getStatement: s(getStatement),
  getOwnStatement: s(getOwnStatement),
  createVerification: s(createVerification),
  createPoll: s(createPoll),
  getPoll: s(getPoll),
  createVote: s(createVote),
  getVerifications: s(getVerifications),
  getVerificationsForStatement: s(getVerificationsForStatement),
  getAllVerifications: s(getAllVerifications),
  getAllNodes: s(getAllNodes),
  addNode: s(addNode),
  getJoiningStatements: s(getJoiningStatements),
  getVotes: s(getVotes),
  updateNode: s(updateNode),
  statementExists: s(statementExists),
  getDomainOwnershipBeliefs: s(getDomainOwnershipBeliefs)
}
