type statement = {
  type: string;
  domain: string;
  author: string;
  statement: string;
  proclaimed_publication_time: number;
  hash_b64: string;
  tags?: string[];
  content: string;
  content_hash_b64: string;
  verification_method?: string;
  source_node_id: number | null;
  supersededStatement?: string;
};

const log = false;

import { Pool } from "pg";
import { DBCallback, checkIfMigrationsAreDone } from ".";

export const createStatementFactory =
  (pool: Pool) =>
  ({
    type,
    domain,
    author,
    statement,
    proclaimed_publication_time,
    hash_b64,
    tags,
    content,
    content_hash_b64,
    verification_method,
    source_node_id,
    supersededStatement
  }: statement) =>
    new Promise((resolve: DBCallback<any>, reject) => {
      try {
        checkIfMigrationsAreDone()
        pool.query(
          `INSERT INTO statements (type,                  domain,                 statement,              proclaimed_publication_time,       hash_b64,
                                tags,                  content,                content_hash,           verification_method,               source_node_id,
                                first_verification_time, latest_verification_time, derived_entity_created, derived_entity_creation_retry_count, author,
                                superseded_statement) 
                        VALUES ($1, $2, $3, TO_TIMESTAMP($4), $5,
                                $6, $7, $8, $9, $10, 
                                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE, 0, $11,
                                $12)
            ON CONFLICT (hash_b64) DO NOTHING
            RETURNING *`,
          [
            type,
            domain,
            statement,
            proclaimed_publication_time,
            hash_b64,
            tags ? tags.join(',') : undefined,
            content,
            content_hash_b64,
            verification_method,
            source_node_id,
            author,
            supersededStatement?? null
          ],
          (error, results) => {
            if (error) {
              console.log(error);
              console.trace();
              return reject(error);
            } else {
              return resolve(results);
            }
          }
        );
      } catch (error) {
        console.log(error);
        console.trace();
        return reject(error);
      }
    });

export const createHiddenStatementFactory =
    (pool: Pool) =>
    ({
      type,
      domain,
      author,
      statement,
      proclaimed_publication_time,
      hash_b64,
      tags,
      content,
      content_hash_b64,
      verification_method,
      source_node_id,
      supersededStatement
    }: statement) =>
      new Promise((resolve: DBCallback<any>, reject) => {
        try {
          checkIfMigrationsAreDone()
          pool.query(
            `INSERT INTO hidden_statements (type,                  domain,                 statement,              proclaimed_publication_time,       hash_b64,
                                  tags,                  content,                content_hash,           verification_method,               source_node_id,
                                  first_verification_time, latest_verification_time, derived_entity_created, derived_entity_creation_retry_count, author,
                                  superseded_statement) 
                          VALUES ($1, $2, $3, TO_TIMESTAMP($4), $5,
                                  $6, $7, $8, $9, $10, 
                                  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE, 0, $11,
                                  $12)
              ON CONFLICT (hash_b64) DO NOTHING
              RETURNING *`,
            [
              type,
              domain,
              statement,
              proclaimed_publication_time,
              hash_b64,
              tags ? tags.join(',') : undefined,
              content,
              content_hash_b64,
              verification_method,
              source_node_id,
              author,
              supersededStatement?? null
            ],
            (error, results) => {
              if (error) {
                console.log(error);
                console.trace();
                return reject(error);
              } else {
                return resolve(results);
              }
            }
          );
        } catch (error) {
          console.log(error);
          console.trace();
          return reject(error);
        }
      });

