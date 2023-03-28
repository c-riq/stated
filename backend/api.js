import express from 'express'


import db from './db.js'
import p2p from './p2p.js'
import ssl from './ssl.js'
import {getTXTEntries, validateAndAddStatementIfMissing} from './statementVerification.js'
import {getTXTEntriesDNSSEC} from './dnssec.js'

const log = false

var api = express.Router();
const apiVersion = '1'

api.use((req, res, next) => {
    log && console.log(req.body)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    next()
})

api.post("/get_txt_records", async (req, res, next) => {
    const records = await getTXTEntries(req.body.domain)
    if(records.error){
        next(records.error)
    } else {
        res.end(JSON.stringify({ records: records }))
    }
})


api.post("/submit_statement", async (req, res, next) => {
    const { statement, hash_b64, api_key } = req.body
    const dbResult = await validateAndAddStatementIfMissing({statement, hash_b64, verification_method: api_key ? 'api' : 'dns', api_key})
    if(dbResult?.error){
        next(dbResult.error)
    } else {
        log && console.log(dbResult)
        res.end(JSON.stringify({ insertedData: dbResult && dbResult.rows && dbResult.rows[0] }));
    }
})

api.get("/statements_with_details", async (req, res, next) => {
    let minId = req.query && req.query.min_id
    if(minId && minId.length > 0){
        minId = parseInt(minId)
    }
    log && console.log('minid', minId, typeof minId)
    const searchQuery = req.query && req.query.search_query
    const dbResult = await db.getStatementsWithDetail({minId, searchQuery})
    if(dbResult?.error){
        next(dbResult.error)
    } else {
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))       
    }
})

api.get("/statements", async (req, res, next) => {
    let minId = req.query && req.query.min_id
    if(minId && minId.length > 0){
        minId = parseInt(minId)
    }
    const dbResult = await db.getStatements({minId})
    if(dbResult?.error){
        next(dbResult.error)
    } else {
        let statements = dbResult.rows.map(({id, statement, hash_b64}) => ({id, statement, hash_b64}))
        res.end(JSON.stringify({statements, time: new Date().toUTCString()}))       
    }
})

api.post("/statement", async (req, res, next) => {
    const dbResult = await db.getStatement({hash_b64: req.body.hash_b64})
    if(dbResult?.error){
        next(dbResult?.error)
    } else {
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))       
    }
})

api.post("/verifications", async (req, res, next) => {
    const dbResult = await db.getVerificationsForStatement({hash_b64: req.body.hash_b64})
    if(dbResult?.error){
        next(dbResult?.error)
    } else {
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))       
    }
})

api.post("/joining_statements", async (req, res, next) => {
    const dbResult = await db.getJoiningStatements({hash_b64: req.body.hash_b64})
    if(dbResult?.error){
        next(dbResult.error)
    } else {
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))
    }
})

api.post("/votes", async (req, res, next) => {
    const dbResult = await db.getVotes({hash_b64: req.body.hash_b64})
    if(dbResult?.error){
        next(dbResult.error)
    } else {
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))
    }
})

api.get("/nodes", async (req, res, next) => {
    const dbResult = await db.getAllNodes()
    if(dbResult?.error){
        next(dbResult?.error)
    } else {
        res.end(JSON.stringify({domains: dbResult.rows.map(r=>r.domain)})) 
    }
})

api.post("/join_network", async (req, res, next) => {
    try {
        const r = await p2p.validateAndAddNode({domain: req.body.domain})
        if(r?.error){
            next(r?.error)
        } else {
            res.end(JSON.stringify(r))
        }
    } catch (error) {
        console.log(error)
        next(error)
    }
})

api.get("/health", async (req, res, next) => {
    const dbResult = await db.getAllNodes()
    if(dbResult?.error){
        next(dbResult?.error)
    } else {
        res.end(JSON.stringify({ apiVersion, application: "stated" }))
    }
})

api.get("/domain_ownership_beliefs", async (req, res, next) => {
    let domain = req.query && req.query.domain
    if(!domain || domain.length == 0){
        next({error: "missing parameter: domain"})
        return
    }
    const dbResult = await db.getDomainOwnershipBeliefs({domain})
    if(dbResult?.error){
        next(dbResult.error)
    } else {
        res.end(JSON.stringify({result: dbResult.rows}))       
    }
})

api.get("/get_ssl_ov_info", async (req, res, next) => {
    let domain = req.query && req.query.domain
    if(!domain || domain.length == 0){
        next({error: "missing parameter: domain"})
        return
    }
    const result = await ssl.getOVInfoForSubdomains({domain})
    if(result?.error){
        next(result.error)
    } else {
        res.end(JSON.stringify({result}))       
    }
})

api.get("/check_dnssec", async (req, res, next) => {
    let domain = req.query && req.query.domain
    if(!domain || domain.length == 0){
        next({error: "missing parameter: domain"})
        return
    }
    const result = await getTXTEntriesDNSSEC({domain, strict: false})
    if(result?.error){
        next(result.error)
    } else {
        res.end(JSON.stringify({validated: result.validated, trust: result.trust, domain}))       
    }
})

api.get("/match_domain", async (req, res, next) => {
    let domain_substring = req.query && req.query.domain_substring
    if(!domain_substring || domain_substring.length == 0){
        next({error: "missing parameter: domain"})
        return
    }
    const dbResult = await db.matchDomain({domain_substring})
    if(dbResult?.error){
        next(dbResult.error)
    } else {
        res.end(JSON.stringify({result: dbResult.rows}))       
    }
})

export default api

