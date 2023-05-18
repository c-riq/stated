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
  source_node_id?: string;
};

const log = false;

import { DBCallback, DBErrorCallback, sanitize } from ".";

export const createStatementFactory =
  (pool) =>
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
  }: statement) =>
    new Promise((resolve: DBCallback, reject) => {
      try {
        sanitize({
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
        });
        pool.query(
          `INSERT INTO statements (type,                  domain,                 statement,              proclaimed_publication_time,       hash_b64,
                                tags,                  content,                content_hash,           verification_method,               source_node_id,
                                first_verification_time, latest_verification_time, derived_entity_created, derived_entity_creation_retry_count, author) 
                        VALUES ($1, $2, $3, TO_TIMESTAMP($4), $5,
                                $6, $7, $8, $9, $10, 
                                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE, 0, $11)
                      ON CONFLICT (hash_b64) DO NOTHING
                      RETURNING *`,
          [
            type,
            domain,
            statement,
            proclaimed_publication_time,
            hash_b64,
            tags,
            content,
            content_hash_b64,
            verification_method,
            source_node_id,
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

export const getStatementsWithDetailFactory =
  (pool) =>
  ({ minId, searchQuery }) =>
    new Promise((resolve: DBCallback, reject) => {
      try {
        sanitize({ minId, searchQuery });
        pool.query(
          `
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
                  ${minId ? "AND id > $1 " : ""}
                  ${
                    searchQuery
                      ? "AND (content LIKE '%'||$2||'%' OR tags LIKE '%'||$2||'%')"
                      : ""
                  }
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
              `,
          [minId || 0, searchQuery || "searchQuery"],
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
  (pool) =>
  ({ minId = 0, onlyStatementsWithMissingEntities = false, domain = "" }) =>
    new Promise((resolve: DBCallback, reject) => {
      try {
        sanitize({ minId, onlyStatementsWithMissingEntities });
        pool.query(
          `
                WITH _ AS (SELECT $1 + 0 _, $2 __) -- use all input parameters
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
                  WHERE id > $1 
                  ${
                    onlyStatementsWithMissingEntities
                      ? " AND derived_entity_created IS FALSE " +
                        " AND derived_entity_creation_retry_count < 7 " +
                        " AND type <> 'statement' "
                      : ""
                  }
                  ${domain ? " AND domain = $2 " : ""}
              `,
          [minId, domain],
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
  (pool) =>
  ({
    hash_b64,
    derived_entity_created = false,
    increment_derived_entity_creation_retry_count = false,
  }) =>
    new Promise((resolve: DBCallback, reject) => {
      sanitize({
        hash_b64,
        derived_entity_created,
        increment_derived_entity_creation_retry_count,
      });
      if (
        !hash_b64 ||
        !(
          derived_entity_created ||
          increment_derived_entity_creation_retry_count
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
      } catch (error) {
        console.log(error);
        console.trace();
        return reject(error);
      }
    });

export const createUnverifiedStatementFactory =
  (pool) =>
  ({
    statement,
    author,
    hash_b64,
    source_node_id,
    source_verification_method,
  }) =>
    new Promise((resolve: DBCallback, reject) => {
      try {
        sanitize({
          statement,
          hash_b64,
          source_node_id,
          source_verification_method,
        });
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

export const getUnverifiedStatementsFactory = (pool) => () =>
  new Promise((resolve: DBCallback, reject) => {
    try {
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
  (pool) =>
  ({ hash_b64, increment_verification_retry_count }) =>
    new Promise((resolve: DBCallback, reject) => {
      try {
        sanitize({ hash_b64, increment_verification_retry_count });
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
  (pool) =>
  ({ max_age_hours, max_verification_retry_count }) =>
    new Promise((resolve: DBCallback, reject) => {
      try {
        sanitize({ max_age_hours, max_verification_retry_count });
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
