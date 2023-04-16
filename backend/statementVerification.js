

import axios from 'axios'
import {statementExists, createUnverifiedStatement, updateUnverifiedStatement, createStatement, updateStatement} from './db.js'
import * as hashUtils from './hash.js'
import {createOrgVerification, createPersVerification} from './domainVerification.js'
import {parseAndCreatePoll, parseAndCreateVote} from './poll.js'
import {parseAndCreateRating} from './rating.js'
import * as cp from 'child_process'
import {parseStatement, statementTypes} from './statementFormats.js'

const log = true
const ownAPIKey = process.env.API_KEY
const ownDomain = process.env.DOMAIN
const test = process.env.TEST || false

const validateStatementMetadata = ({ statement, hash_b64, source_node_id }) => {
    const parsedStatement = parseStatement(statement)
    if (!parsedStatement) {
        return({error: "invalid verification"})
    }
    const {domain, time, content, tags, type} = parsedStatement
    if (!domain) {
        return({error: "domain missing"})
    }
    if (!content){
        return {error: 'content missing'}
    }
    if (!time){
        return {error: 'time missing'}
    }
    if (!hashUtils.verify(statement, hash_b64)){
        return({error: "invalid hash: "+statement+hash_b64})
    }
    if (! (
        (typeof source_node_id == 'number')
            ||
        (typeof source_node_id == 'undefined')
        ) 
    ){
        return({error: "invalid sourceNodeId: " + source_node_id})
    }
    let proclaimed_publication_time = -1
    try {
        const millisecondsSince1970 = new Date(time).getTime()
        proclaimed_publication_time = millisecondsSince1970 / 1000.0
    } catch(error) {
        console.trace()
        console.log(error)
    }
    if (!(proclaimed_publication_time > 0)){
        return({error: "invalid publication timestamp (unix epoch):" + proclaimed_publication_time})
    }
    let result = {content, domain, tags, type, content_hash_b64: hashUtils.sha256Hash(content), proclaimed_publication_time}
    if (type) {
        if([ statementTypes.domainVerification, statementTypes.poll, statementTypes.vote, statementTypes.rating ].includes(type)) {
            return result
        } else {
            return {error: 'invalid type: ' + type}
        }
    } else {
        return result
    }
}

const getTXTEntriesViaGoogle = (d) => new Promise((resolve, reject) => {
    // check terms before using
    let url = 'https://dns.google/resolve?name=' + d + '&type=TXT&do=true&rand=' + Math.random()
    log && console.log('checkDomain', url)
    axios.get(url)
        .then(function (json) {
            try {
                const TXTEntries = json.data['Answer'].map(v => v['data'])
                log && console.log(TXTEntries)
                resolve(TXTEntries)
            }
            catch {
                reject()
            }
        })
        .catch(function (error) {
            console.trace()
            console.log(error);
            reject()
        })
})

