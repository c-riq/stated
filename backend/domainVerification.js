import {createPersonVerification, createOrganisationVerification} from './db.js'
import {parsePersonVerification, parseOrganisationVerification} from './statementFormats.js'

const log = false

export const createOrgVerification = ({statement_hash, domain, content }) => (new Promise(async (resolve, reject)=>{
    const verifier_domain = domain
    try {
        log && console.log(content)
        const parsedOrganisationVerification = parseOrganisationVerification(content)
        log && console.log(parsedOrganisationVerification)
        const { domain, name, country, province, city, legalForm, serialNumber } = parsedOrganisationVerification
        if (!domain || domain.length < 1 ||
            !name || name.length < 1 || 
            !country || country.length < 1 || 
            !legalForm || legalForm.length < 1 ) {
            resolve({error: "Missing required fields"})
            return
        }
        const dbResult = await createOrganisationVerification({statement_hash, verifier_domain, verified_domain: domain, 
            name, legal_entity_type: legalForm, country, province, city, serialNumber})        
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

export const createPersVerification = ({statement_hash, domain, version, content }) => (new Promise(async (resolve, reject)=>{
    const verifier_domain = domain
    try {
        log && console.log(content)
        const parsedPersonVerification = parsePersonVerification(content)
        log && console.log(parsedPersonVerification)
        const { domain, name, country, province, city, legalForm } = parsedPersonVerification
        if (!domain || domain.length < 1 ||
            !name || name.length < 1 || 
            !country || country.length < 1 || 
            !legalForm || legalForm.length < 1 ) {
            resolve({error: "Missing required fields"})
            return
        }
        const dbResult = await createPersonVerification({statement_hash, version, verifier_domain, verified_domain: domain, 
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
