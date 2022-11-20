import db from './db.js'
import {parseDomainVerification} from './statementFormats.js'

export const createVerification = ({statement_hash, domain, version, typedContent }) => (new Promise((resolve, reject)=>{
    const verifer_domain = domain
    try {
        const groups = parseDomainVerification(typedContent)
        const { domain, name, country, province, city } = groups
        if (domain.length < 1 ||
            name.length < 1 || country.length < 1 ) {
            resolve({error: "Missing required fields"})
            return
        }
        db.createVerification({statement_hash, version, verifer_domain, verified_domain: domain, name, country, province, city})
        .then( result => {
                resolve([result, statement_hash])
        }).catch(e => resolve({error: e}))
    } catch (error) {
        resolve({error})
    }
}))
