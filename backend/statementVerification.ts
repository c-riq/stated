
import axios from 'axios'
import * as hashUtils from './hash'
import {statementExists, createUnverifiedStatement, updateUnverifiedStatement, createStatement, 
    updateStatement, createHiddenStatement, checkIfUnverifiedStatmentExists} from './database'
import {createOrgVerification, createPersVerification} from './domainVerification'
import {checkIfVerificationExists} from './database'
import {parseAndCreatePoll, parseAndCreateVote} from './poll'
import {parseAndCreateRating} from './rating'
import * as cp from 'child_process'
import {parseStatement, statementTypes} from './statementFormats'
import { get } from './request'
import { addResponseReference } from './response'
import { addAuthenticityDisputeReference } from './disputeAuthenticity'
import { addContentDisputeReference } from './disputeContent'

const log = true
const ownAPIKey = process.env.API_KEY
const ownDomain = process.env.DOMAIN
const test = process.env.TEST || false

export const validateStatementMetadata = ({ statement, hash_b64, source_node_id }:
        {statement: string, hash_b64: string, source_node_id: number|null}) => {
    const parsedStatement = parseStatement({statement, allowNoVersion: true})
    const {domain, author, time, content, tags, type, supersededStatement} = parsedStatement
    if (!hashUtils.verify(statement, hash_b64)){
        throw(Error("invalid hash: "+statement+hash_b64))
    }
    if (! (
        (typeof source_node_id == 'number')
            ||
        (source_node_id === undefined || source_node_id === null)
        ) 
    ){
        throw(Error("invalid sourceNodeId: " + source_node_id))
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
        throw(Error("invalid publication timestamp (unix epoch):" + proclaimed_publication_time))
    }
    let result = {content, domain, author, tags, type, 
        content_hash_b64: hashUtils.sha256(content), proclaimed_publication_time, supersededStatement}
    if (type) {
        if([ statementTypes.organisationVerification, statementTypes.personVerification,
            statementTypes.poll, statementTypes.vote, statementTypes.bounty,
            statementTypes.rating, statementTypes.signPdf, statementTypes.observation, statementTypes.boycott,
            statementTypes.disputeAuthenticity, statementTypes.disputeContent, statementTypes.response
        ].includes(type)) {
            return result
        } else {
            return {...result, type: statementTypes.unsupported}
        }
    }
    return result
}

