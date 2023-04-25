import * as pg from 'pg'
import {forbiddenStrings} from './statementFormats.js'
import {performMigrations} from './database/migrations.js'
import * as cp from 'child_process'

import {fileURLToPath} from 'url'
import {dirname} from 'path'

// @ts-ignore
const { Pool } = pg.default

const pgHost = process.env.POSTGRES_HOST || "localhost"
const pgDatabase = process.env.POSTGRES_DB || "stated"
const pgUser = process.env.POSTGRES_USER || "sdf"
const pgPassword = process.env.POSTGRES_PW || "sdf"
const pgPort = parseInt(process.env.POSTGRES_PORT || '5432')

const pool = new Pool({
  user: pgUser,
  host: pgHost,
  database: pgDatabase,
  password: pgPassword,
  port: pgPort,
})

export const backup = () => {return new Promise((resolve, reject) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const fileName = __dirname + `/database/backups/` + `${new Date().toUTCString()}`.replace(/\W/g,'_') + `.sql`
    try {
        const pgdump = cp.spawn(`pg_dump`,[`-h`,`${pgHost}`,`-U`,`${pgUser}`,`-d`,`${pgDatabase}`,`-a`,`-f`,`${fileName}`], 
        {env: {PGPASSWORD: `${pgPassword}`, ...process.env}})
        pgdump.stdout.on('data', (data) => {
            try {
                log && console.log('data',data)
                return resolve({error: null})
            }
            catch(error) {
                return resolve({error})
            }
        })
        pgdump.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`); 
            return resolve({error: data})
        })
        pgdump.on('error', (error) => { 
            return resolve({error: 'pgdump process error: ' + error}) 
        })
        pgdump.on('close', (code) => {
          if(code === 0) {
            return resolve({error: null})
          }
            return resolve({error: 'pgdump process exited with code ' + code})
        });
    } catch (error){
        return resolve({error})
    }
})
};

const log = false

let migrationsDone = false;
([500, 5000]).map(ms => setTimeout(
  async () => {
    if(!migrationsDone){
      performMigrations(pool, ()=>migrationsDone=true)
    }
  }, ms
))

const s = (o) => {
  // sql&xss satitize all input to exported functions, checking all string values of a single input object
    if (typeof o != 'undefined') {
      if(forbiddenStrings(Object.values(o)).length > 0) {
        throw { error: ('Values contain forbidden Characters: ' + forbiddenStrings(Object.values(o)))}
      }
    }
}

export const createStatement = ({ type, domain, author, statement, proclaimed_publication_time, hash_b64, 
  tags, content, content_hash_b64, verification_method, source_node_id }) => (new Promise((resolve, reject) => {
  try {
    s({ type, domain, author, statement, proclaimed_publication_time, hash_b64, 
      tags, content, content_hash_b64, verification_method, source_node_id })
    pool.query(`INSERT INTO statements (type,                  domain,                 statement,              proclaimed_publication_time,       hash_b64,
                                        tags,                  content,                content_hash,           verification_method,               source_node_id,
                                        first_verification_time, latest_verification_time, derived_entity_created, derived_entity_creation_retry_count, author) 
                      VALUES ($1, $2, $3, TO_TIMESTAMP($4), $5,
                              $6, $7, $8, $9, $10, 
                              CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE, 0, $11)
                    ON CONFLICT (hash_b64) DO NOTHING
                    RETURNING *`,
      [ type, domain,  statement,        proclaimed_publication_time, hash_b64, 
        tags, content, content_hash_b64, verification_method,         source_node_id,
        author], (error, results) => {
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

export const getStatementsWithDetail = ({ minId, searchQuery }) => (new Promise((resolve, reject) => {
  try {
    s({minId, searchQuery})
    pool.query(`
            WITH reposts as(
                SELECT 
                    content as _content, 
                    count(distinct domain) as repost_count, 
                    first_value(min(id)) over(partition by content order by min(proclaimed_publication_time) asc) as first_id,
                    CAST($1 AS INTEGER) as input1,
                    $2 as input2
                FROM statements 
                WHERE (type = 'statement' OR type = 'poll' OR type = 'rating' 
                OR type = 'organisation_verification' OR type='sign_pdf')
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
                    LEFT JOIN organisation_verifications v 
                        ON s.domain=v.verified_domain 
                        AND v.verifier_domain='rixdata.net'
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

export const getStatements = ({ minId, onlyStatementsWithMissingEntities = false }) => (new Promise((resolve, reject) => {
  try {
    s({minId, onlyStatementsWithMissingEntities})
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
                  ' AND derived_entity_creation_retry_count < 7 ' + 
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

export const updateStatement = ({ hash_b64, derived_entity_created = false, 
  increment_derived_entity_creation_retry_count = false }) => (new Promise((resolve, reject) => {
  s({ hash_b64, derived_entity_created, 
      increment_derived_entity_creation_retry_count })
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
      SET derived_entity_creation_retry_count = derived_entity_creation_retry_count + 1
        WHERE hash_b64 = $1 
    `,[hash_b64]
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

export const createUnverifiedStatement = ({ statement, author, hash_b64, source_node_id, source_verification_method }) => (new Promise((resolve, reject) => {
  try {
    s({statement, hash_b64, source_node_id, source_verification_method})
    log && console.log(statement, hash_b64, source_node_id, source_verification_method)
    pool.query(`INSERT INTO unverified_statements (statement, hash_b64, source_node_id, source_verification_method, received_time, verification_retry_count, author) 
                      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 0, $5)
                    ON CONFLICT (hash_b64) DO NOTHING
                    RETURNING *`,
      [statement, hash_b64, source_node_id, source_verification_method, author], (error, results) => {
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

export const getUnverifiedStatements = () => (new Promise((resolve, reject) => {
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

export const updateUnverifiedStatement = ({ hash_b64, increment_verification_retry_count }) => (new Promise((resolve, reject) => {
  try {
      s({hash_b64, increment_verification_retry_count})
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

export const cleanUpUnverifiedStatements = ({max_age_hours, max_verification_retry_count}) => (new Promise((resolve, reject) => {
  try {
    s({max_age_hours, max_verification_retry_count})
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

export const createOrganisationVerification = ({ statement_hash, verifier_domain, verified_domain, 
  name, legal_entity_type, country, province, city, serialNumber, foreignDomain }) => (new Promise((resolve, reject) => {
  try {
    s({ statement_hash, verifier_domain, verified_domain, name, legal_entity_type, country, province, city, foreignDomain })
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

export const createPersonVerification = ({ statement_hash, verifier_domain, verified_domain,
   name,
   countryOfBirth, cityOfBirth, dateOfBirth, foreignDomain }) => (new Promise((resolve, reject) => {
  try {
    s({ statement_hash, verifier_domain, verified_domain, name,
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

export const createPoll = (o) => 
(new Promise((resolve, reject) => {
  try {
    s(o)
    const { statement_hash, participants_entity_type, participants_country, participants_city, deadline } = o
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

export const createVote = ({ statement_hash, poll_hash, option, domain, qualified }) => (new Promise((resolve, reject) => {
  try {
    s({ statement_hash, poll_hash, option, domain, qualified })
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

export const createRating = ({ statement_hash, organisation, domain, rating, comment }) => (new Promise((resolve, reject) => {
  try {
    s({ statement_hash, organisation, domain, rating, comment })
    log && console.log('create rating', [statement_hash, organisation, domain, rating, comment])
    pool.query(`
            INSERT INTO ratings 
              (statement_hash, organisation, domain, rating, comment) 
            VALUES 
              ($1, $2, $3, $4, $5)
            RETURNING *`,
      [statement_hash, organisation || '', domain || '', rating, comment || ''], (error, results) => {
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

export const getOrganisationVerificationsForStatement = ({ hash_b64 }) => (new Promise((resolve, reject) => {
  try {
    s({ hash_b64 })
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


export const getPersonVerificationsForStatement = ({ hash_b64 }) => (new Promise((resolve, reject) => {
  try {
    s({ hash_b64 })
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

export const getVerificationsForDomain = ({ domain }) => (new Promise((resolve, reject) => {
  try {
    s({ domain })
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

export const getAllVerifications = () => (new Promise((resolve, reject) => {
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

export const getHighConfidenceVerifications = ({max_inactive_verifier_node_days, min_primary_domain_confidence}) => (new Promise((resolve, reject) => {
  try {
    s({max_inactive_verifier_node_days, min_primary_domain_confidence})
    pool.query(`
            SELECT 
                v.*,
                b.name verifier_domain_name,
                n.last_seen verifier_node_last_seen
            FROM organisation_verifications v
              JOIN domain_ownsership_beliefs b 
                ON v.verifier_domain=b.domain
                AND b.name_confidence > $1
              JOIN p2p_nodes n 
                ON ('stated.' || b.domain)=n.domain
                AND n.last_seen > (now() - ($1 * INTERVAL '1 day'))
              ;
            `,[max_inactive_verifier_node_days || 1], (error, results) => {
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

export const createOrganisationIDBelief = (o) => (new Promise((resolve, reject) => {
  try {
    s(o)
    const { primary_domain1,
      name1,
      name1_confidence,
      legal_entity_type1,
      legal_entity_type1_confidence,
      country1,
      country1_confidence,
      province1,
      province1_confidence,
      city1,
      city1_confidence } = o
    pool.query(`
            INSERT INTO domain_ownsership_beliefs (
              domain,
              name,
              name_confidence,
              legal_entity_type,
              legal_entity_type_confidence,
              country,
              country_confidence,
              province,
              province_confidence,
              city,
              city_confidence
            ) VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (domain) DO NOTHING
            RETURNING *
            `,[primary_domain1,
              name1,
              name1_confidence,
              legal_entity_type1,
              legal_entity_type1_confidence,
              country1,
              country1_confidence,
              province1,
              province1_confidence,
              city1,
              city1_confidence], (error, results) => {
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


export const getPoll = ({ statement_hash }) => (new Promise((resolve, reject) => {
  console.log('getPoll', statement_hash)
  try {
    s({ statement_hash })
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


export const getAllNodes = () => (new Promise((resolve, reject) => {
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

export const addNode = ({ domain }) => (new Promise((resolve, reject) => {
  try {
    s({ domain })
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

export const getJoiningStatements = ({ hash_b64 }) => (new Promise((resolve, reject) => {
  try {
    s({ hash_b64 })
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
                LEFT JOIN organisation_verifications v 
                  ON s.domain=v.verified_domain 
                  AND v.verifier_domain='rixdata.net'
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

export const getVotes = ({ hash_b64 }) => (new Promise((resolve, reject) => {
  try {
    s({ hash_b64 })
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

export const getStatement = ({ hash_b64 }) => (new Promise((resolve, reject) => {
  log && console.log('getStatement', hash_b64)
  try {
    s({ hash_b64 })
    pool.query(`
            SELECT 
                s.*,
                v.name
            FROM statements s        
              LEFT JOIN organisation_verifications v 
                ON s.domain=v.verified_domain 
                --AND v.verifier_domain='rixdata.net'
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

export const updateNode = ({ domain, lastReceivedStatementId, certificateAuthority, fingerprint, ip }) => (new Promise((resolve, reject) => {
  try {
    s({ domain, lastReceivedStatementId, certificateAuthority, fingerprint, ip })
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

export const statementExists = ({ hash_b64 }) => (new Promise((resolve, reject) => {
  try {
    s({ hash_b64 })
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

export const getOwnStatement = ({ hash_b64, ownDomain }) => (new Promise((resolve, reject) => {
  try {
    s({ hash_b64, ownDomain })
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

export const getDomainOwnershipBeliefs = ({ domain }) => (new Promise((resolve, reject) => {
  try {
    s({ domain })
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



export const matchDomain = ({ domain_substring }) => (new Promise((resolve, reject) => {
  try {
    s({ domain_substring })
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

export const setCertCache = ({ domain, O, C, ST, L,
  issuer_o, issuer_c, issuer_cn, sha256, validFrom, validTo }) => (new Promise((resolve, reject) => {
  try {
    s({ domain, O, C, ST, L, issuer_o, issuer_c, issuer_cn, sha256, validFrom, validTo })
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

export const getCertCache = ({ domain }) => (new Promise((resolve, reject) => {
  if (!domain) return resolve({ error: 'no domain' })
  try {
    s({ domain })
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
