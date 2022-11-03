
const example = 
`	organisation name: Walmart Inc.
	legal form: U.S. corporation
	domain of primary website: walmart.com
	headquarter city: Bentonville
	headquarter province/state: Arkansas
	headquarter country: United States of America
`

var domainVerificationRegex= new RegExp(''
  + /^\torganisation name: (?<name>[^\n]+?)\n/.source 
  + /\tlegal form: (?<legalForm>[^\n]+?)\n/.source 
  + /\tdomain of primary website: (?<domain>[^\n]+?)\n/.source
  + /\theadquarter city: (?<city>[^\n]+?)\n/.source
  + /\theadquarter province\/state: (?<province>[^\n]+?)\n/.source
  + /\theadquarter country: (?<country>[^\n]+?)\n$/.source
);

console.log(example.match(domainVerificationRegex))
let groups = example.match(domainVerificationRegex).groups;
console.log(groups)

const db = require('./db');

const {verificationMethods} = require('./verification_methods.js');


const createVerificationAndStatement = ({type,version, domain, statement, time, hash_b64, content, content_hash }) => (new Promise((resolve, reject)=>{
    if (type !== "domain_verification" || version !== 1){
        resolve({error: "invalid verification"})
        return
    }
    const groups = statement.match(v1Regex).groups
    if (groups.verifer_domain !== domain) {
        resolve({error: "domain in verification statement not matching author domain"})
        return
    }
    const appliedMethod = verificationMethods.find(m => m.statement === groups.statement)
    if (!appliedMethod) {
        resolve({error: "invalid verification statement"})
        return
    }
    if (Object.values(groups).length != 10) {
        resolve({error: "invalid verification format"})
        return
    }
    if (groups.verifer_domain.length < 1 || groups.time.length < 1 || groups.type.length < 1 || 
        groups.statement.length < 1 || groups.domain.length < 1 || groups.name.length < 1 || 
        groups.country.length < 1 || groups.source.length < 1) {
        resolve({error: "Missing required fields"})
        return
    }
    try {
        db.createStatement({type ,version , domain, statement, time, 
                    hash_b64, content, content_hash})
        .then(resultStatement =>{
            console.log("resultStatement", resultStatement, resultStatement.inserted.id)
            db.createVerification({statement_id: resultStatement.inserted.id, version, verifer_domain: groups.verifer_domain, verified_domain: groups.domain,
                name: groups.name, country: groups.country, number: groups.number, authority: groups.authority, method: appliedMethod.id, source: groups.source })
            .then( result => {
                resolve([result,resultStatement])
            }).catch(e => resolve({error: e}))
        }).catch(e => resolve({error: e}))
    } catch (error){
        resolve({error})
    }
}))


module.exports = {
    createVerificationAndStatement
}
