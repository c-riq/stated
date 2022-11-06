

const axios = require('axios').default;
const db = require('./db');
const hashUtils = require('./hash');
const domainVerification = require('./domainVerification');
const cp = require('child_process');
const {statementRegex, domainVerificationType, contentRegex} = require('./statementFormats')

const validateStatementMetadata = ({domain, statement, time, hash_b64, content, content_hash, source_node_id }) => {
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
    if (groups.content !== content){
        return {error: 'invalid content' + groups.content + ' vs '+ content}
    }
    if (groups.domain.length < 1 || groups.time.length < 1 || groups.content.length < 1 ) {
        return({error: "Missing required fields"})
    }
    if (!hashUtils.verify(statement, hash_b64)){
        return({error: "invalid hash: "+statement+hash_b64})
    }
    if (!hashUtils.verify(groups.content, content_hash)){
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
    const contentRegexResults = parsedContent.match(contentRegex)
    const contentMatchGroups = contentRegexResults.groups
    let result = {content: parsedContent, domain: groups.domain, time: groups.time}
    if (contentMatchGroups.type) {
        if(contentMatchGroups.type === domainVerificationType) {
            return {...result, type: contentMatchGroups.type, typedContent: contentMatchGroups.typedContent}
        } else {
            return {error: 'invalid type: ' + contentMatchGroups.type}
        }
    } else {
        return result
    }
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
    try {
        if (! /^[a-zA-Z\.-]+$/.test(d)) {
            resolve({error: 'invalid characters'})
        }
        const dig = cp.spawn('dig', ['-t', 'txt', `${d}`, '+dnssec', '+short'])
        dig.stdout.on('data', (data) => {
            try {
                const TXTEntries = (''+data).split('\n').map(s=>s.replace(/\"/g,''))
                resolve(TXTEntries)
            }
            catch(error) {
                resolve({error})
            }
        })
        dig.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            resolve({error: data})
        })
    } catch (error){
        resolve({error})
    }
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
    return false
}

const verifyViaStatedApi = async (domain, hash_b64) => {
    let url = 'https://stated.' + domain + '/api/statement/'
    console.log('verifyViaStatedApi', url, hash_b64)
    const result = await axios({
        method: "POST",
        url, headers: { 'Content-Type': 'application/json'},
        data: { hash_b64: s.hash_b64 }})
    console.log(result.data.statements[0].hash_b64, 'result from ', s.domain)
    if (result.data.statements[0].hash_b64 === hash_b64){
        return true
    }
    return false
}

const validateAndAddStatementIfMissing = (s) => new Promise(async (resolve, reject) => {
    try{
        const {domain, statement, time, hash_b64, content, content_hash, source_node_id } = s
        const validationResult = validateStatementMetadata({domain, statement, time, hash_b64, content, content_hash, source_node_id })
        if (validationResult.error) {
            resolve(validationResult)
        }
        if ((await db.statementExists({hash_b64: s.hash_b64})).length > 0){
            resolve({error: 'statement exists already in db'})
            return
        }
        let verified = false
        let verifiedByAPI = false
        if (s.verification_method && s.verification_method === 'api'){
            verified = await verifyViaStatedApi(s.domain, s.hash_b64)
            verifiedByAPI = true
        } else { 
            verified = await verifyTXTRecord("stated." + s.domain, s.hash_b64)
            if (!verified){
                verified = await verifyViaStatedApi(s.domain, s.hash_b64)
                verifiedByAPI = true
            }
        }
        if (verified) {
            let dbResult = {error: 'record not created'}
            if(validationResult.type) {
                if(validationResult.type === domainVerificationType){
                    dbResult = await db.createStatement({type: domainVerificationType, version: 1, domain: s.domain, statement: s.statement, time: s.time, 
                        hash_b64: s.hash_b64, content: s.content, content_hash: s.content_hash,
                        verification_method: (verifiedByAPI ? 'api' : 'dns'), source_node_id: s.source_node_id})
                    await domainVerification.createVerification({statement_id : dbResult.inserted.id, version: 1, domain, typedContent: validationResult.typedContent})
                }
            } else {
                dbResult = await db.createStatement({type: 'statement', version: 1, domain: s.domain, statement: s.statement, time: s.time, 
                    hash_b64: s.hash_b64, content: s.content, content_hash: s.content_hash, 
                    verification_method: (verifiedByAPI ? 'api' : 'dns'), source_node_id: s.source_node_id})
            }
            resolve(dbResult)
        } else {
            resolve({error: 'could not verify statement ' + s.hash + ' on '+ s.domain})
        }
    } catch (error) {
        resolve({error})
    }
})


module.exports = {
    validateAndAddStatementIfMissing,
    verifyTXTRecord,
    getTXTEntries
}
