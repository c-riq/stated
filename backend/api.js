var express = require('express');


const db = require('./db');
const p2p = require('./p2p');
const hashUtils = require('./hash');
const statementVerification = require('./statementVerification');


var api = express.Router();
const apiVersion = '1'

api.use((req, res, next) => res.setHeader('Content-Type', 'application/json'))

api.post("/get_txt_records", (req, res, next) => {
    try {
        console.log(req.body)
        if ('domain' in req.body) {
            fs.writeFile(directories.log + "/" + (new Date()).getTime() + '-' + Math.random() + '.json', JSON.stringify(req.body, null, 4), () => {
                console.log(req.body)
                statementVerification.getTXTEntries(req.body.domain)
                    .then(records => {
                        res.end(JSON.stringify({ records: records }));
                    })
                    .catch(next);
            })
        }
    } catch (err) {
        return next(err);
    }
})


api.post("/submit_statement", async (req, res, next) => {
    const { content, hash, domain, time, statement, type, content_hash } = req.body
    console.log("req.body",req.body)
    const dbResult = await statementVerification.validateAndAddStatementIfMissing({type, version: 1, domain, statement, time, 
                        hash_b64: hash, content, content_hash, verification_method: 'dns'})
    if(dbResult?.error){
        res.status(400).send({message: dbResult.error})
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ insertedData: dbResult }));
})

api.get("/statements", async (req, res, next) => {
    console.log(req.query)
    try {
        const minId = req.query && req.query.min_id
        const dbResult = await db.getStatements({minId})
        if(dbResult?.error){
            throw dbResult?.error
        }
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))       
    } catch (err) {
        return next(err);
    }
})

api.post("/statement", async (req, res, next) => {
    try {
        const dbResult = await db.getStatement({hash_b64: req.body.hash_b64})
        if(dbResult?.error){
            throw dbResult?.error
        }
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))       
    } catch (err) {
        return next(err);
    }
})

api.post("/verifications", async (req, res, next) => {
    try {
        console.log(req.body.domain, req.body)
        const dbResult = await db.getVerifications({hash_b64: req.body.hash_b64})
        if(dbResult?.error){
            throw dbResult?.error
        }
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))       
    } catch (err) {
        return next(err);
    }
})

api.post("/joining_statements", async (req, res, next) => {
    const dbResult = await db.getJoiningStatements({hash_b64: req.body.hash_b64})
    if(dbResult?.error){
        next(dbResult.error)
    }
    res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))       
})

api.get("/nodes", async (req, res, next) => {
    try {
        const dbResult = await db.getAllNodes()
        if(dbResult?.error){
            throw dbResult?.error
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({domains: dbResult.rows.map(r=>r.domain)})) 
    } catch (err) {
        return next(err);
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
