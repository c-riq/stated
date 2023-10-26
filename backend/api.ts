import express from 'express'

import {matchDomain, getStatement, getStatements, getStatementsWithDetail, 
    getOrganisationVerificationsForStatement, getVerificationsForDomain,
    getPersonVerificationsForStatement, getJoiningStatements, getAllNodes,
    getVotes, checkIfMigrationsDone, deleteStatement, matchName, getLogsForStatement, getHiddenStatement
} from './database'
import p2p from './p2p'
import {getOVInfoForSubdomains} from './ssl'
import {getTXTEntries, validateAndAddStatementIfMissing, verifyViaStaticTextFile} from './statementVerification'
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

api.get("/txt_records", async (req, res, next) => {
    try {
        const records = await getTXTEntries(req.query.domain)
        res.end(JSON.stringify({ records: records }))
    } catch (error) {
        next(error)
    }
})

api.post("/check_static_statement", async (req, res, next) => {
    try {
        const { statement, hash, domain } = req.body
        const result = await verifyViaStaticTextFile({statement, hash, domain})
        res.end(JSON.stringify(result))
    }
    catch(error){
        next(error)
    }
})

api.post("/statements", async (req, res, next) => {
    try {
        const { statement, hash, api_key, hidden } = req.body
        if(!statement) return next(new Error('Statement missing'))
        if(!hash) return next(new Error('Statement hash missing'))
        if(statement.length > 1499) return next(new Error('Statements cannot be longer than 1500 characters'))
        const dbResult = await validateAndAddStatementIfMissing({statement, hash_b64: hash, 
            verification_method: api_key ? 'api' : 'dns', api_key, hidden})
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
    let minId = 0
    let n = 50
    try { 
        // @ts-ignore
        if ((req.query.min_id && req.query.min_id.length) > 0){
            // @ts-ignore
            minId = parseInt(req.query.min_id) || 0
        }
        // @ts-ignore
        if ((req.query.n && req.query.n.length) > 0){
            // @ts-ignore
            n = parseInt(req.query.n) || 50
        }
        const domain = req.query && req.query.domain
        // @ts-ignore
        const dbResult = await getStatements({minId, onlyStatementsWithMissingEntities: false, domain, n})
        let statements = dbResult.rows.map(({id, statement, hash_b64, verification_method}) => ({id, statement, hash_b64, verification_method}))
        res.end(JSON.stringify({statements, time: new Date().toUTCString()}))       
    } catch(error) {
        next(error)
    }
})

api.get("/statements/:hash", async (req, res, next) => {
    try {
        const hash_b64 = req.params.hash
        let dbResult = await getStatement({hash_b64})
        if (dbResult.rows.length == 0){
            dbResult = await getHiddenStatement({hash_b64})
        }
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))       
    } catch(error){
        next(error)
    }
})
api.delete("/statements/:hash", async (req, res, next) => {
    try {
        const hash_b64 = req.params.hash
        const { api_key } = req.body 
        if(!api_key || (api_key !== process.env.API_KEY)) {
            res.status(401)
            return res.end("Invalid API key")
        }
        const dbResult = await deleteStatement({hash_b64})
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))       
    } catch(error){
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

api.get("/verification_logs", async (req, res, next) => {
    try {
        const dbResult = await getLogsForStatement({hash_b64: req.query.hash})
        res.end(JSON.stringify({result: dbResult.rows, time: new Date().toUTCString()}))       
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
        res.end(JSON.stringify({result: dbResult.rows})) 
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
        if(!checkIfMigrationsDone()){
            throw(Error("Migrations not done yet"))
        }
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

api.get("/match_subject_name", async (req, res, next) => {
    try {
        let name_substring = req.query && req.query.name_substring
        if(!name_substring || name_substring.length == 0){
            next(Error("missing parameter: name_substring"))
            return
        }
        const dbResult = await matchName({name_substring})
        res.end(JSON.stringify({result: dbResult.rows}))       

    } catch (error) {
        console.log(error)
        next(error)
    }
})

api.post("/upload_pdf", async (req, res, next) => {
    try {
        const result = await saveFile(req)
        if (result){
            res.send(result)
            return
        } else {
            next('could not save file')
        }
    } catch (error) {
        next(error)
    }
})

export default api
