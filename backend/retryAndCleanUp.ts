// @ts-nocheck

/* 
If an author node is temporarily unavailable,
statements are added to the unverified_statements table
and will be retried according to the schedule below 
and deleted afterwards.
*/

import { getUnverifiedStatements, getStatements, cleanUpUnverifiedStatements, } from './db'
import { validateAndAddStatementIfMissing, createDerivedEntity } from './statementVerification'

const log = true

const verificationRetryScheduleHours = [0, 0.1, 0.2, 1, 10, 24, 336]

const tryVerifyUnverifiedStatements = async () => {
    let dbResult = {} 
    try {
        dbResult = await getUnverifiedStatements()
    } catch (error) {
        console.log(error)
        console.trace()
    }
    let unverifiedStatements = dbResult.rows
    log && console.log('unverifiedStatements count ', unverifiedStatements.length)
    unverifiedStatements = unverifiedStatements.filter(s => {
        const diffTime = (new Date()) - s.received_time
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
        const targetRetryCount = verificationRetryScheduleHours.filter(h => h < diffHours).length
        if (targetRetryCount > s.verification_retry_count) {
            return true
        } return false
    })
    log && console.log('unverifiedStatements up for retry ', unverifiedStatements.length)
    try {
        const res = await Promise.all(unverifiedStatements.map(({statement, hash_b64, source_node_id, verification_method}) =>
            validateAndAddStatementIfMissing({statement, hash_b64, source_node_id, source_verification_method: verification_method, api_key: undefined })
        ))
        return res
    } catch (error) {
        console.log(error)
        console.trace()
    }
}

const tryAddMissingDerivedEntitiesFromStatements = async () => {
    /* Use cases: Poll might arrive after votes; version upgrades may be necessary. */
    let dbResult = {} 
    try {
        dbResult = await getStatements({onlyStatementsWithMissingEntities : true})
    } catch (error) {
        console.log(error)
        console.trace()
    }
    let statements = dbResult.rows
    log && console.log('statements without entity ', statements.length)
    statements = statements.filter(s => {
        const diffTime = (new Date()) - s.first_verification_time
        console.log(diffTime, new Date(), s.first_verification_time)
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
        console.log(diffHours)
        const targetRetryCount = verificationRetryScheduleHours.filter(h => h < diffHours).length
        if (targetRetryCount > s.derived_entity_creation_retry_count) {
            return true
        } return false
    })
    log && console.log('statements without entity up for retry ', statements.length)
    try {
        const res = await Promise.all(statements.map(({type, domain, content, hash_b64}) => 
            createDerivedEntity({statement_hash: hash_b64, domain, content, type})
        ))
        return res
    } catch (error) {
        console.log(error)
        console.trace()
    }
}

const setupSchedule = () => {
    setInterval(async () => {
        log && console.log('retry verification started')
        try {
            await tryVerifyUnverifiedStatements()
            await cleanUpUnverifiedStatements({max_age_hours: Math.max(...verificationRetryScheduleHours) | 1,
                 max_verification_retry_count: verificationRetryScheduleHours.length | 1})
            await tryAddMissingDerivedEntitiesFromStatements()
        } catch (error) {
            console.log(error)
            console.trace()
        }
    }, 5 * 1000)   
}

export default {
    setupSchedule
}
