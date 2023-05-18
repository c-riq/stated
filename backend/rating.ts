import {createRating} from './db'
import {parseRating} from './statementFormats'

const log = true

export const parseAndCreateRating = ({statement_hash, domain, content }) => (new Promise(async (resolve, reject)=>{
    log && console.log('createRating', statement_hash, domain, content)
    try {
        const parsedRating = parseRating(content)
        const { rating, organisation, domain, comment } = parsedRating
        const ratingInt = parseInt(rating)
        if ((!(ratingInt > 0 && ratingInt < 6)) || (organisation.length < 1 || domain.length < 1) ) {
            resolve({error: "Missing required fields"})
            return
        }
        const dbResult = await createRating({ statement_hash, organisation, domain, rating: parseInt(rating), comment})   
        if(dbResult.rows[0]){
            resolve(dbResult)
        } else {
            throw new Error('Could not create rating')
        }
    } catch (error) {
        console.log(error)
        console.trace()
        resolve({error})
    }
}))