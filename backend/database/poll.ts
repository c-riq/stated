
const log = false;

import { DBCallback, DBErrorCallback, sanitize } from ".";

export const createPollFactory = pool => (o) => 
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


export const getPollFactory = pool => ({ statement_hash }) => (new Promise((resolve: DBCallback, reject) => {
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
  

export const createVoteFactory = pool => ({ statement_hash, poll_hash, option, domain, qualified }) => (new Promise((resolve: DBCallback, reject) => {
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


export const getVotesFactory = pool => ({ hash_b64 }) => (new Promise((resolve: DBCallback, reject) => {
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
