var express = require('express');


const db = require('./db');
const p2p = require('./p2p');
const hashUtils = require('./hash');
const statementVerification = require('./statementVerification');


var api = express.Router();
const apiVersion = '1'


api.post("/get_txt_records", (req, res, next) => {
    try {
        console.log(req.body)
        if ('domain' in req.body) {
            fs.writeFile(directories.log + "/" + (new Date()).getTime() + '-' + Math.random() + '.json', JSON.stringify(req.body, null, 4), () => {
                console.log(req.body)
                statementVerification.getTXTEntries(req.body.domain)
                    .then(records => {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ records: records }));
                        res.end()
                    })
                    .catch(next);
            })
        }
    } catch (err) {
        return next(err);
    }
});


api.post("/submit_statement", async (req, res, next) => {
    try {
        const { content, hash, domain, time, statement, type, content_hash } = req.body
        console.log("req.body",req.body)
        if (await hashUtils.verify(req.body.statement, req.body.hash)) {
            txtCorrect = await statementVerification.verifyTXTRecord("stated." + req.body.domain, req.body.hash)
            console.log("txtCorrect", txtCorrect)
            if (txtCorrect) {
                try {
                    var dbResult = await db.createStatement({type, version: 1, domain, statement, time, 
                        hash_b64: hash, content, content_hash, verification_method: 'dns'})
                    if(dbResult?.error){
                        throw dbResult?.error
                    }
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify({ insertedData: dbResult }));
                }
                catch (e){
                    console.log(e,"3")
                    res.status(500).send({
                        message: 'Could not save statement'
                     })
                }
            } else {
                return res.status(400).send({
                    message: 'Could not verify TXT records'
                })
            }
        } else {
            return res.status(400).send({
                message: 'Could not verify hash'
             })
        }
    } catch (err) {
        console.log(err)
        return res.status(400).send({
            message: 'Could not verify hash'
         })
    }
});



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
});
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
});
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
});
api.post("/joining_statements", async (req, res, next) => {
    try {
        console.log(req.body.content_hash, req.body)
        const dbResult = await db.getJoiningStatements({hash_b64: req.body.hash_b64})
        if(dbResult?.error){
            throw dbResult?.error
        }
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))       
    } catch (err) {
        return next(err);
    }
});
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
});
api.post("/join_network", async (req, res, next) => {
    try {
        console.log(req.body)
        const r = await p2p.validateAndAddNode({domain: req.body.domain})
        if (r.error) {
            next(r.error)
        } else {
            res.end(JSON.stringify(r))
        }
    } catch (err) {
        return next(err);
    }
});

api.get("/health", async (req, res, next) => {
    try {
        // check if database is working
        const dbResult = await db.getAllNodes()
        if(dbResult?.error){
            throw dbResult?.error
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ apiVersion, application: "stated" }));   
    } catch (err) {
        return next(err);
    }
});

module.exports = api;
