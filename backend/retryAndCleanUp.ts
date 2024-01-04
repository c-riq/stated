/* 
If an author node is temporarily unavailable,
statements are added to the unverified_statements table
and will be retried according to the schedule below 
and deleted afterwards.
*/

import { getUnverifiedStatements, getStatements, cleanUpUnverifiedStatements, deleteSupersededDerivedEntities, } from './database'
import { validateAndAddStatementIfMissing, createDerivedEntity } from './statementVerification'

const log = true

const verificationRetryScheduleHours = [0, 0.01, 0.05, 0.1, 0.2, 1, 10, 24, 100, 336, 744]

const tryVerifyUnverifiedStatements = async () => {
    try {
        const dbResult = await getUnverifiedStatements()
        let unverifiedStatements = dbResult.rows
        log && console.log('unverifiedStatements count ', unverifiedStatements.length)
        unverifiedStatements = unverifiedStatements.filter(s => {
            // @ts-ignore
            const diffTime = (new Date()) - s.received_time
            const diffHours = diffTime / (1000 * 60 * 60)
            const targetRetryCount = verificationRetryScheduleHours.filter(h => h < diffHours).length
            if (targetRetryCount > s.verification_retry_count) {
                return true
            } return false
        })
        log && console.log('unverifiedStatements up for retry ', unverifiedStatements.length)

        const res = await Promise.allSettled(unverifiedStatements.map(({statement, hash_b64, source_node_id, verification_method}) =>
            validateAndAddStatementIfMissing({statement, hash_b64, source_node_id,
                verification_method, api_key: undefined })
        ))
        return res
    } catch (error) {
        console.log(error)
        console.trace()
    }
}

const addMissingDerivedEntities = async () => {
    /* Use cases: Poll might arrive after votes; version upgrades may be necessary. */
    try {
        const dbResult = await getStatements({onlyStatementsWithMissingEntities : true})
        let statements = dbResult.rows
        log && console.log('statements without entity ', statements.length)
        statements = statements.filter(s => {
            // @ts-ignore
            const diffTime = (new Date()) - s.first_verification_time
            const diffHours = diffTime / (1000 * 60 * 60)
            const targetRetryCount = verificationRetryScheduleHours.filter(h => h < diffHours).length
            if (targetRetryCount > s.derived_entity_creation_retry_count) {
                return true
            } return false
        })
        log && console.log('statements without entity up for retry ', statements.length)
        const res = await Promise.allSettled(statements.map(({type, domain, author, content, hash_b64, proclaimed_publication_time}) => 
            createDerivedEntity({statement_hash: hash_b64, domain, author, content, type, proclaimed_publication_time})
        ))
        return res
    } catch (error) {
        console.log(error)
        console.trace()
    }
}

const deleteDerivedEntitiesWhoseStatementsAreSuperseded = async () => {
    try {
        await deleteSupersededDerivedEntities()
    } catch (error) {
        console.log(error)
        console.trace()
    }
}

const setupSchedule = (retryIntervalSeconds) => {
    setInterval(async () => {
        log && console.log('retry verification started')
        try {
            await tryVerifyUnverifiedStatements()
            await cleanUpUnverifiedStatements({max_age_hours: Math.max(...verificationRetryScheduleHours) | 1,
                 max_verification_retry_count: verificationRetryScheduleHours.length | 1})
            await addMissingDerivedEntities()
            await deleteDerivedEntitiesWhoseStatementsAreSuperseded()
        } catch (error) {
            console.log(error)
            console.trace()
        }
    }, retryIntervalSeconds * 1000)   
}

export default {
    setupSchedule
}
