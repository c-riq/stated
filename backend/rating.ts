import {createRating} from './database'
import {parseRating} from './statementFormats'

const log = true

export const parseAndCreateRating = ({statement_hash, domain, content }: { statement_hash: string, domain: string, content: string }) => (new Promise(async (resolve, reject)=>{
    log && console.log('createRating', statement_hash, domain, content)
    try {
        const parsedRating = parseRating(content)
        const { rating, subjectName, subjectReference, comment } = parsedRating
        if ((!(rating > 0 && rating < 6)) || (subjectName.length < 1 || subjectReference.length < 1) ) {
            return reject(Error("Missing required fields"))
        }
        const dbResult = await createRating({ statement_hash, subject_name: subjectName, subject_reference: subjectReference, rating, comment: comment || ''})   
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
