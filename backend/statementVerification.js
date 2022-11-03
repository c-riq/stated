
const example = `domain: rixdata.net
time: Sun, 04 Sep 2022 14:48:50 GMT
tags: hashtag1, hashtag2
content: hello world
`

const example2 = `domain: rixdata.net
time: Sun, 04 Sep 2022 14:48:50 GMT
tags: sdf
content: 
	type: domain verification
	organisation name: Walmart Inc.
	legal form: U.S. corporation
	domain of primary website: walmart.com
	headquarter city: Bentonville
	headquarter province/state: Arkansas
	headquarter country: United States of America
`

var statementRegex= new RegExp(''
    + /^domain: (?<domain>[^\n]+?)\n/.source
    + /time: (?<time>[^\n]+?)\n/.source
    + /tags: (?<tags>[^\n]*?)\n/.source
    + /content: (?<content>[\s\S]+?)$/.source
);


var contentRegex= new RegExp(''
// with content type
    + /^\n\ttype: (?<type>[^\n]+?)\n/.source
    + /(?<typedContent>[\s\S]+?)$/.source
// without content type
    + /|^(?<content>[^\n][\s\S]+?)$/.source
);

console.log(example2.match(statementRegex))
console.log('content__', String(example2.match(statementRegex).groups.content),  String(example2.match(statementRegex).groups.content).match(contentRegex))

console.log('content__', String(example.match(statementRegex).groups.content),  String(example.match(statementRegex).groups.content).match(contentRegex))


const axios = require('axios').default;
const db = require('./db');
const hash = require('./hash');
const cp = require('child_process');

const validateStatementMetadata = async ({type, version, domain, statement, time, hash_b64, content, content_hash, source_node_id }) => {
    if (type !== "statement" || version !== 1){
        return({error: "invalid verification"})
    }
    const regexResults = statement.match(statementRegex)
    if (!regexResults) {
        return({error: "invalid verification"})
    }
    const groups = regexResults.groups
    if (groups.domain !== domain) {
        return({error: "domain in verification statement not matching author domain"})
    }
    // if (groups.time !== time){
    //     return {error: 'invalid time' + groups.time + ' vs ' + time}
    // }
    if (groups.statement !== content){
        return {error: 'invalid content' + groups.statement + ' vs '+ content}
    }
    if (Object.values(groups).length != 4) {
        return({error: "invalid verification format"})
    }
    if (groups.domain.length < 1 || groups.time.length < 1 || groups.statement.length < 1 ) {
        return({error: "Missing required fields"})
    }
    if (!await hash.verify(statement, hash_b64)){
        return({error: "invalid hash: "+statement+hash_b64})
    }
    if (!await hash.verify(groups.content, content_hash)){
        return({error: "invalid content hash: "+group.statement+content_hash})
    }
    if (! (
        (typeof source_node_id == 'number')
            ||
        (typeof source_node_id == 'undefined')
        ) 
    ){
        return({error: "invalid sourceNodeId: " + sourceNodeId})
    }
    const parsedContent = groups.content
    const contentRegexResults = content.match(parsedContent)
    console.log(contentRegexResults)
    return {}
}

const getTXTEntriesViaGoogle = (d) => new Promise((resolve, reject) => {
    // check terms before using
    let url = 'https://dns.google/resolve?name=' + d + '&type=TXT&do=true&rand=' + Math.random()
    console.log('checkDomain', url)
    axios.get(url)
        .then(function (json) {
            try {
                const TXTEntries = json.data['Answer'].map(v => v['data'])
                console.log(TXTEntries)
                resolve(TXTEntries)
            }
            catch {
                reject()
            }
        })
        .catch(function (error) {
            console.log(error);
            reject()
        })
})

const getTXTEntries = (d) => new Promise((resolve, reject) => {
    if (! /^[a-zA-Z\.-]+$/.test(d)) {
        reject({error: 'invalid characters'})
    }
    const dig = cp.spawn('dig', ['-t', 'txt', `${d}`, '+dnssec', '+short'])
    dig.stdout.on('data', (data) => {
        //console.log(`stdout: ${data}`);
        try {
            const TXTEntries = (''+data).split('\n').map(s=>s.replace(/\"/g,''))
            //console.log('TXTEntries', d, TXTEntries)
            resolve(TXTEntries)
        }
        catch(e) {
            reject(e)
        }
      })
      dig.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
        reject(data)
      })
})

const verifyTXTRecord = async (domain, record) => {
    console.log("verifyTXTRecord")
    try {
        const TXTEntries = await getTXTEntries(domain)
        //console.log(domain, TXTEntries, record)
        return TXTEntries.includes(record)
    }
    catch (e) {
        console.log(e)
    }
}

const validateAndAddStatementIfMissing = (s) => new Promise(async (resolve, reject) => {
    const validationResult = await validateStatementMetadata({type: 'statement', version: 1, domain: s.domain, statement: s.statement, 
        hash_b64: s.hash_b64, content: s.content, content_hash: s.content_hash, source_node_id: s.source_node_id})
    if (validationResult.error) {
        resolve(validationResult)
    }
    if ((await db.statementExists({hash_b64: s.hash_b64})).length > 0){
        resolve({error: 'statement exists already in db'})
        return
    }
    if (s.verification_method && s.verification_method === 'api'){
        // api verification method
        let url = 'https://stated.' + s.domain + '/api/statement/'
        console.log('validateAndAddStatementIfMissing', url)
        axios({
            method: "POST",
            url, headers: { 'Content-Type': 'application/json'},
            data: { hash_b64: s.hash_b64 }})
            .then(async (json) => {
                try {
                    console.log(json.data.statements[0].hash_b64, 'result from ', s.domain)
                    const dbResult = await db.createStatement({type: 'statement', version: 1, domain, statement, time, 
                        hash_b64: hash, content, content_hash, verification_method: 'api', source_node_id: s.source_node_id})
                    resolve(dbResult)
                }
                catch(error) {
                    resolve({error})
                }
            })
            .catch((error) => {
                console.log(error);
                resolve({error})
            })
    } else { 
        // DNS TXT verification method
        (async () => {
            const txtCorrect = await verifyTXTRecord("stated." + s.domain, s.hash_b64)
            if (!txtCorrect) {
                resolve({error: 'could not verify TXT record ' + s.hash + ' in DNS of '+ s.domain})
            } else {
                const dbResult = await db.createStatement({type: 'statement', version: 1, domain: s.domain, statement: s.statement, time: s.time, 
                    hash_b64: s.hash_b64, content: s.content, content_hash: s.content_hash, verification_method: 'dns', source_node_id: s.source_node_id})
                resolve(dbResult)
            }
        })()
    }
})


module.exports = {
    validateAndAddStatementIfMissing,
    verifyTXTRecord,
    getTXTEntries
}
