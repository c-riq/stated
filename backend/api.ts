import express from 'express'

import {matchDomain, getStatement, getStatements, getStatementsWithDetail, 
    getOrganisationVerificationsForStatement, getVerificationsForDomain,
    getPersonVerificationsForStatement, getJoiningStatements, getAllNodes,
    getVotes
} from './database'
import p2p from './p2p'
import {getOVInfoForSubdomains} from './ssl'
import {getTXTEntries, validateAndAddStatementIfMissing} from './statementVerification'
import {getTXTEntriesDNSSEC} from './dnssec'

import {saveFile} from './upload'

const log = false

var api = express.Router();
const apiVersion = '1'

api.use((req, res, next) => {
    log && console.log(req.body)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    next()
})

api.post("/txt_records", async (req, res, next) => {
    try {
        const records = await getTXTEntries(req.body.domain)
        res.end(JSON.stringify({ records: records }))
    } catch (error) {
        next(error)
    }
})


api.post("/submit_statement", async (req, res, next) => {
    try {
        const { statement, hash, api_key } = req.body
        if(!statement) return next(new Error('Statement missing'))
        if(!hash) return next(new Error('Statement hash missing'))
        if(statement.length > 1499) return next(new Error('Statements cannot be longer than 1500 characters'))
        const dbResult = await validateAndAddStatementIfMissing({statement, hash_b64: hash, 
            verification_method: api_key ? 'api' : 'dns', api_key})
            log && console.log(dbResult)
            res.end(JSON.stringify(dbResult));
        }
    catch (error) {
        next(error)
    }
})

api.get("/statements_with_details", async (req, res, next) => {
    try {
        const minIdStr = req.query && req.query.min_id
        let minId = '0'
        // @ts-ignore
        if(minIdStr && minIdStr.length > 0){
            minId = '' + parseInt(minId)
        }
        log && console.log('minid', minId, typeof minId)
        const searchQuery = req.query && req.query.search_query
        const dbResult = await getStatementsWithDetail({minId, searchQuery})
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))       
    } catch (error) {
        next(error)
    }
})

api.get("/statements", async (req, res, next) => {
    let minId = '0'
    try { 
        // @ts-ignore
        if ((req.query.min_id && req.query.min_id.length) > 0){
            // @ts-ignore
            minId = '' + (parseInt(req.query.min_id) || 0)
        }
        // @ts-ignore
        const dbResult = await getStatements({minId, onlyStatementsWithMissingEntities: false})
        let statements = dbResult.rows.map(({id, statement, hash_b64}) => ({id, statement, hash_b64}))
        res.end(JSON.stringify({statements, time: new Date().toUTCString()}))       
    } catch(error) {
        next(error)
    }
})

api.get("/statement", async (req, res, next) => {
    try {
        const dbResult = await getStatement({hash_b64: req.query.hash})
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))       
    }catch(error){
        next(error)
    }
})

api.get("/organisation_verifications", async (req, res, next) => {
    try {
        const dbResult = await getOrganisationVerificationsForStatement({hash_b64: req.query.hash})
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))       
    } catch(error){
        next(error)
    }
})

api.get("/domain_verifications", async (req, res, next) => {
    try {
        const dbResult = await getVerificationsForDomain({domain: req.query.domain})
        res.end(JSON.stringify({result: dbResult.rows, time: new Date().toUTCString()}))       
    } catch(error){
        next(error)
    }
})

api.get("/person_verifications", async (req, res, next) => {
    try {
        const dbResult = await getPersonVerificationsForStatement({hash_b64: req.query.hash})
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))       
    } catch(error){
        next(error)
    }
})

api.get("/joining_statements", async (req, res, next) => {
    try {
        const dbResult = await getJoiningStatements({hash_b64: req.query.hash})
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))
    } catch(error){
        next(error)
    }
})

api.get("/votes", async (req, res, next) => {
    try {
        const dbResult = await getVotes({hash_b64: req.query.hash})
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))
    } catch(error){
        next(error)
    }
})

api.get("/nodes", async (req, res, next) => {
    try {
        const dbResult = await getAllNodes()
        res.end(JSON.stringify({domains: dbResult.rows.map(r=>r.domain)})) 
    } catch(error){
        next(error)
    }
})

api.post("/join_network", async (req, res, next) => {
    log && console.log('join_network request', req.body)
    try {
        const r = await p2p.validateAndAddNode({domain: req.body.domain})
        res.end(JSON.stringify(r))
    } catch (error) {
        console.log(error)
        next(error)
    }
})

api.get("/health", async (req, res, next) => {
    try {
        const dbResult = await getAllNodes()
        res.end(JSON.stringify({ apiVersion, application: "stated" }))
    } catch(error){
        next(error)
    }
})

api.get("/ssl_ov_info", async (req, res, next) => {
    try {
        let domain = req.query && req.query.domain
        let cacheOnly = req.query && req.query.cache_only
        if(!domain || domain.length == 0){
            throw(Error("missing parameter: domain"))
        }
        const result = await getOVInfoForSubdomains({domain, cacheOnly})
        res.end(JSON.stringify({result}))
    } catch (error) {
        next(error)
    }
})

api.get("/check_dnssec", async (req, res, next) => {
    try {
        let domain = req.query && req.query.domain
        if(!domain || domain.length == 0){
            throw(Error("missing parameter: domain"))
        }
        const result = await getTXTEntriesDNSSEC({domain, strict: false})
        res.end(JSON.stringify({validated: result.validated, trust: result.trust, domain}))       
    } catch (error) {
        console.log(error)
        next(error)
    }
})

api.get("/match_domain", async (req, res, next) => {
    try {
        let domain_substring = req.query && req.query.domain_substring
        if(!domain_substring || domain_substring.length == 0){
            next(Error("missing parameter: domain"))
            return
        }
        const dbResult = await matchDomain({domain_substring})
        res.end(JSON.stringify({result: dbResult.rows}))       

    } catch (error) {
        console.log(error)
        next(error)
    }
})

api.post("/upload_pdf", async (req, res, next) => {
    const result = await saveFile(req)
    if (!result || !result.error){
        res.send(result)
    } else {
        next(result)
    }
})

export default api

