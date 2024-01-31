import { QueryResult } from 'pg'
import {createPoll, getOrganisationVerifications, getPoll, 
    createVote, getVotes, updateVote, getObservationsForEntity} from './database'
import {parseVote, parsePoll, parseStatement, vote, parseObservation} from './statementFormats'

export const parseAndCreatePoll = ({statement_hash, domain, content }) => (new Promise(async (resolve, reject)=>{
    console.log('createPoll', statement_hash, domain, content)
    try {
        const parsedPoll = parsePoll(content)
        const { country, city, legalEntity, deadline } = parsedPoll
        if(isNaN(deadline.getTime())) {
            resolve({error: "Invalid deadline date"})
            return
        }
        const dbResult = await createPoll({ statement_hash, participants_entity_type: legalEntity, 
            participants_country: country, participants_city: city, deadline })   
        if(dbResult.rows[0]){
            resolve(dbResult)
        }
    } catch (error) {
        console.log(error)
        console.trace()
        reject(error)
        return
    }
}))

export const checkRequiredObservations = ({requiredProperty, requiredPropertyValue, observations}:{requiredProperty:string, 
    requiredPropertyValue?:string, observations:StatementDB[]}) => {
    if(!requiredProperty) {
        return true
    }
    let result = false
    observations.forEach((o) => {
        const parsedStatement = parseStatement({statement: o.statement})
        const parsedObservation = parseObservation(parsedStatement.content)
        if(parsedObservation.property === requiredProperty) {
            if (requiredPropertyValue) {
                if(parsedObservation.value === requiredPropertyValue) {
                    result = true
                }
            } else {
                result = true
            }
        }
    })
    return result
}

export const isVoteQualified = async ({vote, poll, verification, proclaimed_publication_time, statement_hash, domain, author}:{
        vote: vote, poll: (PollDB & StatementDB), verification: (OrganisationVerificationDB & StatementDB), proclaimed_publication_time: Date,
        statement_hash: string, domain:string, author:string
    }) => {
    let voteTimeQualified = false
    let votingEntityQualified = false
    let observationsQualified = false
    let noExistingVotesFromAuthor = false
    if (verification && poll) {
        // TODO: if ownDomain == poll judge, then compare against current time
        if(proclaimed_publication_time <= poll.deadline) {
            voteTimeQualified = true
        }
        if( 
            ( (!poll.participants_entity_type) || (poll.participants_entity_type === verification.legal_entity_type) )
            &&
            ( (!poll.participants_country) || (poll.participants_country === verification.country) )
            &&
            ( (!poll.participants_city) || (poll.participants_city === verification.city) )
        ) {
            votingEntityQualified = true
        }
        const parsedPollStatement = parseStatement({statement: poll.statement})
        const parsedPoll = parsePoll(parsedPollStatement.content)
        const { requiredProperty, requiredPropertyValue, requiredPropertyObserver, allowArbitraryVote, options } = parsedPoll
        if(!allowArbitraryVote && !options.includes(vote.vote)) {
            return false
        }
        if(requiredProperty && requiredPropertyObserver) {
            const [observerName, observerDomain] = requiredProperty.split('@')
            const observations = (await getObservationsForEntity({name: parsedPollStatement.author, 
                domain: parsedPollStatement.domain, observerName, observerDomain})).rows
            observationsQualified = checkRequiredObservations({requiredProperty, requiredPropertyValue, observations})
        } else {
            observationsQualified = true
        }
        const dbResultExistingVotes = await getVotes({ poll_hash: poll.hash_b64, ignore_vote_hash: statement_hash, domain, author })
        noExistingVotesFromAuthor = ! (dbResultExistingVotes.rows.length > 0)
    }
    const qualified = voteTimeQualified && votingEntityQualified && observationsQualified && noExistingVotesFromAuthor
    return qualified
}


export const parseAndCreateVote = ({statement_hash, domain, author, content, proclaimed_publication_time }:{
            statement_hash: string, domain: string, author: string, content: string, proclaimed_publication_time: Date}
        ) => (new Promise<QueryResult<StatementDB & VoteDB>>(async (resolve, reject) => {
    console.log('createVote', content)
    try {
        const parsedVote = parseVote(content)
        const { pollHash, vote } = parsedVote
        if (domain.length < 1 || statement_hash.length < 1 ||
            vote.length < 1 || pollHash.length < 1 ) {
            console.log("Missing required fields")
            return reject({error: "Missing required fields"})
        }
        const dbResultVerification = await getOrganisationVerifications({domain})
        const verifications = dbResultVerification.rows
        let verification = undefined as (StatementDB & OrganisationVerificationDB) | undefined
        verifications.forEach((v) => {
            if(v.name === author) {
                verification = v
            }
        })
        const dbResultPoll = await getPoll({statement_hash: pollHash})
        const poll = dbResultPoll.rows[0]

        const qualified = !!(verification && poll && 
            await isVoteQualified({vote: parsedVote, poll, verification, proclaimed_publication_time, statement_hash, domain, author}))
        let dbResultVoteCreation = undefined
        try {
            dbResultVoteCreation = await createVote({statement_hash, poll_hash: pollHash, option: vote, domain, qualified })
        } catch (error) {
            console.log(error)
            console.trace()
        }
        if(dbResultVoteCreation?.rows?.[0]){
            return resolve(dbResultVoteCreation)
        } else {
            const voteExists = await getVotes({ poll_hash: pollHash, vote_hash: statement_hash })
            if(voteExists.rows[0]) {
                try {
                    const updateResult = await updateVote({statement_hash, poll_hash: pollHash, option: vote, domain, qualified })
                    return resolve(updateResult)
                }
                catch (error) {
                    console.log(error)
                    console.trace()
                    return reject(error)
                }
            }
        }
        reject({error: 'vote not created ' + statement_hash})
    } catch (error) {
        console.log(error)
        console.trace()
        reject({error})
    }
}))
