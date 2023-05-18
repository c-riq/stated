import { Pool, QueryResult } from 'pg'
import {forbiddenStrings} from '../statementFormats'
import {performMigrations} from './migrations'
import * as cp from 'child_process'

const pgHost = process.env.POSTGRES_HOST || "localhost"
const pgDatabase = process.env.POSTGRES_DB || "stated"
const pgUser = process.env.POSTGRES_USER || "sdf"
const pgPassword = process.env.POSTGRES_PW || "sdf"
const pgPort = parseInt(process.env.POSTGRES_PORT || '5432')
const test = process.env.TEST || false

const pool = new Pool({
  user: pgUser,
  host: pgHost,
  database: pgDatabase,
  password: pgPassword,
  port: pgPort,
})

export type DBCallback = (result?: QueryResult) => void
export type DBErrorCallback = (error: Error) => void

export const backup = () => {return new Promise((resolve: DBCallback, reject: DBErrorCallback) => {
    if(test) {
        return resolve()
    }
    const fileName = __dirname + `/database/backups/` + `${new Date().toUTCString()}`.replace(/\W/g,'_') + `.sql`
    try {
        const pgdump = cp.spawn(`pg_dump`,[`-h`,`${pgHost}`,`-U`,`${pgUser}`,`-d`,`${pgDatabase}`,`-a`,`-f`,`${fileName}`], 
        {env: {PGPASSWORD: `${pgPassword}`, ...process.env}})
        pgdump.stdout.on('data', (data) => {
            try {
                log && console.log('data',data)
                return resolve()
            }
            catch(error) {
                return reject(error)
            }
        })
        pgdump.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`); 
            return reject(data)
        })
        pgdump.on('error', (error) => { 
            return reject(Error('pgdump process error: ' + error))
        })
        pgdump.on('close', (code) => {
          if(code === 0) {
            return resolve()
          }
            return reject(Error('pgdump process exited with code ' + code))
        });
    } catch (error){
        return reject(Error(error))
    }
})
};

const log = false

let migrationsDone = false;
([500, 2500, 5000]).map(ms => setTimeout(
  async () => {
    if(!migrationsDone){
      await performMigrations(pool, ()=>migrationsDone=true)
    }
  }, ms
))

export const sanitize = (o) => {
  // sql&xss satitize all input to exported functions, checking all string values of a single input object
    if (!migrationsDone){
      throw { error: 'Migrations not done yet'}
    }
    if (typeof o != 'undefined') {
      if(forbiddenStrings(Object.values(o)).length > 0) {
        throw { error: ('Values contain forbidden Characters: ' + forbiddenStrings(Object.values(o)))}
      }
    }
}

import { createStatementFactory, getStatementsFactory, getStatementsWithDetailFactory, 
  getUnverifiedStatementsFactory, updateStatementFactory, cleanUpUnverifiedStatementsFactory, 
  createUnverifiedStatementFactory } from './statements'

export const createStatement = createStatementFactory(pool)
export const getStatements = getStatementsFactory(pool)
export const getStatementsWithDetail = getStatementsWithDetailFactory(pool)
export const getUnverifiedStatements = getUnverifiedStatementsFactory(pool)
export const updateStatement = updateStatementFactory(pool)
export const createUnverifiedStatement = createUnverifiedStatementFactory(pool)
export const cleanUpUnverifiedStatements = cleanUpUnverifiedStatementsFactory(pool)


export const createOrganisationVerification = ({ statement_hash, verifier_domain, verified_domain, 
  name, legal_entity_type, country, province, city, serialNumber, foreignDomain }) => (new Promise((resolve, reject) => {
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

export const createPersonVerification = ({ statement_hash, verifier_domain, verified_domain,
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

export const createPoll = (o) => 
(new Promise((resolve: DBCallback, reject) => {
  try {
    sanitize(o)
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

export const createVote = ({ statement_hash, poll_hash, option, domain, qualified }) => (new Promise((resolve: DBCallback, reject) => {
  try {
    sanitize({ statement_hash, poll_hash, option, domain, qualified })
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

export const createRating = ({ statement_hash, organisation, domain, rating, comment }) => (new Promise((resolve: DBCallback, reject) => {
  try {
    sanitize({ statement_hash, organisation, domain, rating, comment })
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

export const getOrganisationVerificationsForStatement = ({ hash_b64 }) => (new Promise((resolve: DBCallback, reject) => {
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


export const getPersonVerificationsForStatement = ({ hash_b64 }) => (new Promise((resolve: DBCallback, reject) => {
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

export const getVerificationsForDomain = ({ domain }) => (new Promise((resolve: DBCallback, reject) => {
  try {
    sanitize({ domain })
    pool.query(`
            SELECT 
                *
            FROM verifications
            WHERE verified_domain = $1;
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

export const getAllVerifications = () => (new Promise((resolve: DBCallback, reject) => {
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

export const getPoll = ({ statement_hash }) => (new Promise((resolve: DBCallback, reject) => {
  console.log('getPoll', statement_hash)
  try {
    sanitize({ statement_hash })
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


export const getAllNodes = () => (new Promise((resolve: DBCallback, reject) => {
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

export const addNode = ({ domain }) => (new Promise((resolve: DBCallback, reject) => {
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

export const getJoiningStatements = ({ hash_b64 }) => (new Promise((resolve: DBCallback, reject) => {
  try {
    sanitize({ hash_b64 })
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

export const getVotes = ({ hash_b64 }) => (new Promise((resolve: DBCallback, reject) => {
  try {
    sanitize({ hash_b64 })
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

export const getStatement = ({ hash_b64 }) => (new Promise((resolve: DBCallback, reject) => {
  log && console.log('getStatement', hash_b64)
  try {
    sanitize({ hash_b64 })
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

export const updateNode = ({ domain, lastReceivedStatementId, certificateAuthority, fingerprint, ip }) => (new Promise((resolve: DBCallback, reject) => {
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

export const statementExists = ({ hash_b64 }) => (new Promise((resolve: DBCallback, reject) => {
  try {
    sanitize({ hash_b64 })
    log && console.log(hash_b64, 'check')
    pool.query(`
            SELECT 1 FROM statements WHERE hash_b64=$1 LIMIT 1;
            `, [hash_b64], (error, results) => {
      log && console.log('statementExists', hash_b64, results, error)
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

export const getOwnStatement = ({ hash_b64, ownDomain }) => (new Promise((resolve: DBCallback, reject) => {
  try {
    sanitize({ hash_b64, ownDomain })
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

export const getDomainOwnershipBeliefs = ({ domain }) => (new Promise((resolve: DBCallback, reject) => {
  try {
    sanitize({ domain })
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



export const matchDomain = ({ domain_substring }) => (new Promise((resolve: DBCallback, reject) => {
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

export const setCertCache = ({ domain, O, C, ST, L,
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

export const getCertCache = ({ domain }) => (new Promise((resolve: DBCallback, reject) => {
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
