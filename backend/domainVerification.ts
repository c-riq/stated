// @ts-nocheck

import {createPersonVerification, createOrganisationVerification} from './database'
import {parsePersonVerification, parseOrganisationVerification} from './statementFormats'

const log = true

export const createOrgVerification = ({statement_hash, domain, content }) => (new Promise(async (resolve, reject)=>{
    const verifier_domain = domain
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

export const createPersVerification = ({statement_hash, domain, content }) => (new Promise(async (resolve, reject)=>{
    const verifier_domain = domain
    try {
        log && console.log(content)
        const parsedPersonVerification = parsePersonVerification(content)
        log && console.log(parsedPersonVerification)
        const { domain, foreignDomain, name, countryOfBirth, cityOfBirth, dateOfBirth } = parsedPersonVerification
        if ((
                (!domain || domain.length < 1) &&
                (!foreignDomain || foreignDomain.length < 1)
            ) ||
            !name || name.length < 1 || 
            !countryOfBirth || countryOfBirth.length < 1|| 
            !cityOfBirth || cityOfBirth.length < 1|| 
            !dateOfBirth || dateOfBirth.length < 1 ) {
            resolve({error: "Missing required fields"})
            return
        }
        const dbResult = await createPersonVerification({statement_hash, verifier_domain, verified_domain: domain, 
            name, 
            countryOfBirth, cityOfBirth, dateOfBirth, foreignDomain})        
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
