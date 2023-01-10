

import db from './db.js'
import {parseVote, parsePoll} from './statementFormats.js'


export const createPoll = ({statement_hash, domain, content }) => (new Promise((resolve, reject)=>{
    console.log('createPoll', statement_hash, domain, content)
    try {
        const parsedPoll = parsePoll(content)
        const { pollType, country, city, legalEntity, domainScope,
		judges, deadline, poll, option1, option2, option3, option4, option5 } = parsedPoll
        if (deadline.length < 1 ) {
            resolve({error: "Missing required fields"})
            return
        }
        db.createPoll({ statement_hash, participants_entity_type: legalEntity, 
            participants_country: country, participants_city: city, deadline })
        .then( result => {
                resolve([result, statement_hash])
        }).catch(e => resolve({error: e}))
    } catch (error) {
        resolve({error})
    }
}))


export const createVote = ({statement_hash, domain, content }) => (new Promise((resolve, reject)=>{
    try {
        const parsedVote = parseVote(content)
        const { pollHash, option } = parsedVote
        if (domain.length < 1 || statement_hash.length < 1 ||
            option.length < 1 || pollHash.length < 1 ) {
            resolve({error: "Missing required fields"})
            return
        }
        let dbResult = db.getVerifications({domain})
        const verification = dbResult.rows[0]
        dbResult = db.getPoll({statement_hash})
        const poll = dbResult.rows[0]
        
        console.log(poll.deadline, poll.participants_entity_type, poll.participants_country, poll.participants_city)
        console.log(verification.legal_entity_type, verification.country, verification.city)
        console.log(verification.proclaimed_publication_time)

        // TODO: evaluate whether vote is qualified for poll according to participant scope, domain verification and deadline
        
        db.createVote({statement_hash, poll_hash: pollHash, option, domain, name: "", qualified: true })
        .then( result => {
                resolve([result, statement_hash])
        }).catch(e => resolve({error: e}))
    } catch (error) {
        resolve({error})
    }
}))