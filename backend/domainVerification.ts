import {createPersonVerification, createOrganisationVerification} from './database'
import {parsePersonVerification, parseOrganisationVerification} from './statementFormats'

const log = true

export const createOrgVerification = ({statement_hash, domain: verifier_domain, content }) => (new Promise(async (resolve, reject)=>{
    try {
        log && console.log(content)
        const parsedOrganisationVerification = parseOrganisationVerification(content)
        log && console.log(parsedOrganisationVerification)
        const { domain, foreignDomain, name, country, province, city, legalForm, serialNumber } = parsedOrganisationVerification
        if ((
                (!domain || domain.length < 1) &&
                (!foreignDomain || foreignDomain.length < 1)
            ) ||
            !name || name.length < 1 || 
            !country || country.length < 1 || 
            !legalForm || legalForm.length < 1 ) {
                return reject(new Error("Missing required fields"))
        }
        const dbResult = await createOrganisationVerification({statement_hash, verifier_domain, verified_domain: domain, 
            name, legal_entity_type: legalForm, country, province, city, serialNumber})
        if(dbResult.rows[0]){
            return resolve({entityCreated: true})
        }
    }catch(e) {
        console.log(e)
        return reject(e)
    }
    reject(new Error("No organisation verification created"))
}))

export const createPersVerification = ({statement_hash, domain: verifier_domain, content }) => (new Promise(async (resolve, reject)=>{
    try {
        log && console.log(content)
        const parsedPersonVerification = parsePersonVerification(content)
        log && console.log(parsedPersonVerification)
        const { ownDomain: domain, foreignDomain, name, countryOfBirth, cityOfBirth, dateOfBirth } = parsedPersonVerification
        if ((
                (!domain || domain.length < 1) &&
                (!foreignDomain || foreignDomain.length < 1)
            ) ||
            !name || name.length < 1 || 
            !countryOfBirth || countryOfBirth.length < 1|| 
            !cityOfBirth || cityOfBirth.length < 1|| 
            !dateOfBirth || (typeof dateOfBirth.getMonth === 'function')) {
            resolve({error: "Missing required fields"})
            return
        }
        const dbResult = await createPersonVerification({statement_hash, verifier_domain, verified_domain: domain, 
            name, 
            countryOfBirth, cityOfBirth, dateOfBirth, foreignDomain})        
        if(dbResult.rows[0]){
            return resolve({entityCreated: true})
        }
    } catch(e) {
        console.log(e)
        return reject(e)
    }
    reject(new Error("No person verification created"))
}))
