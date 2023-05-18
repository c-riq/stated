
import axios from 'axios'
import {statementExists, createUnverifiedStatement, updateUnverifiedStatement, createStatement, updateStatement} from './db'
import * as hashUtils from './hash'
import {createOrgVerification, createPersVerification} from './domainVerification'
import {parseAndCreatePoll, parseAndCreateVote} from './poll'
import {parseAndCreateRating} from './rating'
import * as cp from 'child_process'
import {parseStatement, statementTypes} from './statementFormats'

const log = true
const ownAPIKey = process.env.API_KEY
const ownDomain = process.env.DOMAIN
const test = process.env.TEST || false

const validateStatementMetadata = ({ statement, hash_b64, source_node_id }) => {
    const parsedStatement = parseStatement(statement)
    if (!parsedStatement) {
        return({error: "invalid verification"})
    }
    const {domain, author, time, content, tags, type} = parsedStatement
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
        (source_node_id === undefined || source_node_id === null)
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
    let result = {content, domain, author, tags, type, content_hash_b64: hashUtils.sha256(content), proclaimed_publication_time}
    if (type) {
        if([ statementTypes.organisationVerification, statementTypes.personVerification,
            statementTypes.poll, statementTypes.vote, 
            statementTypes.rating, statementTypes.signPdf ].includes(type)) {
            return result
        } else {
            return {error: 'invalid type: ' + type}
        }
    } else {
        return result
    }
}

export const getTXTEntries = (d) => new Promise((resolve: (entries: string[])=>void, reject) => {
    try {
        log && console.log('getTXTEntries', d)
        if (!test && ! /^[a-zA-Z\.-]{7,260}$/.test(d)) {
            console.log('invalid domain', d)
            reject(Error('invalid domain '+ d))
        }
        // TODO: use delv and require DNSSEC
        const dig = cp.spawn('dig', ['-t', 'txt', `${d}`, '+dnssec', '+short'])
        dig.stdout.on('data', (data) => {
            try {
                log && console.log('data',data)
                const TXTEntries = (''+data).split('\n').map(s=>s.replace(/\"/g,'')) || ['']
                resolve(TXTEntries)
            }
            catch(error) {
                reject(error)
            }
        })
        dig.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            reject(Error(data))
        })
        dig.on('error', (error) => { 
            reject(error) 
        })
        dig.on('close', function (code) {
            reject(Error('dig process exited with code ' + code))
        });
          
    } catch (error){
        reject(error)
    }
})

export const verifyTXTRecord = async (domain, record) => {
    log && console.log("verifyTXTRecord")
    try {
        const TXTEntries = await getTXTEntries(domain)
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
    try {
        const result = await axios({
            method: "POST",
            url, headers: { 'Content-Type': 'application/json'},
            data: { hash_b64 }})      
        if (result.data?.statements?.length > 0){
            console.log(result.data.statements[0].hash_b64, 'result from ', domain)
            if (result.data.statements[0].hash_b64 === hash_b64){
                return true
            }
        }
        return false
    } catch(e) {
        console.log(e)
        return false
    }
}

// TODO: fix - 
const verifyViaStaticTextFile = async (domain, statement) => {
    let url = 'https://static.stated.' + domain + '/statements.txt'
    try {
        const result = await axios({
            method: "GET",
            url})
        if (result.data.length > 0){
            console.log(result.data.substring(0.100), 'result from ', domain)
            if (result.data.match(statement)){
                return true
            }
        }
    } catch(e) {
        console.log(e)
        return false
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
        const {domain, author, proclaimed_publication_time, tags, content_hash_b64, type, content } = validationResult
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
                if(!verified){
                    return resolve({error: 'invalid api key'})
                }
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
                domain, author, statement, proclaimed_publication_time, hash_b64, tags, content, content_hash_b64,
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
                dbResult = await createUnverifiedStatement({statement, author, hash_b64, source_node_id, 
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
        let entityCreated = false
        try {
            if(type === statementTypes.organisationVerification){
                entityCreated = !! await createOrgVerification({statement_hash, domain, content})
            }
            if(type === statementTypes.personVerification){
                entityCreated = !! await createPersVerification({statement_hash, domain, content})
            }
            if(type === statementTypes.poll){
                entityCreated = !! await parseAndCreatePoll({statement_hash, domain, content})
            }
            if (type === statementTypes.vote) {
                entityCreated = !! await parseAndCreateVote({statement_hash, domain, content, proclaimed_publication_time})
            }
            if (type === statementTypes.rating) {
                entityCreated = !!await parseAndCreateRating({statement_hash, domain, content})
            }
            if(entityCreated === true){
                await updateStatement({ hash_b64: statement_hash, derived_entity_created: true })
            } else {
                await updateStatement({ hash_b64: statement_hash, increment_derived_entity_creation_retry_count: true })
            }
        } catch (error) {
            console.log(error)
            console.trace()
            return reject(error)
        }
        resolve(entityCreated)
    })
)