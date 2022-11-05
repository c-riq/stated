
const example = 
`	description: We verified the following information about an organisation.
	organisation name: Walmart Inc.
	legal form: U.S. corporation
	domain of primary website: walmart.com
	headquarter city: Bentonville
	headquarter province/state: Arkansas
	headquarter country: United States of America
`

var domainVerificationRegex= new RegExp(''
  + /^\todescription: We verified the following information about an organisation.\n/.source 
  + /\torganisation name: (?<name>[^\n]+?)\n/.source 
  + /(?:\tlegal form: (?<legalForm>[^\n]+?)\n)?/.source 
  + /\tdomain of primary website: (?<domain>[^\n]+?)\n/.source
  + /(?:\theadquarter city: (?<city>[^\n]+?)\n)?/.source
  + /(?:\theadquarter province\/state: (?<province>[^\n]+?)\n)?/.source
  + /\theadquarter country: (?<country>[^\n]+?)\n$/.source
);

console.log(example.match(domainVerificationRegex))
let groups = example.match(domainVerificationRegex).groups;
console.log(groups)

const db = require('./db');



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
