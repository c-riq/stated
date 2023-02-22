import db from './db.js'
import {parseRating} from './statementFormats.js'

const log = true

export const createRating = ({statement_hash, domain, content }) => (new Promise(async (resolve, reject)=>{
    log && console.log('createRating', statement_hash, domain, content)
    try {
        const parsedRating = parseRating(content)
        const { rating, organisation, domain, comment } = parsedRating
        const ratingInt = parseInt(rating)
        if ((!(ratingInt > 0 && ratingInt < 6)) || (organisation.length < 1 || domain.length < 1) ) {
            resolve({error: "Missing required fields"})
            return
        }
        const dbResult = await db.createRating({ statement_hash, organisation, domain, rating: parseInt(rating), comment})   
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