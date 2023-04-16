

import {createPoll, getVerificationsForDomain, getPoll, createVote} from './db.js'
import {parseVote, parsePoll} from './statementFormats.js'

const log = true

export const parseAndCreatePoll = ({statement_hash, domain, content }) => (new Promise(async (resolve, reject)=>{
    log && console.log('createPoll', statement_hash, domain, content)
    try {
        const parsedPoll = parsePoll(content)
        const { pollType, country, city, legalEntity, domainScope,
		judges, deadline, poll, option1, option2, option3, option4, option5 } = parsedPoll
        if (deadline.length < 1 ) {
            resolve({error: "Missing required fields"})
            return
        }
        const dbResult = await createPoll({ statement_hash, participants_entity_type: legalEntity, 
            participants_country: country, participants_city: city, deadline })   
        if(dbResult.error){
            console.log(dbResult.error)
            console.trace()
            resolve(dbResult)
            return
        } 
        if(dbResult.rows[0]){
            dbResult.entityCreated = true
        }
        resolve(dbResult)
    } catch (error) {
        console.log(error)
        console.trace()
        resolve({error})
    }
}))


export const parseAndCreateVote = ({statement_hash, domain, content, proclaimed_publication_time }) => (new Promise(async (resolve, reject)=>{
    log && console.log('createVote', content)
    try {
        const parsedVote = parseVote(content)
        const { pollHash, option } = parsedVote
        if (domain.length < 1 || statement_hash.length < 1 ||
            option.length < 1 || pollHash.length < 1 ) {
            log && console.log("Missing required fields")
            resolve({error: "Missing required fields"})
            return
        }
        let dbResult = await getVerificationsForDomain({domain})
        if(dbResult.error){
            console.log(dbResult)
            resolve(dbResult)
            return
        }
        if(dbResult.rows.length == 0){
            log && console.log("No verification for voting entity")
            resolve({error: "No verification for voting entity"})
            return
        }
        const verification = dbResult.rows[0]
        
        dbResult = await getPoll({statement_hash: pollHash})
        if(dbResult.rows.length == 0){
            log && console.log("Poll does not exist")
            resolve({error: "Poll does not exist"})
            return
        }
        const poll = dbResult.rows[0]
        
        log && console.log("poll.deadline", poll.deadline, poll.participants_entity_type, poll.participants_country, poll.participants_city)
        log && console.log("verification.legal_entity_type", verification.legal_entity_type, verification.country, verification.city)
        log && console.log("proclaimed_publication_time", proclaimed_publication_time)

        let voteTimeQualified = false
        if(proclaimed_publication_time <= poll.deadline) {
            voteTimeQualified = true
        }
        // TODO: if ownDomain == poll judge, then compare against current time
        let votingEntityQualified = false
        if( 
            ( (!poll.participants_entity_type) || (poll.participants_entity_type === verification.legal_entity_type) )
            &&
            ( (!poll.participants_country) || (poll.participants_country === verification.country) )
            &&
            ( (!poll.participants_city) || (poll.participants_city === verification.city) )
         ) {
            votingEntityQualified = true
        }
        if(voteTimeQualified && votingEntityQualified){
            dbResult = await createVote({statement_hash, poll_hash: pollHash, option, domain, qualified: true })
            if(dbResult.error){
                console.log(dbResult.error)
                console.trace()
                resolve(dbResult)
                return
            } 
            if(dbResult.rows[0]){
                dbResult.entityCreated = true
            }
            resolve(dbResult)
        } else {
            resolve({error: 'vote not qualified ' + statement_hash})
        }
    } catch (error) {
        console.log(error)
        console.trace()
        resolve({error})
    }
}))