export const getTXTEntries = (d: string) => new Promise((resolve: (entries: string[])=>void, reject) => {
    try {
        log && console.log('getTXTEntries', d)
        if (!test && ! /^[a-zA-Z\.-]{7,260}$/.test(d)) {
            console.log('invalid domain', d)
            reject(Error('invalid domain '+ d))
        }
        // TODO: use delv and require DNSSEC
        const dig = cp.spawn('dig', ['-t', 'txt', `${d}`, '+dnssec', '+short'])
        setTimeout(() => {
            dig.kill();
            reject(Error('dig timeout'))
        }, 10 * 1000)
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

export const verifyTXTRecord : (arg0:string, arg1:string) => Promise<boolean> = async (domain, record) => {
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

export const verifyViaStatedApi : (arg0:string, arg1:string) => Promise<boolean> = async (domain, hash_b64) => {
    let url = (test ? 'http://' + domain : 'https://stated.' + domain ) + '/api/statements/' + hash_b64
    log && console.log('verifyViaStatedApi', url, hash_b64)
    try {
        const result = await axios({
            method: "GET",
            url, headers: { 'Content-Type': 'application/json'}
        })      
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

export const verifyViaStaticBulkTextFile : (arg0:string, arg1:string) => Promise<boolean> = async (domain, statement) => {
    // very inefficient as the whole file containing all statements may be quite large
    try {
        let result = await get({hostname: 'static.stated.' + domain, path: '/statements.txt', json: false})
        if (result.data?.length > 0){
            log && console.log(result.data.substring(0,100), 'result from ', domain)
            if (result.data.includes(statement)){
                return true
            }
        }
        result = await get({hostname: 'www.' + domain, path: '/.well-known/statements.txt', json: false})
        if (result.data?.length > 0){
            log && console.log(result.data.substring(0,100), 'result from ', domain)
            if (result.data.includes(statement)){
                return true
            }
        }
    } catch(e) {
        console.log(e)
        return false
    }
    return false
}

export const verifyViaStaticTextFile : (arg0: {domain:string, hash:string, statement:string}) => 
    Promise<{validated:boolean, response?: string}> = async ({domain, hash, statement}) => {
    try {
        let result = await get({hostname: 'static.stated.' + domain,
            path: `/statements/${hash}.txt`, json: false})
        if (result.data?.length > 0){
            log && console.log(result.data.substring(0,100), 'result from ', domain)
            if (result.data === statement){
                return {validated: true, response: result.data}
            }
            return {validated: false, response: result.data}
        }
        result = await get({hostname: 'www.' + domain, 
            path: `/.well-known/statements/${hash}.txt`, json: false})
        if (result.data?.length > 0){
            log && console.log(result.data.substring(0,100), 'result from ', domain)
            if (result.data.includes(statement)){
                return {validated: true, response: result.data}
            }
        }
        result = await get({hostname: domain, 
            path: `/.well-known/statements/${hash}.txt`, json: false})
        if (result.data?.length > 0){
            log && console.log(result.data.substring(0,100), 'result from ', domain)
            if (result.data.includes(statement)){
                return {validated: true, response: result.data}
            }
        }
    } catch(e) {
        console.log(e)
        return {validated: false, response: e}
    }
    return {validated: false}
}

export const verifyViaAPIKey = ({domain, api_key}:{domain:string|undefined, api_key:string|undefined}) => {
    log && console.log('verifyViaAPIKey', domain, ownDomain, api_key, ownAPIKey)
    if(!domain){return false}
    if(!api_key){return false}
    // for demos: allow any domain
    if(domain === ownDomain && api_key === ownAPIKey){
        return true
    }
    return false
}

const verifyViaStatedApiOrStaticTextFile = async ({domain, hash_b64, statement}: {domain: string, hash_b64: string, statement: string}) => {
    let verified = false
    let verifiedByAPI = false
    log && console.log('validate via api', hash_b64)
    try {
        verified = await verifyViaStatedApi(domain, hash_b64)
        if (verified){
            verifiedByAPI = true
        }
        if (!verified){ // if api unsuccessfull try via static text file, which consumes more resources
            log && console.log('validate via static text file', hash_b64)
            const response = await verifyViaStaticTextFile({domain, statement, hash: hash_b64})
            verified = response.validated
        }
    } catch (error) {
        console.log(error)
        console.trace()
    }
    return {verified, verifiedByAPI}
}

export const validateAndAddStatementIfMissing: ({statement, hash_b64, source_node_id,
    verification_method, api_key }: {statement: string, hash_b64: string, source_node_id?: number,
        verification_method?: VerificationMethodDB, api_key?: string, hidden?:boolean }) => Promise<{existsOrCreated:boolean, tryIncremented:boolean}> = 
    ({statement, hash_b64, source_node_id = null, verification_method, api_key, hidden=false }) => 
    (new Promise(async (resolve, reject) => {
    let existsOrCreated = false
    let tryIncremented = false
    try {
        const validationResult = validateStatementMetadata({statement, hash_b64, source_node_id})
        const {domain, author, proclaimed_publication_time, tags, 
            content_hash_b64, type, content, supersededStatement } = validationResult
        log && console.log('proclaimed_publication_time', proclaimed_publication_time)
        log && console.log('check if exsits', hash_b64)
        const result = (await statementExists({hash_b64})) ?? { rows: [] };
        if (result.rows.length > 0){
            existsOrCreated = true
            return resolve({existsOrCreated, tryIncremented})
        }
        let verified = false
        let verifiedByAPI = false
        if (hidden && (!api_key || verification_method !== 'api')){
            return reject(Error('hidden statements must be verified via api key'))
        }
        if (verification_method && verification_method === 'api'){
            if (api_key) { // api key provided
                log && console.log('verifiy via api key', hash_b64)
                verified = verifyViaAPIKey({domain, api_key})
                if(!verified){
                    return reject(Error('invalid api key'))
                }
                verifiedByAPI = true
            } else { // method is api, but no api key provided
                const result = await verifyViaStatedApiOrStaticTextFile({domain, hash_b64, statement})
                verified = result.verified || verified
                verifiedByAPI = result.verifiedByAPI || verifiedByAPI
            }
        } else { // method != api -> try verify via dns
            log && console.log('verifiy via dns', hash_b64)
            verified = await verifyTXTRecord("stated." + validationResult.domain, hash_b64)
            if (!verified){ // if dns unsuccessfull try via stated api even though suggested method != api
                const result = await verifyViaStatedApiOrStaticTextFile({domain, hash_b64, statement})
                verified = result.verified || verified
                verifiedByAPI = result.verifiedByAPI || verifiedByAPI
            }
        }
        if (verified) {
            console.log('verified', verified, verifiedByAPI)
            const dbResult = hidden ?
                await createHiddenStatement({
                    type: type || statementTypes.statement,
                    domain,
                    author,
                    statement,
                    proclaimed_publication_time,
                    hash_b64,
                    tags,
                    content,
                    content_hash_b64,
                    verification_method: (verifiedByAPI ? 'api' : 'dns'),
                    source_node_id: source_node_id,
                    supersededStatement
                })
                : await createStatement({
                    type: type || statementTypes.statement,
                    domain,
                    author,
                    statement,
                    proclaimed_publication_time,
                    hash_b64,
                    tags,
                    content,
                    content_hash_b64,
                    verification_method: (verifiedByAPI ? 'api' : 'dns'),
                    source_node_id: source_node_id,
                    supersededStatement
                });
            if (dbResult && dbResult.rows && dbResult.rows[0]) {
                existsOrCreated = true;
            }
            if (type && dbResult && dbResult.rows[0]) {
                await createDerivedEntity({
                    statement_hash: dbResult.rows[0].hash_b64,
                    domain,
                    author,
                    content,
                    type,
                    proclaimed_publication_time: new Date(proclaimed_publication_time * 1000)
                });
            }
        } else { // could not verify
            if (api_key){
                return reject(Error('could not verify statement ' + hash_b64 + ' on '+ validationResult.domain))
            } else {
                const dbResult = await createUnverifiedStatement({statement, author, hash_b64, source_node_id, 
                    source_verification_method: verification_method || null})
                if(dbResult && dbResult.rows && dbResult.rows[0]){
                    return resolve({existsOrCreated, tryIncremented: true})
                }
            }
        }
        if (!existsOrCreated && !api_key && !hidden){
            await updateUnverifiedStatement({hash_b64, increment_verification_retry_count: 1 })
            tryIncremented = true
        }
        resolve({existsOrCreated, tryIncremented})
    } catch (error) {
        console.log(error)
        console.trace()
        if(!tryIncremented && !existsOrCreated && !hidden){
            try {
                const res1 = await checkIfUnverifiedStatmentExists({hash_b64})
                if (res1 && res1.rows && res1.rows[0]) {
                    const res = await updateUnverifiedStatement({ hash_b64, increment_verification_retry_count: 1 });
                    if (res && res.rows) {
                        tryIncremented = true;
                    } else {
                        const error = new Error('could not update unverified statement: ' + statement + ' \n ' + hash_b64);
                        console.error(error);
                        return reject((error));
                    }
                    return resolve({ existsOrCreated, tryIncremented: true });
                } else {
                    // TODO: replace "_"
                    const res = await createUnverifiedStatement({statement, author : "_", hash_b64, source_node_id, 
                        source_verification_method: verification_method || null})
                    if(res && res.rows && res.rows[0]){
                        tryIncremented = true
                    }
                }
            }
            catch (e) {
                console.log(e)
                console.trace()
            }
        }
        if(tryIncremented){
            return resolve({existsOrCreated, tryIncremented})
        }
        reject((error))
    }
}))

export const createDerivedEntity = ({statement_hash, domain, author, content, type, proclaimed_publication_time}:{
        statement_hash: string, domain: string, author: string, content: string, type: string, proclaimed_publication_time: Date}) => 
    (new Promise(async (resolve, reject) => {
        let entityCreated = false
        let exsits = false // should only occur if statements were deleted and re-added
        try {
            if(type === statementTypes.organisationVerification){
                // TODO: (?) check if other types exsit
                exsits = ((await checkIfVerificationExists({hash: statement_hash}))?.rows?.[0]?.exists) === true
                if (!exsits){
                    entityCreated = !! await createOrgVerification({statement_hash, domain, content})
                }
            }
            if(type === statementTypes.personVerification){
                entityCreated = !! await createPersVerification({statement_hash, domain, content})
            }
            if(type === statementTypes.poll){
                entityCreated = !! await parseAndCreatePoll({statement_hash, domain, content})
            }
            if (type === statementTypes.vote) {
                const result = await parseAndCreateVote({statement_hash, domain, author, content, proclaimed_publication_time})
                entityCreated = !! (result.rows && result.rows[0] && result.rows[0].qualified)
            }
            if (type === statementTypes.rating) {
                entityCreated = !!await parseAndCreateRating({statement_hash, domain, author, content})
            }
            if (type === statementTypes.response) {
                entityCreated = !!await addResponseReference({statement_hash, content})
            }
            if (type === statementTypes.disputeAuthenticity) {
                entityCreated = !!await addAuthenticityDisputeReference({statement_hash, content})
            }
            if (type === statementTypes.disputeContent) {
                entityCreated = !!await addContentDisputeReference({statement_hash, content})
            }
            if(entityCreated || exsits){
                await updateStatement({ hash_b64: statement_hash, derived_entity_created: true })
            }
        } catch (error) {
            console.log(error)
            console.trace()
            return reject(error)
        } finally {
            try {
                await updateStatement({ hash_b64: statement_hash, increment_derived_entity_creation_retry_count: true })
            } catch (error) {
                console.log(error)
                console.trace()
            }
        }
        resolve(entityCreated || exsits)
    })
)
