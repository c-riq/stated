import {updateStatement} from './database'
import {parseDisputeAuthenticity} from 'stated-protocol-parser'

export const addAuthenticityDisputeReference = ({ statement_hash, content }: { statement_hash: string, content: string }) => (new Promise(async (resolve, reject)=>{
    try {
        const parsedDispute = parseDisputeAuthenticity(content)
        const { hash: referenced_hash } = parsedDispute
        const dbResult = await updateStatement({ hash_b64: statement_hash, referenced_statement: referenced_hash})
        if(dbResult && dbResult.rowCount !== null && dbResult.rowCount > 0){
            return resolve(true)
        } else {
            return reject(Error('Could not create response reference'))
        }
    } catch (error) {
        console.log(error)
        console.trace()
        reject(error)
    }
}))
