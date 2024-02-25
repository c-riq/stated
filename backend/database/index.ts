import { Pool, QueryResult, QueryResultRow } from 'pg'
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

export type DBCallback<T extends QueryResultRow> = (result?: QueryResult<T>) => void

export type DBErrorCallback = (error: Error) => void

const log = false

let migrationsDone = false;
let migrationInProgress = false;
const migrationIntervalId = setInterval(async () => {
    if(!migrationsDone && !migrationInProgress){
      migrationInProgress = true
      await performMigrations(pool, ()=>migrationsDone=true)
      migrationInProgress = false
    } 
    if(migrationsDone && !migrationInProgress) {
      clearInterval(migrationIntervalId)
    }
  }, 500)

export const checkIfMigrationsAreDone = () => {
    if (!migrationsDone){
      throw { error: 'Migrations not done yet'}
    }
}

import { createStatementFactory, getStatementsFactory, getStatementsWithDetailFactory, 
  getUnverifiedStatementsFactory, updateStatementFactory, cleanUpUnverifiedStatementsFactory, 
  createUnverifiedStatementFactory, getJoiningStatementsFactory, getOwnStatementFactory,
  getStatementFactory, statementExistsFactory, updateUnverifiedStatementFactory,
  deleteStatementFactory, createHiddenStatementFactory, getHiddenStatementFactory,
  checkIfUnverifiedStatementExistsFactory, getObservationsForEntityFactory} from './statements'

export const createStatement = createStatementFactory(pool)
export const createHiddenStatement = createHiddenStatementFactory(pool)
export const getStatement = getStatementFactory(pool)
export const getHiddenStatement = getHiddenStatementFactory(pool)
export const deleteStatement = deleteStatementFactory(pool)
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
export const checkIfUnverifiedStatmentExists = checkIfUnverifiedStatementExistsFactory(pool)
export const getObservationsForEntity = getObservationsForEntityFactory(pool)

import { setCertCacheFactory, getCertCacheFactory, matchDomainFactory } from './ssl'

export const setCertCache = setCertCacheFactory(pool)
export const getCertCache = getCertCacheFactory(pool)
export const matchDomain = matchDomainFactory(pool)

import { checkIfVerificationExistsFactory, createOrganisationVerificationFactory, createPersonVerificationFactory, 
  getAllVerificationsFactory, matchNameFactory, getOrganisationVerificationsFactory,
  getPersonVerificationsFactory } from './verification'

export const checkIfVerificationExists = checkIfVerificationExistsFactory(pool)
export const createOrganisationVerification = createOrganisationVerificationFactory(pool)
export const createPersonVerification = createPersonVerificationFactory(pool)
export const getAllVerifications = getAllVerificationsFactory(pool)
export const getPersonVerifications = getPersonVerificationsFactory(pool)
export const getOrganisationVerifications = getOrganisationVerificationsFactory(pool)
export const matchName = matchNameFactory(pool)

import { createRatingFactory } from './rating'

export const createRating = createRatingFactory(pool)

import { createPollFactory, getPollFactory, createVoteFactory, getVotesFactory, updateVoteFactory } from './poll'

export const createPoll = createPollFactory(pool)
export const getPoll = getPollFactory(pool)
export const createVote = createVoteFactory(pool)
export const getVotes = getVotesFactory(pool)
export const updateVote = updateVoteFactory(pool)

import  { getDisputesFactory, getResponsesFactory } from './response'

export const getResponses = getResponsesFactory(pool)
export const getDisputes = getDisputesFactory(pool)

import { addNodeFactory, updateNodeFactory, getAllNodesFactory } from './p2p'

export const addNode = addNodeFactory(pool)
export const updateNode = updateNodeFactory(pool)
export const getAllNodes = getAllNodesFactory(pool)

import { getStatementsToVerifyFactory, addLogFactory, getLogsForStatementFactory } from './verificationLog'

export const getStatementsToVerify = getStatementsToVerifyFactory(pool)
export const addLog = addLogFactory(pool)
export const getLogsForStatement = getLogsForStatementFactory(pool)

import { deleteSupersededDerivedEntitiesFactory } from './cleanup'

export const deleteSupersededDerivedEntities = deleteSupersededDerivedEntitiesFactory(pool)
