
import { DBCallback, checkIfMigrationsAreDone } from "."


export const getResponsesFactory = pool => ({ referenced_hash }) => (new Promise((
      resolve: DBCallback<StatementWithSupersedingDB>, reject) => {
    try {
      checkIfMigrationsAreDone()
      pool.query(`
        SELECT 
          *
        FROM statement_with_superseding s 
        WHERE referenced_statement = $1
        AND type = 'response'
        `,[referenced_hash], (error, results) => {
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
