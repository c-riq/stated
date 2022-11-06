

const db = require('./db');
const {domainVerificationRegex} = require('./statementFormats')

const createVerification = ({statement_id, domain, version, typedContent }) => (new Promise((resolve, reject)=>{
    try {
        const groups = typedContent.match(domainVerificationRegex).groups
        if (groups.domain.length < 1 || groups.time.length < 1 ||
            groups.name.length < 1 || groups.country.length < 1 ) {
            resolve({error: "Missing required fields"})
            return
        }
        db.createVerification({statement_id, version, verifer_domain: domain, verified_domain: groups.domain,
                name: groups.name, country: groups.country, number: groups.number, authority: groups.authority, method: appliedMethod.id, source: groups.source })
        .then( result => {
                resolve([result,resultStatement])
        }).catch(e => resolve({error: e}))
    } catch (error) {
        resolve({error})
    }
}))


module.exports = {
    createVerification
}
