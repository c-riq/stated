
import { Pool } from "pg"
import { DBCallback, checkIfMigrationsAreDone } from "."


export const getResponsesFactory = (pool: Pool) => ({ referenced_hash }: {referenced_hash:string}) => (new Promise((
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


export const getDisputesFactory = (pool: Pool) => ({ referenced_hash }: {referenced_hash:string}) => (new Promise((
  resolve: DBCallback<StatementWithSupersedingDB>, reject) => {
try {
  checkIfMigrationsAreDone()
  pool.query(`
    SELECT 
      *
    FROM statement_with_superseding s 
    WHERE 
      referenced_statement = $1
    AND
    (
      type = 'dispute_statement_content'
      OR type = 'dispute_statement_authenticity'
    )
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