export const getHiddenStatementFactory = (pool: Pool) => ({ hash_b64 }: { hash_b64: string }) => (
  new Promise((resolve: DBCallback<StatementWithHiddenDB>, reject) => {
        log && console.log('getStatement', hash_b64)
        try {
          checkIfMigrationsAreDone()
          pool.query(`
                  SELECT 
                      *,
                      TRUE hidden
                  FROM hidden_statements
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

export const getStatementFactory = (pool: Pool) => ({ hash_b64 }: { hash_b64: string }) => (
  new Promise((resolve: DBCallback<StatementWithSupersedingDB&{name?:string}>, reject) => {
        log && console.log('getStatement', hash_b64)
        try {
          checkIfMigrationsAreDone()
          pool.query(`
                  SELECT DISTINCT
                      s.author,
                      s.content,
                      s.content_hash,
                      s.derived_entity_created,
                      s.derived_entity_creation_retry_count,
                      s.domain,
                      s.first_verification_time,
                      s.hash_b64,
                      s.id,
                      s.latest_verification_time,
                      s.referenced_statement,
                      s.source_node_id,
                      s.statement,
                      s.superseded_statement,
                      s.superseding_statement,
                      s.tags,
                      s.type,
                      s.verification_method,
                      s.proclaimed_publication_time at time zone 'UTC' proclaimed_publication_time,
                      FIRST_VALUE(v.name) OVER(ORDER BY v.id DESC) name
                  FROM statement_with_superseding s        
                    LEFT JOIN organisation_verifications v 
                      ON s.domain=v.verified_domain 
                      --AND v.verifier_domain='rixdata.net'
                  WHERE hash_b64 LIKE $1||'%';
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

export const getObservationsForEntityFactory = (pool: Pool) => ({ domain, name, observerDomain, observerName }: { domain: string, name: string, observerDomain: string, observerName: string }) => (
  // TODO: support persons
  new Promise((resolve: DBCallback<StatementDB>, reject) => {
        log && console.log('findObservationsForEntity', domain, name, observerDomain, observerName)
        try {
          checkIfMigrationsAreDone()
          pool.query(`
with v as (
  select * from organisation_verifications 
  where verified_domain=$3
  and name=$4
)
select s.* 
from v 
join statements s
  on s.type='observation'
    and s.domain=$1
    and s.author=$2
    and statement like 
'%
  Subject identity reference: '||v.statement_hash||'
%'
  ;`,[domain, name, observerDomain, observerName], (error, results) => {
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

export const deleteStatementFactory = (pool: Pool) => ({ hash_b64 }: { hash_b64: string }) => (
  new Promise((resolve: DBCallback<any>, reject) => {
        log && console.log('deleteStatement', hash_b64)
        try {
          checkIfMigrationsAreDone()
          pool.query(`
                  DELETE FROM statements WHERE hash_b64=$1;
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

export const getStatementsWithDetailFactory =
  (pool: Pool) =>
  ({ skip, searchQuery, tag, limit, types, domain, author, legalForm } : {skip?: number,
    searchQuery?: string, tag?: string, limit?: number, types?: string[], domain?:string, author?: string, legalForm?: string}) => 
        new Promise((resolve: DBCallback<StatementWithDetailsDB>, reject) => {
      try {
        checkIfMigrationsAreDone();
        let typeQuery = ''
        for (let t of (types ?? [])) {
          if ('statement' === t) {
            typeQuery += " OR type = 'statement'"
          }
          if ('organisation_verification' === t) {
            typeQuery += " OR type = 'organisation_verification'"
          }
          if ('person_verification' === t) {
            typeQuery += " OR type = 'person_verification'"
          }
          if ('poll' === t) {
            typeQuery += " OR type = 'poll'"
          }
          if ('vote' === t) {
            typeQuery += " OR type = 'vote'"
          }
          if ('rating' === t) {
            typeQuery += " OR type = 'rating'"
          }
          if ('bounty' === t) {
            typeQuery += " OR type = 'bounty'"
          }
          if ('sign_pdf' === t) {
            typeQuery += " OR type = 'sign_pdf'"
          }
          if ('observation' === t) {
            typeQuery += " OR type = 'observation'"
          }
        }
        pool.query(
          `
          WITH 
          query_results as(
            SELECT 
                s.content as _content, 
                count(distinct s.domain) as repost_count, 
                first_value(min(s.id)) over(partition by s.content order by min(s.proclaimed_publication_time) asc) as first_id,
                CAST($1 AS INTEGER) as input1,
                $2 as input2,
                $3 as input3,
                $4 as input4,
                $5 as input5,
                $6 as input6,
                $7 as input7
            FROM statement_with_superseding s
            ${
              legalForm ?
              `
              JOIN identity_beliefs_and_reputation ibr
                ON ibr.domain = s.domain 
                AND ibr.name = s.author
                AND ibr.legal_entity_type = $7
                AND ibr.legal_entity_type_confidence > 0.98
              ` : ""
            }
            WHERE 
              superseding_statement IS NULL 
              ${
                typeQuery && typeQuery.length > 0 ? "AND (" + typeQuery.substring(4) + ")" : ""
              }
              ${
                searchQuery
                  ? "AND (LOWER(statement) LIKE '%'||$2||'%' OR LOWER(tags) LIKE '%'||$2||'%')"
                  : ""
              }
              ${
                domain
                  ? "AND domain=$4"
                  : ""
              }
              ${
                author
                  ? "AND author=$5"
                  : ""
              }
              ${
                tag
                  ? "AND tags LIKE '%'||$6||'%'"
                  : ""
              }
            GROUP BY 1
            ORDER BY repost_count DESC, first_id DESC
          )
         
         ,reposts as(
           SELECT
            *,
            max(skip_id) over() max_skip_id 
          FROM (
             SELECT 
               *,
               ROW_NUMBER() OVER (ORDER BY repost_count DESC, first_id DESC) skip_id
             FROM query_results
            ) as with_skip_ids
           WHERE skip_id > CAST( $1 AS BIGINT)
           LIMIT CAST( $3 AS BIGINT)
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
               s.proclaimed_publication_time at time zone 'UTC' proclaimed_publication_time,
               s.hash_b64,
               s.tags,
               s.content,
               s.content_hash,
               rank() over(partition by s.id order by verification_statement.proclaimed_publication_time desc) _rank,
               skip_id,
               max_skip_id
           FROM statement_with_superseding s
               JOIN reposts r
                   ON id=first_id
               LEFT JOIN organisation_verifications v 
                   ON s.domain=v.verified_domain 
                   AND v.verifier_domain='rixdata.net'
               LEFT JOIN statements verification_statement
                   ON v.statement_hash = verification_statement.hash_b64
             WHERE superseding_statement IS NULL
           ) AS results 
           LEFT JOIN votes on results.hash_b64=votes.poll_hash
         WHERE _rank=1
         ORDER BY repost_count DESC, id DESC; 
              `,
          [skip || 0, (searchQuery || "searchQuery").toLowerCase(), limit || 20, domain || '', author || '', tag || '', legalForm || ''],
          (error, results) => {
            if (error) {
              console.log(error);
              console.trace();
              return reject(error);
            } else {
              return resolve(results);
            }
          }
        );
      } catch (error) {
        console.log(error);
        console.trace();
        return reject(error);
      }
    });

export const getStatementsFactory =
  (pool: Pool) =>
  ({ minId = 0, onlyStatementsWithMissingEntities = false, domain = "", n = 20, ignoreSuperseded = false }) =>
    new Promise((resolve: DBCallback<StatementDB>, reject) => {
      try {
        checkIfMigrationsAreDone();
        pool.query(
          `
                WITH _ AS (SELECT $1 + 0 _, $2 __) -- use all input parameters
                SELECT 
                    id,
                    statement,
                    type,
                    content,
                    domain,
                    author,
                    hash_b64,
                    first_verification_time,
                    proclaimed_publication_time at time zone 'UTC' proclaimed_publication_time,
                    derived_entity_creation_retry_count
                  FROM statement_with_superseding 
                  WHERE id > $1 
                  ${ ignoreSuperseded ? "AND superseding_statement IS NULL" : "" }
                  ${
                    onlyStatementsWithMissingEntities
                      ? " AND derived_entity_created IS FALSE " +
                        " AND derived_entity_creation_retry_count < 7 " +
                        " AND type <> 'statement' "
                      : ""
                  }
                  ${domain ? " AND domain = $2 " : ""}
                  ORDER BY id ASC
                  LIMIT $3
              `,
          [minId, domain, n],
          (error, results) => {
            if (error) {
              console.log(error);
              console.trace();
              return reject(error);
            } else {
              return resolve(results);
            }
          }
        );
      } catch (error) {
        console.log(error);
        console.trace();
        return reject(error);
      }
    });
export const updateStatementFactory =
  (pool: Pool) =>
  ({
    hash_b64,
    derived_entity_created = false,
    increment_derived_entity_creation_retry_count = false,
    referenced_statement=null
  }: {
    hash_b64: string,
    derived_entity_created?: boolean,
    increment_derived_entity_creation_retry_count?: boolean,
    referenced_statement?: any
  }) =>
    new Promise((resolve: DBCallback<any>, reject) => {
      checkIfMigrationsAreDone()
      if (
        !hash_b64 ||
        !(
          derived_entity_created ||
          increment_derived_entity_creation_retry_count ||
          referenced_statement
        )
      ) {
        return reject(Error("missing parameters for updateStatement"));
      }
      try {
        if (hash_b64 && derived_entity_created) {
          pool.query(
            `
        UPDATE statements SET 
          derived_entity_created = $2
          WHERE hash_b64 = $1 
      `,
            [hash_b64, derived_entity_created],
            (error, results) => {
              if (error) {
                console.log(error);
                console.trace();
                return reject(error);
              } else {
                return resolve(results);
              }
            }
          );
        }
        if (hash_b64 && increment_derived_entity_creation_retry_count) {
          pool.query(
            `
        UPDATE statements 
        SET derived_entity_creation_retry_count = derived_entity_creation_retry_count + 1
          WHERE hash_b64 = $1 
      `,
            [hash_b64],
            (error, results) => {
              if (error) {
                console.log(error);
                console.trace();
                return reject(error);
              } else {
                return resolve(results);
              }
            }
          );
        }
        if (hash_b64 && referenced_statement) {
          pool.query(
            `
        UPDATE statements 
        SET referenced_statement=$2
          WHERE hash_b64=$1 
      `,
            [hash_b64, referenced_statement],
            (error, results) => {
              if (error) {
                console.log(error);
                console.trace();
                return reject(error);
              } else {
                return resolve(results);
              }
            }
          );
        }
      } catch (error) {
        console.log(error);
        console.trace();
        return reject(error);
      }
    });

export const checkIfUnverifiedStatementExistsFactory = (pool: Pool) => ({ hash_b64 }:{hash_b64:string}) =>
  new Promise((resolve: DBCallback<{exists: boolean}>, reject) => {
    try {
      checkIfMigrationsAreDone()
      pool.query(
        `
                SELECT TRUE exists FROM unverified_statements WHERE hash_b64=$1 LIMIT 1;
              `,
        [hash_b64],
        (error, results) => {
          if (error) {
            console.log(error);
            console.trace();
            return reject(error);
          } else {
            return resolve(results);
          }
        }
      );
    } catch (error) {
      console.log(error);
      console.trace();
      return reject(error);
    }
  });

export const createUnverifiedStatementFactory =
  (pool: Pool) =>
  ({
    statement,
    author,
    hash_b64,
    source_node_id,
    source_verification_method,
  }: {
    statement: string;
    author: string;
    hash_b64: string;
    source_node_id: number|null;
    source_verification_method: VerificationMethodDB | null;
  }) =>
    new Promise((resolve: DBCallback<any>, reject) => {
      try {
        checkIfMigrationsAreDone()
        log &&
          console.log(
            statement,
            hash_b64,
            source_node_id,
            source_verification_method
          );
        pool.query(
          `INSERT INTO unverified_statements (statement, hash_b64, source_node_id, source_verification_method, received_time, verification_retry_count, author) 
                        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 0, $5)
                      ON CONFLICT (hash_b64) DO NOTHING
                      RETURNING *`,
          [
            statement,
            hash_b64,
            source_node_id,
            source_verification_method,
            author,
          ],
          (error, results) => {
            if (error) {
              console.log(error);
              console.trace();
              return reject(error);
            } else {
              return resolve(results);
            }
          }
        );
      } catch (error) {
        console.log(error);
        console.trace();
        return reject(error);
      }
    });

export const getUnverifiedStatementsFactory = (pool: Pool) => () =>
  new Promise((resolve: DBCallback<StatementDB&{verification_retry_count:number}>, reject) => {
    try {
      checkIfMigrationsAreDone()
      pool.query(
        `
                SELECT 
                  statement, hash_b64, source_node_id, source_verification_method, received_time, verification_retry_count
                FROM 
                  unverified_statements 
              `,
        (error, results) => {
          if (error) {
            console.log(error);
            console.trace();
            return reject(error);
          } else {
            return resolve(results);
          }
        }
      );
    } catch (error) {
      console.log(error);
      console.trace();
      return reject(error);
    }
  });

export const updateUnverifiedStatementFactory =
  (pool: Pool) =>
  ({ hash_b64, increment_verification_retry_count }: { hash_b64: string, increment_verification_retry_count: number }) =>
    new Promise((resolve: DBCallback<any>, reject) => {
      try {
        checkIfMigrationsAreDone();
        if (hash_b64 && increment_verification_retry_count) {
          pool.query(
            `
          UPDATE unverified_statements SET 
            verification_retry_count = verification_retry_count + $2
            WHERE hash_b64 = $1 
        `,
            [hash_b64, increment_verification_retry_count],
            (error, results) => {
              if (error) {
                console.log(error);
                console.trace();
                return reject(error);
              } else {
                return resolve(results);
              }
            }
          );
        } else {
          return reject(Error("missing values"));
        }
      } catch (error) {
        console.log(error);
        console.trace();
        return reject(error);
      }
    });

export const cleanUpUnverifiedStatementsFactory =
  (pool: Pool) =>
  ({ max_age_hours, max_verification_retry_count }: { max_age_hours: number, max_verification_retry_count: number }) =>
    new Promise((resolve: DBCallback<any>, reject) => {
      try {
        checkIfMigrationsAreDone();
        pool.query(
          `
                DELETE FROM 
                  unverified_statements
                WHERE 
                    (
                      received_time < CURRENT_TIMESTAMP + ($1 * INTERVAL '1 hour')
                      AND verification_retry_count > $2
                    )
                    OR hash_b64 IN (SELECT hash_b64 from statements)
              `,
          [max_age_hours, max_verification_retry_count],
          (error, results) => {
            if (error) {
              console.log(error);
              console.trace();
              return reject(error);
            } else {
              return resolve(results);
            }
          }
        );
      } catch (error) {
        console.log(error);
        console.trace();
        return reject(error);
      }
    });



export const getJoiningStatementsFactory = (pool: Pool) => ({ hash_b64 }: { hash_b64: string }) => (new Promise((resolve: DBCallback<StatementDB & {name?: string, _rank: number}>, reject) => {
        try {
          checkIfMigrationsAreDone()
          pool.query(`
                  WITH content_hashes AS(
                    SELECT content_hash
                    FROM statements
                    WHERE hash_b64=$1
                  )
                  SELECT * FROM (
                    SELECT 
                        s.*,
                        COALESCE(v.name, pv.name) name,
                        rank() over(partition by s.id order by verification_statement.proclaimed_publication_time desc) _rank
                    FROM statement_with_superseding s        
                      LEFT JOIN organisation_verifications v 
                        ON (s.domain=v.verified_domain 
                          OR s.domain=v.foreign_domain)
                        --AND v.verifier_domain='rixdata.net'
                      LEFT JOIN person_verifications pv 
                        ON (s.domain=pv.verified_domain OR s.domain=pv.foreign_domain)
                        --AND pv.verifier_domain='rixdata.net'
                      LEFT JOIN statements verification_statement
                        ON ( v.statement_hash = verification_statement.hash_b64
                          OR pv.statement_hash = verification_statement.hash_b64)
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

      export const getOwnStatementFactory = (pool: Pool) => ({ hash_b64, ownDomain }: { hash_b64: string, ownDomain: string }) => (new Promise((resolve: DBCallback<StatementDB>, reject) => {
        try {
          checkIfMigrationsAreDone()
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

export const statementExistsFactory = (pool: Pool) => ({ hash_b64 }: { hash_b64: string }) => (new Promise((resolve: DBCallback<{exists: boolean}>, reject) => {
        try {
          checkIfMigrationsAreDone()
          log && console.log(hash_b64, 'check')
          pool.query(`
                  SELECT TRUE exists FROM statements WHERE hash_b64=$1 LIMIT 1;
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