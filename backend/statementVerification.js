

import axios from 'axios'
import db from './db.js'
import * as hashUtils from './hash.js'
import {createVerification} from './domainVerification.js'
import {createVote} from './vote.js'
import * as cp from 'child_process'
import {parseStatement, statementTypes} from './statementFormats.js'

const validateStatementMetadata = ({statement, hash_b64, source_node_id }) => {
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
        return({error: "invalid sourceNodeId: " + sourceNodeId})
    }
    let proclaimed_publication_time = -1
    try {
        const millisecondsSince1970 = new Date(time).getTime()
        proclaimed_publication_time = millisecondsSince1970 / 1000.0
    } catch(error) {
        console.log(error)
    }
    if (!(proclaimed_publication_time > 0)){
        return({error: "invalid publication timestamp (unix epoch):" + proclaimed_publication_time})
    }
    let result = {content, domain, tags, type, content_hash_b64: hashUtils.sha256Hash(content), proclaimed_publication_time}
    if (type) {
        if([ statementTypes.domainVerification, statementTypes.poll, statementTypes.vote ].includes(type)) {
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
        const {domain, proclaimed_publication_time, tags, content_hash_b64, type, content } = validationResult
        console.log('proclaimed_publication_time', proclaimed_publication_time)
        if (validationResult.error) {
            resolve(validationResult)
        }
        console.log('check if exsits', hash_b64)
        const result = await db.statementExists({hash_b64})
        if (result.error){
            resolve(result)
            return
        }
        if (result.rows && result.rows.length > 0){
            resolve({log: 'statement exists already in db' + hash_b64})
            return
        }
        let verified = false
        let verifiedByAPI = false
        if (verification_method && verification_method === 'api'){
            console.log('validate via api', hash_b64)
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
                    dbResult = await db.createStatement({type, version: 1, domain, statement, proclaimed_publication_time, hash_b64, tags, content, content_hash_b64,
                        verification_method: (verifiedByAPI ? 'api' : 'dns'), source_node_id})
                    if(dbResult.error){
                        resolve(dbResult)
                        return
                    }
                    dbResult = await createVerification({statement_hash : dbResult.inserted.hash_b64, 
                        version: 1, domain, content})
                }
                if(type === statementTypes.poll){
                    dbResult = await db.createStatement({type, version: 1, domain, statement, proclaimed_publication_time, hash_b64, tags, content, content_hash_b64,
                        verification_method: (verifiedByAPI ? 'api' : 'dns'), source_node_id})
                }
                if (type === statementTypes.vote) {
                    dbResult = await db.createStatement({type, version: 1, domain, statement, proclaimed_publication_time, hash_b64, tags, content, content_hash_b64,
                        verification_method: (verifiedByAPI ? 'api' : 'dns'), source_node_id})
                    if(dbResult.error){
                        resolve(dbResult)
                        return
                    }
                    dbResult = await createVote({statement_hash: dbResult.inserted.hash_b64, domain, content})
                }
            } else {
                dbResult = await db.createStatement({type: statementTypes.statement, version: 1, domain, statement, proclaimed_publication_time, hash_b64, tags, content, content_hash_b64,
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
