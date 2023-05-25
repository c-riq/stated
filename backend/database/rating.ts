
const log = false;

import { DBCallback, DBErrorCallback, sanitize } from ".";


export const createRatingFactory = pool => ({ statement_hash, organisation, domain, rating, comment }) => (new Promise((resolve: DBCallback, reject) => {
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
  