
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
          *,
          SUM(1) as rating_count FROM
          ( SELECT
          CASE
            WHEN LENGTH($1) > 0 THEN subject_name
            WHEN LENGTH($1) = 0 AND LENGTH($2) = 0 THEN subject_name
          ELSE '' END as subject_name,
          CASE WHEN
              LENGTH($2) > 0 THEN subject_reference
              WHEN LENGTH($1) = 0 AND LENGTH($2) = 0 THEN subject_reference
          ELSE '' END as subject_reference,
          rating
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
            subject_reference,
            rating
      )
      SELECT 
        *
      FROM (
        SELECT 
          *,
          star_sum / total_count as average_rating,
          rank() OVER(ORDER BY total_count DESC, star_sum DESC) as skip_id,
          count(1) OVER() as max_skip_id
        FROM (
            SELECT
                subject_name,
                subject_reference,
                rating,
                rating_count,
                SUM(rating_count) OVER(PARTITION BY subject_name, subject_reference) as total_count,
                SUM(rating * rating_count) OVER(PARTITION BY subject_name, subject_reference) as star_sum
              FROM
                 grouped_ratings
              ) with_total_count
        ORDER BY
          total_count DESC,
          star_sum DESC
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
