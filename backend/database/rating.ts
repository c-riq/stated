
const log = false;

import { Pool } from "pg";
import { DBCallback, checkIfMigrationsAreDone } from ".";


export const createRatingFactory = (pool: Pool) => ({ statement_hash, subject_name, subject_reference, rating, comment }: Omit<RatingDB, "id">) => (new Promise((resolve: DBCallback<any>, reject) => {
    try {
      checkIfMigrationsAreDone()
      log && console.log('create rating', [statement_hash, subject_name, subject_reference, rating, comment])
      pool.query(`
              INSERT INTO ratings 
                (statement_hash, subject_name, subject_reference, rating, comment) 
              VALUES 
                ($1, $2, $3, $4, $5)
              RETURNING *`,
        [statement_hash, subject_name || '', subject_reference || '', rating, comment || ''], (error, results) => {
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
  
export const getAggregatedRatingsFactory = (pool: Pool) => ({ subject, subjectReference, skip, limit }: { 
  subject?: string, subjectReference?: string, skip?: number, limit?: number
}) => (
  new Promise((resolve: DBCallback<AggregatedRatingDB>, reject) => {
    try {
      checkIfMigrationsAreDone()
      log && console.log('get aggregated ratings', [subject, subjectReference])
      pool.query(`
      WITH grouped_ratings AS (
        SELECT
          subject_name,
          subject_reference,
          SUM(_1) as _1,
          SUM(_2) as _2,
          SUM(_3) as _3,
          SUM(_4) as _4,
          SUM(_5) as _5,
          AVG(rating) average_rating,
          SUM(1) rating_count
          FROM
          (
          SELECT
          CASE
            WHEN LENGTH($1) > 0 THEN subject_name
            WHEN (LENGTH($1) = 0 AND LENGTH($2) = 0) THEN subject_name
            ELSE $2
          END as subject_name,
          CASE
            WHEN LENGTH($2) > 0 THEN subject_reference
            WHEN (LENGTH($1) = 0 AND LENGTH($2) = 0) THEN subject_reference
            ELSE $2 END
          as subject_reference,
          rating,
          CASE WHEN rating = 1 THEN 1 END AS _1,
          CASE WHEN rating = 2 THEN 1 END AS _2,
          CASE WHEN rating = 3 THEN 1 END AS _3,
          CASE WHEN rating = 4 THEN 1 END AS _4,
          CASE WHEN rating = 5 THEN 1 END AS _5
        FROM 
          ratings
        WHERE 
          (
            subject_name = $1
            OR LENGTH($1) = 0)
          AND
          (
            subject_reference = $2
            OR LENGTH($2) = 0
          )
          )AS ungrouped
          GROUP BY
            subject_name,
            subject_reference
      )
      SELECT 
        *
      FROM (
        SELECT 
          *,
          rank() OVER(ORDER BY rating_count DESC, average_rating DESC) as skip_id,
          count(1) OVER() as max_skip_id
        FROM grouped_ratings
        ORDER BY
          rating_count DESC,
          average_rating DESC
        ) ranked
      WHERE
        skip_id > $3
      LIMIT $4`,
        [subject || '', subjectReference || '', skip || 0, limit || 100], (error, results) => {
          if (error) {
            console.log(error)
            console.trace()
            return reject(error)
          } else {
            return resolve(results)
          }
        }
      )
    } catch (error) {
      console.log(error)
      console.trace()
      return reject(error)
    }
  }))
