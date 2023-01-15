import db from './db.js'
import {parseDomainVerification} from './statementFormats.js'

const log = false

export const createVerification = ({statement_hash, domain, version, content }) => (new Promise(async (resolve, reject)=>{
    const verifer_domain = domain
    try {
        log && console.log(content)
        const parsedDomainVerification = parseDomainVerification(content)
        log && console.log(parsedDomainVerification)
        const { domain, name, country, province, city, legalForm } = parsedDomainVerification
        if (!domain || domain.length < 1 ||
            !name || name.length < 1 || 
            !country || country.length < 1 || 
            !legalForm || legalForm.length < 1 ) {
            resolve({error: "Missing required fields"})
            return
        }
        const dbResult = await db.createVerification({statement_hash, version, verifer_domain, verified_domain: domain, 
            name, legal_entity_type: legalForm, country, province, city})        
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
