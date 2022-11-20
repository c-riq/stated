

import axios from 'axios'
import db from './db.js'
import * as hashUtils from './hash.js'
import {createVerification} from './domainVerification.js'
import * as cp from 'child_process'
import {statementRegex, statementTypes, contentRegex, pollRegex, voteRegex} from './statementFormats.js'

const validateStatementMetadata = ({statement, hash_b64, source_node_id }) => {
    const regexResults = statement.match(statementRegex)
    if (!regexResults) {
        return({error: "invalid verification"})
    }
    const groups = regexResults.groups
    if (!groups.domain) {
        return({error: "domain missing"})
    }
    if (!groups.content){
        return {error: 'content missing'}
    }
    if (!groups.time){
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
        return({error: "invalid sourceNodeId: " + sourceNodeId})
    }
    const parsedContent = groups.content
    const contentRegexResults = parsedContent.match(contentRegex)
    const contentMatchGroups = contentRegexResults.groups
    let result = {content: parsedContent, domain: groups.domain, time: groups.time,  tags: groups.tags, 
        content_hash_b64: hashUtils.sha256Hash(parsedContent), time: Date.parse(groups.time)}
    if (contentMatchGroups.type) {
        if([ statementTypes.domainVerification, statementTypes.poll, statementTypes.vote ].includes(contentMatchGroups.type)) {
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

export const getTXTEntries = (d) => new Promise((resolve, reject) => {
    try {
        console.log('getTXTEntries', d)
        if (! /^[a-zA-Z\.-]{7,260}$/.test(d)) {
            resolve({error: 'invalid domain'})
        }
        const dig = cp.spawn('dig', ['-t', 'txt', `${d}`, '+dnssec', '+short'])
        dig.stdout.on('data', (data) => {
            try {
                console.log('data',data)
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

export const verifyTXTRecord = async (domain, record) => {
    console.log("verifyTXTRecord")
    try {
        const TXTEntries = await getTXTEntries(domain)
        console.log('TXTEntries result', domain, TXTEntries, record)
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

export const validateAndAddStatementIfMissing = (s) => new Promise(async (resolve, reject) => {
    try{
        const {statement, hash_b64, source_node_id, verification_method } = s
        const validationResult = validateStatementMetadata({statement, hash_b64, source_node_id })
        const {domain, time, tags, content_hash_b64, type, typedContent, content } = validationResult
        if (validationResult.error) {
            resolve(validationResult)
        }
        if ((await db.statementExists({hash_b64})).length > 0){
            resolve({error: 'statement exists already in db'})
            return
        }
        let verified = false
        let verifiedByAPI = false
        if (verification_method && verification_method === 'api'){
            verified = await verifyViaStatedApi(validationResult.domain, hash_b64)
            verifiedByAPI = true
        } else { 
            verified = await verifyTXTRecord("stated." + validationResult.domain, hash_b64)
            if (!verified){
                verified = await verifyViaStatedApi(validationResult.domain, hash_b64)
                verifiedByAPI = true
            }
        }
        if (verified) {
            let dbResult = {error: 'record not created'}
            if(type) {
                if(type === statementTypes.domainVerification){
                    dbResult = await db.createStatement({type, version: 1, domain, statement, time, hash_b64, tags, content, content_hash_b64,
                        verification_method: (verifiedByAPI ? 'api' : 'dns'), source_node_id})
                    dbResult = await createVerification({statement_hash : dbResult.inserted.hash_b64, 
                        version: 1, domain, typedContent})
                }
                if([statementTypes.poll, statementTypes.vote].includes(type)){
                    dbResult = await db.createStatement({type, version: 1, domain, statement, time, hash_b64, tags, content, content_hash_b64,
                        verification_method: (verifiedByAPI ? 'api' : 'dns'), source_node_id})
                }
            } else {
                dbResult = await db.createStatement({type: statementTypes.statement, version: 1, domain, statement, time, hash_b64, tags, content, content_hash_b64,
                    verification_method: (verifiedByAPI ? 'api' : 'dns'), source_node_id})
            }
            resolve(dbResult)
        } else {
            resolve({error: 'could not verify statement ' + hash_b64 + ' on '+ validationResult.domain})
        }
    } catch (error) {
        resolve({error})
    }
})
