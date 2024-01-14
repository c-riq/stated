import {updateStatement} from './database'
import {parseDisputeContent} from './statementFormats'

export const addContentDisputeReference = ({ statement_hash, content }) => (new Promise(async (resolve, reject)=>{
    try {
        const parsedDispute = parseDisputeContent(content)
        const { hash: referenced_hash } = parsedDispute
        const dbResult = await updateStatement({ hash_b64: statement_hash, referenced_statement: referenced_hash})   
        if(dbResult.rowCount > 0){
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
