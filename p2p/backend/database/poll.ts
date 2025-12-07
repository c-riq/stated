
const log = false;

import { Pool } from "pg";
import { DBCallback, checkIfMigrationsAreDone, PollDB, VoteDB, StatementDB, StatementWithSupersedingDB } from ".";

export const createPollFactory = (pool: Pool) => (poll:Omit<PollDB, "id">) => 
(new Promise((resolve: DBCallback<any>, reject) => {
  try {
    checkIfMigrationsAreDone()
    const { statement_hash, participants_entity_type, participants_country, participants_city, deadline } = poll
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


export const getPollFactory = (pool: Pool) => ({ statement_hash }: { statement_hash: string }) => (new Promise((resolve: DBCallback<PollDB & StatementDB>, reject) => {
    console.log('getPoll', statement_hash)
    try {
      checkIfMigrationsAreDone()
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
  

export const createVoteFactory = (pool: Pool) => ({ statement_hash, poll_hash, option, domain, qualified }: Omit<VoteDB, "id">) => (new Promise((resolve: DBCallback<any>, reject) => {
  try {
    checkIfMigrationsAreDone()
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


export const getVotesFactory = (pool: Pool) => ({ poll_hash, vote_hash=null, domain=null, author=null, ignore_vote_hash=null }: 
  { poll_hash: string, vote_hash?: string | null, domain?: string | null, author?: string | null, ignore_vote_hash?: string | null } ) => (new Promise((
      resolve: DBCallback<VoteDB & StatementWithSupersedingDB>, reject) => {
    try {
      checkIfMigrationsAreDone()
      pool.query(`
        SELECT 
          *
        FROM votes v 
          JOIN statement_with_superseding s 
            ON poll_hash = $1
            AND v.statement_hash = s.hash_b64
            AND (v.statement_hash = $2 OR $2 IS NULL)
            AND (s.domain = $3 OR $3 IS NULL)
            AND (s.author = $4 OR $4 IS NULL)
            AND (v.statement_hash != $5 OR $5 IS NULL)
        `,[poll_hash, vote_hash, domain, author, ignore_vote_hash], (error, results) => {
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

export const updateVoteFactory = (pool: Pool) => ({ statement_hash, poll_hash, option, domain, qualified }: Omit<VoteDB, "id">) => (new Promise((resolve: DBCallback<VoteDB & StatementDB>, reject) => {
    try {
      checkIfMigrationsAreDone()
      pool.query(`
            UPDATE votes SET
              poll_hash=$2,
              statement_hash=$1,
              option=$3,
              domain=$4,
              qualified=$5
            WHERE statement_hash=$1
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
