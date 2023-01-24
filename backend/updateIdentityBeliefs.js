
import db from './db.js'

const log = false

const updateBasedOnVerifications = async () => {
    let dbResult = {} 
    try {
        dbResult = await db.getAllVerifications()
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
        dbResult = await db.getStatements({onlyStatementsWithMissingEntities : true})
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
        console.log('retry verification started')
        try {
            await tryVerifyUnverifiedStatements()
            await db.cleanUpUnverifiedStatements({max_age_hours: Math.max(...verificationRetryScheduleHours) | 1,
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
