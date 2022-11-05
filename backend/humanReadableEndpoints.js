var express = require('express');
const db = require('./db');

var humanReadableEndpoints = express.Router();

humanReadableEndpoints.get("/statements|statements.txt", async (req, res, next) => {
    try {
        const dbResult = await db.getStatements({minId: undefined})
        if(dbResult?.error){
            throw dbResult?.error
        }
        res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
        res.end(dbResult.rows.map(r=>r.statement).join("\n\n"))       
    } catch (err) {
        return next(err);
    }
});
humanReadableEndpoints.get("/statement/:hex", async (req, res, next) => {
    console.log(req.params)
    try {
        const hex = req.params.hex
        const hash_b64 = hashUtils.hexToB64(hex)
        console.log(hash_b64, ownDomain)
        const dbResult = await db.getOwnStatement({hash_b64, ownDomain})
        if(dbResult?.error){
            throw dbResult?.error
        }
        res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
        res.end(dbResult.rows.map(r=>r.statement).join("\n\n"))       
    } catch (err) {
        return next(err);
    }
});
humanReadableEndpoints.get("/verifications|verifications.txt", async (req, res, next) => {
    try {
        const dbResult = await db.getAllVerifications()
        if(dbResult?.error){
            throw dbResult?.error
        }
        res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
        res.end(dbResult.rows.map(r=>r.statement).join("\n\n"))       
    } catch (err) {
        return next(err);
    }
});
humanReadableEndpoints.get("/nodes|nodes.txt", async (req, res, next) => {
    try {
        const dbResult = await db.getAllNodes()
        if(dbResult?.error){
            throw dbResult?.error
        }
        res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
        res.end(dbResult.rows.map(r=>r.domain).join("\n\n"))       
    } catch (err) {
        return next(err);
    }
});

module.exports = humanReadableEndpoints;
