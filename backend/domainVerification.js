
const example = `domain: rixdata.net
time: Sun, 04 Sep 2022 15:00:47 GMT
type: domain_verification
statement: We personally confirmed with a direct employee of the company that this is the companies main domain.
verify organisation domain: siemens-energy.com
verify organisation name: Rix Data UG (haftungsbeschränkt)
verify organisation country: Germany
verify organisation registration number: HRB 10832
verify organisation registration authority: Amtsgericht Bamberg
verify organisation source: Christopher Rieckmann` // 486 chars


var v1Regex= new RegExp(''
  + /^domain: (?<verifer_domain>[^\n]+?)\n/.source
  + /time: (?<time>[^\n]+?)\n/.source
  + /type: (?<type>[^\n]+?)\n/.source 
  + /statement: (?<statement>[^\n]+?)\n/.source
  + /verify organisation domain: (?<domain>[^\n]+?)\n/.source
  + /verify organisation name: (?<name>[^\n]+?)\n/.source 
  + /verify organisation country: (?<country>[^\n]+?)\n/.source
  + /verify organisation registration number: (?<number>[^\n]+?)\n/.source 
  + /verify organisation registration authority: (?<authority>[^\n]+?)\n/.source 
  + /verify organisation source: (?<source>[^\n]+?)$/.source
);

let groups = example.match(v1Regex).groups;

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
