import { Pool, QueryResult } from 'pg'
import {forbiddenStrings} from '../statementFormats'
import {performMigrations} from './migrations'

const pgHost = process.env.POSTGRES_HOST || "localhost"
const pgDatabase = process.env.POSTGRES_DB || "stated"
const pgUser = process.env.POSTGRES_USER || "sdf"
const pgPassword = process.env.POSTGRES_PW || "sdf"
const pgPort = parseInt(process.env.POSTGRES_PORT || '5432')
const test = process.env.TEST || false

const pool = new Pool({
  user: pgUser,
  host: pgHost,
  database: pgDatabase,
  password: pgPassword,
  port: pgPort,
})

pool.on('error', (error) => {
  console.log('pg pool error: ', error)
  console.trace()
})

export type DBCallback = (result?: QueryResult) => void
export type DBErrorCallback = (error: Error) => void

const log = false

let migrationsDone = false;
([500, 2500, 5000]).map(ms => setTimeout(
  async () => {
    if(!migrationsDone){
      await performMigrations(pool, ()=>migrationsDone=true)
    }
  }, ms
))

export const sanitize = (o) => {
  // sql&xss satitize all input to exported functions, checking all string values of a single input object
    if (!migrationsDone){
      throw { error: 'Migrations not done yet'}
    }
    if (typeof o != 'undefined') {
      if(forbiddenStrings(Object.values(o)).length > 0) {
        throw { error: ('Values contain forbidden Characters: ' + forbiddenStrings(Object.values(o)))}
      }
    }
}

import { createStatementFactory, getStatementsFactory, getStatementsWithDetailFactory, 
  getUnverifiedStatementsFactory, updateStatementFactory, cleanUpUnverifiedStatementsFactory, 
  createUnverifiedStatementFactory, getJoiningStatementsFactory, getOwnStatementFactory,
getStatementFactory, statementExistsFactory, updateUnverifiedStatementFactory } from './statements'

export const createStatement = createStatementFactory(pool)
export const getStatement = getStatementFactory(pool)
export const getStatements = getStatementsFactory(pool)
export const getStatementsWithDetail = getStatementsWithDetailFactory(pool)
export const getUnverifiedStatements = getUnverifiedStatementsFactory(pool)
export const updateStatement = updateStatementFactory(pool)
export const createUnverifiedStatement = createUnverifiedStatementFactory(pool)
export const cleanUpUnverifiedStatements = cleanUpUnverifiedStatementsFactory(pool)
export const getJoiningStatements = getJoiningStatementsFactory(pool)
export const getOwnStatement = getOwnStatementFactory(pool)
export const statementExists = statementExistsFactory(pool)
export const updateUnverifiedStatement = updateUnverifiedStatementFactory(pool)

import { setCertCacheFactory, getCertCacheFactory, matchDomainFactory } from './ssl'

export const setCertCache = setCertCacheFactory(pool)
export const getCertCache = getCertCacheFactory(pool)
export const matchDomain = matchDomainFactory(pool)

import { checkIfVerificationExistsFactory, createOrganisationVerificationFactory, createPersonVerificationFactory, 
  getAllVerificationsFactory, getPersonVerificationsForStatementFactory, 
  getVerificationsForDomainFactory, getOrganisationVerificationsForStatementFactory } from './verification'

export const checkIfVerificationExists = checkIfVerificationExistsFactory(pool)
export const createOrganisationVerification = createOrganisationVerificationFactory(pool)
export const createPersonVerification = createPersonVerificationFactory(pool)
export const getAllVerifications = getAllVerificationsFactory(pool)
export const getPersonVerificationsForStatement = getPersonVerificationsForStatementFactory(pool)
export const getVerificationsForDomain = getVerificationsForDomainFactory(pool)
export const getOrganisationVerificationsForStatement = getOrganisationVerificationsForStatementFactory(pool)

import { createRatingFactory } from './rating'

export const createRating = createRatingFactory(pool)

import { createPollFactory, getPollFactory, createVoteFactory, getVotesFactory } from './poll'

export const createPoll = createPollFactory(pool)
export const getPoll = getPollFactory(pool)
export const createVote = createVoteFactory(pool)
export const getVotes = getVotesFactory(pool)

import { addNodeFactory, updateNodeFactory, getAllNodesFactory } from './p2p'

export const addNode = addNodeFactory(pool)
export const updateNode = updateNodeFactory(pool)
export const getAllNodes = getAllNodesFactory(pool)

