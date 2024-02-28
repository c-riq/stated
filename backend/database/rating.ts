
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
  