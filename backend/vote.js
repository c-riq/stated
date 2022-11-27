

import db from './db.js'
import {parseVote} from './statementFormats.js'

export const createVote = ({statement_hash, domain, content }) => (new Promise((resolve, reject)=>{
    try {
        const parsedVote = parseVote(content)
        const { pollHash, option } = parsedVote
        if (domain.length < 1 || statement_hash.length < 1 ||
            option.length < 1 || pollHash.length < 1 ) {
            resolve({error: "Missing required fields"})
            return
        }
        // TODO: evaluate whether vote is qualified for poll according to participant scope, domain verification and deadline
        db.createVote({statement_hash, poll_hash: pollHash, option, domain, name: "", qualified: true })
        .then( result => {
                resolve([result, statement_hash])
        }).catch(e => resolve({error: e}))
    } catch (error) {
        resolve({error})
    }
}))
