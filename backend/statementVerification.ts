
import axios from 'axios'
import {statementExists, createUnverifiedStatement, updateUnverifiedStatement, createStatement, updateStatement, createHiddenStatement} from './database'
import * as hashUtils from './hash'
import {createOrgVerification, createPersVerification} from './domainVerification'
import {checkIfVerificationExists} from './database'
import {parseAndCreatePoll, parseAndCreateVote} from './poll'
import {parseAndCreateRating} from './rating'
import * as cp from 'child_process'
import {parseStatement, statementTypes} from './statementFormats'
import { get } from './request'

const log = true
const ownAPIKey = process.env.API_KEY
const ownDomain = process.env.DOMAIN
const test = process.env.TEST || false

const validateStatementMetadata = ({ statement, hash_b64, source_node_id }) => {
    const parsedStatement = parseStatement(statement)
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
            statementTypes.disputeAuthenticity, statementTypes.disputeContent ].includes(type)) {
            return result
        } else {
            return {...result, type: statementTypes.unsupported}
        }
    }
    return result
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
    let url = (test ? 'http://' + domain : 'https://stated.' + domain ) + '/api/statement/' + hash_b64
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

export const verifyViaStaticTextFile : (arg0:string, arg1:string) => Promise<boolean> = async (domain, statement) => {
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

export const verifyViaAPIKey = ({domain, api_key}) => {
    log && console.log('verifyViaAPIKey', domain, ownDomain, api_key, ownAPIKey)
    if(!domain){return false}
    if(!api_key){return false}
    // for demos: allow any domain
    if(domain === ownDomain && api_key === ownAPIKey){
        return true
    }
    return false
}

export const validateAndAddStatementIfMissing: (arg0: {
    statement: string, hash_b64: string, source_node_id?: string, 
    verification_method: string, api_key: string, hidden?: boolean}) => Promise<{existsOrCreated:boolean}> = 
    ({statement, hash_b64, source_node_id = null, verification_method, api_key, hidden=false }) => 
    (new Promise(async (resolve, reject) => {
    let existsOrCreated = false
    try {
        const validationResult = validateStatementMetadata({statement, hash_b64, source_node_id })
        const {domain, author, proclaimed_publication_time, tags, 
            content_hash_b64, type, content, supersededStatement } = validationResult
        log && console.log('proclaimed_publication_time', proclaimed_publication_time)
        log && console.log('check if exsits', hash_b64)
        const result = await statementExists({hash_b64})
        if (result.rows && result.rows.length > 0){
            existsOrCreated = true
            return resolve({existsOrCreated})
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
                log && console.log('validate via api', hash_b64)
                verified = await verifyViaStatedApi(validationResult.domain, hash_b64)
                if (verified){
                    verifiedByAPI = true
                }
                if (!verified){ // if api unsuccessfull try via static text file, which consumes more resources
                    log && console.log('validate via static text file', hash_b64)
                    verified = await verifyViaStaticTextFile(validationResult.domain, statement)
                }
            }
        } else { // method != api -> try verify via dns
            log && console.log('verifiy via dns', hash_b64)
            verified = await verifyTXTRecord("stated." + validationResult.domain, hash_b64)
            if (!verified){ // if dns unsuccessfull try via stated api even though suggested method != api
                log && console.log('verifiy via stated api', hash_b64)
                verified = await verifyViaStatedApi(validationResult.domain, hash_b64)
                if (verified){
                    verifiedByAPI = true
                }
            }
            if (!verified){ // if api unsuccessfull try via static text file, which consumes more resources
                log && console.log('validate via static text file', hash_b64)
                verified = await verifyViaStaticTextFile(validationResult.domain, statement)
            }
        }
        if (verified) {
            console.log('verified', verified, verifiedByAPI)
            const dbResult = hidden ?
            await createHiddenStatement({type: type || statementTypes.statement,
                domain, author, statement, proclaimed_publication_time, hash_b64, tags, content, content_hash_b64,
                verification_method: (verifiedByAPI ? 'api' : 'dns'), source_node_id, supersededStatement})
            : await createStatement({type: type || statementTypes.statement,
                domain, author, statement, proclaimed_publication_time, hash_b64, tags, content, content_hash_b64,
                verification_method: (verifiedByAPI ? 'api' : 'dns'), source_node_id, supersededStatement})
            if(dbResult.rows && dbResult.rows[0]){
                existsOrCreated = true
            }
            if(type && dbResult.rows[0]) {
                await createDerivedEntity({statement_hash: dbResult.rows[0].hash_b64, 
                    domain, content, type, proclaimed_publication_time})
            }
        } else { // could not verify
            if (api_key){
                throw(Error('could not verify statement ' + hash_b64 + ' on '+ validationResult.domain))
            } else {
                const dbResult = await createUnverifiedStatement({statement, author, hash_b64, source_node_id, 
                    source_verification_method: verification_method})
                if(dbResult.rows && dbResult.rows[0]){
                    existsOrCreated = true
                } else {
                    await updateUnverifiedStatement({hash_b64, increment_verification_retry_count: 1 })
                }
            }
        }
        resolve({existsOrCreated})
    } catch (error) {
        console.log(error)
        console.trace()
        reject((error))
    }
}))

export const createDerivedEntity = 
    ({statement_hash, domain, content, type, proclaimed_publication_time}) => 
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
                entityCreated = !! await parseAndCreateVote({statement_hash, domain, content, proclaimed_publication_time})
            }
            if (type === statementTypes.rating) {
                entityCreated = !!await parseAndCreateRating({statement_hash, domain, content})
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
