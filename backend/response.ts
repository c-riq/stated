import {updateStatement} from './database'
import {parseResponseContent} from './statementFormats'

export const addResponseReference = ({ statement_hash, content }) => (new Promise(async (resolve, reject)=>{
    try {
        const parsedResponse = parseResponseContent(content)
        const { hash: referenced_hash, response:_ } = parsedResponse
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
