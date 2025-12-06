import {createPersonVerification, createOrganisationVerification} from './database'
import {parsePersonVerification, parseOrganisationVerification} from 'stated-protocol-parser'

const log = true

export const createOrgVerification = ({statement_hash, domain: verifier_domain, content }: { statement_hash: string, domain: string, content: string }) => (new Promise(async (resolve, reject)=>{
    try {
        log && console.log(content)
        const parsedOrganisationVerification = parseOrganisationVerification(content)
        log && console.log(parsedOrganisationVerification)
        const { domain, foreignDomain, name, country, province, city, legalForm, serialNumber, confidence, department } = parsedOrganisationVerification
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
            name, foreign_domain: foreignDomain, legal_entity_type: legalForm, country, province, city, serial_number: serialNumber,
            confidence: confidence || null, department: department || null})
        if(dbResult?.rows[0]){
            return resolve({entityCreated: true})
        }
    }catch(e) {
        console.log(e)
        return reject(e)
    }
    reject(new Error("No organisation verification created"))
}))

export const createPersVerification = ({statement_hash, domain: verifier_domain, content }: { statement_hash: string, domain: string, content: string }) => (new Promise(async (resolve, reject)=>{
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
            !dateOfBirth || (typeof dateOfBirth.getMonth !== 'function')) {
            return reject(new Error("Missing required fields"))
        }
        const dbResult = await createPersonVerification({statement_hash, verifier_domain, verified_domain: domain || null, 
            name, birth_country: countryOfBirth, birth_city: cityOfBirth, birth_date: dateOfBirth, foreign_domain: foreignDomain || null})        
        if(dbResult?.rows[0]){
            return resolve({entityCreated: true})
        }
    } catch(e) {
        console.log(e)
        return reject(e)
    }
    reject(new Error("No person verification created"))
}))
