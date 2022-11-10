var express = require('express');


const db = require('./db');
const p2p = require('./p2p');
const hashUtils = require('./hash');
const statementVerification = require('./statementVerification');


var api = express.Router();
const apiVersion = '1'

api.use((req, res, next) => {
    console.log(req.body)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    next()
})

api.post("/get_txt_records", async (req, res, next) => {
    const records = await statementVerification.getTXTEntries(req.body.domain)
    if(records.error){
        next(records.error)
    } else {
        res.end(JSON.stringify({ records: records }))
    }
})


api.post("/submit_statement", async (req, res, next) => {
    const { statement, hash_b64 } = req.body
    const dbResult = await statementVerification.validateAndAddStatementIfMissing({statement, hash_b64, verification_method: 'dns'})
    if(dbResult?.error){
        next(dbResult.error)
    } else {
        console.log(dbResult)
        res.end(JSON.stringify({ insertedData: dbResult }));
    }
})

api.get("/statements", async (req, res, next) => {
    const minId = req.query && req.query.min_id
    const searchQuery = req.query && req.query.search_query
    const dbResult = await db.getStatements({minId, searchQuery})
    if(dbResult?.error){
        next(dbResult.error)
    } else {
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))       
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
    const dbResult = await db.getVerifications({hash_b64: req.body.hash_b64})
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

api.get("/nodes", async (req, res, next) => {
    const dbResult = await db.getAllNodes()
    if(dbResult?.error){
        next(dbResult?.error)
    } else {
        res.end(JSON.stringify({domains: dbResult.rows.map(r=>r.domain)})) 
    }
})

api.post("/join_network", async (req, res, next) => {
    const r = await p2p.validateAndAddNode({domain: req.body.domain})
    if(r?.error){
        next(r?.error)
    } else {
        res.end(JSON.stringify(r))
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

module.exports = api;
