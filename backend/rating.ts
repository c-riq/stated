import {createRating} from './database'
import {parseRating} from './statementFormats'

const log = true

export const parseAndCreateRating = ({statement_hash, domain, content }: { statement_hash: string, domain: string, content: string }) => (new Promise(async (resolve, reject)=>{
    log && console.log('createRating', statement_hash, domain, content)
    try {
        const parsedRating = parseRating(content)
        const { rating, organisation, domain, comment } = parsedRating
        const ratingInt = parseInt(rating)
        if ((!(ratingInt > 0 && ratingInt < 6)) || (organisation.length < 1 || domain.length < 1) ) {
            return reject(Error("Missing required fields"))
        }
        const dbResult = await createRating({ statement_hash, organisation, domain, rating: parseInt(rating), comment: comment || ''})   
        if(dbResult?.rows[0]){
            return resolve(true)
        } else {
            return reject(Error('Could not create rating'))
        }
    } catch (error) {
        console.log(error)
        console.trace()
        reject(error)
    }
}))
