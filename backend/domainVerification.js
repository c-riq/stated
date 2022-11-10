

const db = require('./db');
const {domainVerificationRegex} = require('./statementFormats')

const createVerification = ({statement_id, domain, version, typedContent }) => (new Promise((resolve, reject)=>{
    const verifer_domain = domain
    try {
        const groups = typedContent.match(domainVerificationRegex).groups
        const { domain, name, country, province, city } = groups
        if (domain.length < 1 ||
            name.length < 1 || country.length < 1 ) {
            resolve({error: "Missing required fields"})
            return
        }
        db.createVerification({statement_id, version, verifer_domain, verified_domain: domain, name, country, province, city})
        .then( result => {
                resolve([result, statement_id])
        }).catch(e => resolve({error: e}))
    } catch (error) {
        resolve({error})
    }
}))


module.exports = {
    createVerification
}