export const getTXTEntries = (d) => new Promise((resolve, reject) => {
    try {
        log && console.log('getTXTEntries', d)
        if (!test && ! /^[a-zA-Z\.-]{7,260}$/.test(d)) {
            console.log('invalid domain', d)
            resolve({error: 'invalid domain '+ d})
        }
        const dig = cp.spawn('dig', ['-t', 'txt', `${d}`, '+dnssec', '+short'])
        dig.stdout.on('data', (data) => {
            try {
                log && console.log('data',data)
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
        dig.on('error', (error) => { 
            resolve({error: 'dig process error: ' + error}) 
        })
        dig.on('close', function (code) {
            resolve({error: 'dig process exited with code ' + code})
        });
          
    } catch (error){
        resolve({error})
    }
})

export const verifyTXTRecord = async (domain, record) => {
    log && console.log("verifyTXTRecord")
    try {
        const TXTEntries = await getTXTEntries(domain)
        console.log(TXTEntries, 'TXTEntries')
        if(TXTEntries.error){
            console.log(TXTEntries.error)
        }
        log && console.log('TXTEntries result', domain, TXTEntries, record)
        return TXTEntries.includes(record)
    }
    catch (e) {
        console.log(e)
    }
    return false
}

const verifyViaStatedApi = async (domain, hash_b64) => {
    let url = (test ? 'http://' + domain : 'https://stated.' + domain ) + '/api/statement/'
    log && console.log('verifyViaStatedApi', url, hash_b64)
    let result = {}
    try {
        result = await axios({
            method: "POST",
            url, headers: { 'Content-Type': 'application/json'},
            data: { hash_b64 }})
    } catch(e) {
        console.log(e)
        return false
    }
    if (result.data && result.data.statements && result.data.statements.length > 0){
        console.log(result.data.statements[0].hash_b64, 'result from ', domain)
        if (result.data.statements[0].hash_b64 === hash_b64){
            return true
        }
    }
    return false
}
const verifyViaStaticTextFile = async (domain, statement) => {
    let url = 'https://static.stated.' + domain + '/statements.txt'
    let result = {}
    try {
        result = await axios({
            method: "GET",
            url})
    } catch(e) {
        console.log(e)
        return false
    }
    if (result && result.length > 0){
        console.log(result.substring(0.100), 'result from ', domain)
        if (result.match(statement)){
            return true
        }
    }
    return false
}

const verifyViaAPIKey = async ({domain, api_key}) => {
    log && console.log('verifyViaAPIKey', domain, ownDomain, api_key, ownAPIKey)
    if(!domain){return false}
    if(!api_key){return false}
    if(domain === ownDomain && api_key === ownAPIKey){
        return true
    }
    return false
}

export const validateAndAddStatementIfMissing = 
    ({statement, hash_b64, source_node_id = null, verification_method, api_key }) => 
    (new Promise(async (resolve, reject) => {
    let existsOrCreated = false
    try {
        const validationResult = validateStatementMetadata({statement, hash_b64, source_node_id })
        const {domain, proclaimed_publication_time, tags, content_hash_b64, type, content } = validationResult
        log && console.log('proclaimed_publication_time', proclaimed_publication_time)
        if (validationResult.error) {
            resolve(validationResult)
        }
        log && console.log('check if exsits', hash_b64)
        const result = await statementExists({hash_b64})
        if (result.error){
            console.log(result.error)
            console.trace()
            resolve(result)
            return
        }
        if (result.rows && result.rows.length > 0){
            existsOrCreated = true
            resolve({existsOrCreated})
            return
        }
        let verified = false
        let verifiedByAPI = false
        if (verification_method && verification_method === 'api'){
            if (api_key) {
                log && console.log('verifiy via api key', hash_b64)
                verified = await verifyViaAPIKey({domain, api_key})
                verifiedByAPI = true
            } else {
                log && console.log('validate via api', hash_b64)
                verified = await verifyViaStatedApi(validationResult.domain, hash_b64)
                if (!verified){
                    log && console.log('validate via static text file', hash_b64)
                    verified = await verifyViaStaticTextFile(validationResult.domain, statement)
                }
                verifiedByAPI = true
            }
        } else { 
            log && console.log('verifiy via dns', hash_b64)
            verified = await verifyTXTRecord("stated." + validationResult.domain, hash_b64)
            if (!verified){
                log && console.log('verifiy via stated api', hash_b64)
                verified = await verifyViaStatedApi(validationResult.domain, hash_b64)
                verifiedByAPI = true
            }
        }
        let dbResult = {error: 'no entity created'}
        if (verified) {
            console.log('verified', verified, verifiedByAPI)
            dbResult = await createStatement({type: type || statementTypes.statement,
                domain, statement, proclaimed_publication_time, hash_b64, tags, content, content_hash_b64,
                verification_method: (verifiedByAPI ? 'api' : 'dns'), source_node_id})
            if(dbResult.error){
                console.log(dbResult.error)
                console.trace()
                resolve(dbResult)
                return
            } else {
                if(dbResult.rows && dbResult.rows[0]){
                    existsOrCreated = true
                }
            }
            if(type && dbResult.rows[0]) {
                const derivedEntityResult = await createDerivedEntity({statement_hash: dbResult.rows[0].hash_b64, 
                    domain, content, type, proclaimed_publication_time})
                if(derivedEntityResult.error){
                    console.log(derivedEntityResult.error)
                    console.trace()
                }
            }
            if(dbResult.error){
                console.log(dbResult.error)
                console.trace()
                resolve(dbResult)
                return
            }
        } else {
            if (api_key){
                resolve({error: 'could not verify statement ' + hash_b64 + ' on '+ validationResult.domain})
                return
            } else {
                dbResult = await createUnverifiedStatement({statement, hash_b64, source_node_id, 
                    source_verification_method: verification_method})
                if(dbResult.error){
                    console.log(dbResult.error)
                    console.trace()
                    resolve(dbResult)
                    return
                } else {
                    if(dbResult.rows && dbResult.rows[0]){
                        existsOrCreated = true
                    }
                }
                dbResult = await updateUnverifiedStatement({hash_b64, increment_verification_retry_count: 1 })
                if(dbResult.error){
                    console.log(dbResult.error)
                    console.trace()
                    resolve(dbResult)
                    return
                }
            }
        }
        resolve({...dbResult,existsOrCreated})
    } catch (error) {
        console.log(error)
        console.trace()
        resolve({error})
    }
}))

export const createDerivedEntity = 
    ({statement_hash, domain, content, type, proclaimed_publication_time}) => 
    (new Promise(async (resolve, reject) => {
        let dbResult = {error: 'no entity created'}
        try {
            if(type === statementTypes.domainVerification){
                dbResult = await createOrgVerification({statement_hash, domain, content})
            }
            if(type === statementTypes.poll){
                dbResult = await parseAndCreatePoll({statement_hash, domain, content})
            }
            if (type === statementTypes.vote) {
                dbResult = await parseAndCreateVote({statement_hash, domain, content, proclaimed_publication_time})
            }
            if (type === statementTypes.rating) {
                dbResult = await parseAndCreateRating({statement_hash, domain, content})
            }
            if((!dbResult.error) && dbResult.entityCreated === true){
                dbResult = await updateStatement({ hash_b64: statement_hash, derived_entity_created: true })
            } else {
                dbResult = await updateStatement({ hash_b64: statement_hash, increment_derived_entity_creation_retry_count: true })
            }
            if(dbResult.error){
                console.log(dbResult.error)
                console.trace()
                resolve(dbResult)
                return
            }
        } catch (error) {
            console.log(error)
            console.trace()
            resolve({error})
            return
        }
        resolve(dbResult)
    })
)