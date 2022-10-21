const express = require('express')
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http')
const https = require('https')

const fs = require('fs');
const axios = require('axios').default;
const fse = require('fs-extra')

const db = require('./db');
const p2p = require('./p2p');
const hash = require('./hash');
const domainVerification = require('./domainVerification');

const prod = process.env.NODE_ENV === "production"
const ownDomain = process.env.DOMAIN

const directories = { "log": "./log" }

const apiVersion = '1'

const createDirectories = () => {
    for (let [key, value] of Object.entries(directories)) {
        if (!fs.existsSync(value)) {
            fs.mkdirSync(value);
        }
    }
}
createDirectories()

// don't share unvalidated information


const app = express.Application = express();

app.disable('x-powered-by')

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.all('/*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "*")
    res.header("Access-Control-Allow-Methods", "*")
    next();
});
app.options('/*', function (req, res, next) {
    res.status(200).send();
});
app.post("/api/get_txt_records", (req, res, next) => {
    try {
        console.log(req.body)
        if ('domain' in req.body) {
            fs.writeFile(directories.log + "/" + (new Date()).getTime() + '-' + Math.random() + '.json', JSON.stringify(req.body, null, 4), () => {
                console.log(req.body)
                checkDomain(req.body.domain)
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


app.post("/api/submit_statement", async (req, res, next) => {
    try {
        const { content, hash, domain, time, statement, type, content_hash } = req.body
        console.log("req.body",req.body)
        if (hash.verify(req.body.statement, req.body.hash)) {
            txtCorrect = await verifyTXTRecord("stated." + req.body.domain, req.body.hash)
            console.log("txtCorrect", txtCorrect)
            if (txtCorrect) {
                try {
                    var dbResult = {}
                    if (type === "statement") {
                        dbResult = await db.createStatement({type, version: 1, domain, statement, time, 
                        hash_b64: hash, content, content_hash, verification_method: 'dns'})
                        if(dbResult?.error){
                            throw dbResult?.error
                        }
                    }
                    if (type === "domain_verification") {
                        dbResult = await domainVerification.createVerificationAndStatement({type, version: 1, domain, statement, time, 
                            hash_b64: hash, content, content_hash})
                        if(dbResult?.error){
                            throw dbResult?.error
                        }
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



app.get("/api/statements", async (req, res, next) => {
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
app.post("/api/statement", async (req, res, next) => {
    try {
        const dbResult = await db.getStatement(req.body.hash_b64)
        if(dbResult?.error){
            throw dbResult?.error
        }
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))       
    } catch (err) {
        return next(err);
    }
});
app.post("/api/verifications", async (req, res, next) => {
    try {
        console.log(req.body.domain, req.body)
        const dbResult = await db.getVerifications(req.body.hash_b64)
        if(dbResult?.error){
            throw dbResult?.error
        }
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))       
    } catch (err) {
        return next(err);
    }
});
app.post("/api/joining_statements", async (req, res, next) => {
    try {
        console.log(req.body.content_hash, req.body)
        const dbResult = await db.getJoiningStatements(req.body.hash_b64)
        if(dbResult?.error){
            throw dbResult?.error
        }
        res.end(JSON.stringify({statements: dbResult.rows, time: new Date().toUTCString()}))       
    } catch (err) {
        return next(err);
    }
});
app.get("/statements|statements.txt", async (req, res, next) => {
    try {
        const dbResult = await db.getStatements()
        if(dbResult?.error){
            throw dbResult?.error
        }
        res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
        res.end(dbResult.rows.map(r=>r.statement).join("\n\n"))       
    } catch (err) {
        return next(err);
    }
});
app.get("/statement/:hex", async (req, res, next) => {
    console.log(req.params)
    try {
        const hex = req.params.hex
        const b64 = hash.hexToB64(hex)
        console.log(b64, ownDomain)
        const dbResult = await db.getOwnStatement(b64, ownDomain)
        if(dbResult?.error){
            throw dbResult?.error
        }
        res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
        res.end(dbResult.rows.map(r=>r.statement).join("\n\n"))       
    } catch (err) {
        return next(err);
    }
});
app.get("/verifications|verifications.txt", async (req, res, next) => {
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
app.get("/nodes|nodes.txt", async (req, res, next) => {
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
app.get("/api/nodes", async (req, res, next) => {
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
app.post("/api/join_network", async (req, res, next) => {
    try {
        console.log(req.body)
        const r = await p2p.validateAndAddNode(req.body.domain)
        if (r.error) {
            next(r.error)
        } else {
            res.end(JSON.stringify(r))
        }
    } catch (err) {
        return next(err);
    }
});

app.get("/api/health", async (req, res, next) => {
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

app.use("/", express.static(__dirname + '/public/'));
app.get("*", (req,res)=>{
    res.sendFile(__dirname + '/public/index.html')
});

app.use((err, req, res, next) => {
    console.log(err)
    res.status(500);
    res.send("Server Error." + err)
});

const httpServer = http.createServer(app);

if (prod) {

    let credentials = {}
    if (ownDomain == 'gritapp.info') {
        let privateKey = fs.readFileSync('/etc/letsencrypt/live/stated.gritapp.info/privkey.pem', 'utf8');
        let certificate = fs.readFileSync('/etc/letsencrypt/live/stated.gritapp.info/cert.pem', 'utf8');
        let ca = fs.readFileSync('/etc/letsencrypt/live/stated.gritapp.info/fullchain.pem', 'utf8');
        credentials = {
            key: privateKey,
            cert: certificate,
            ca: ca
        }
    } else {
        let privateKey = fs.readFileSync('/etc/letsencrypt/live/stated.rixdata.net/privkey.pem', 'utf8');
        let certificate = fs.readFileSync('/etc/letsencrypt/live/stated.rixdata.net/cert.pem', 'utf8');
        let ca = fs.readFileSync('/etc/letsencrypt/live/stated.rixdata.net/fullchain.pem', 'utf8');
        credentials = {
            key: privateKey,
            cert: certificate,
            ca: ca
        }
    }
    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(443, () => {
        console.log('HTTPS Server running on port 443');
    });
    httpsServer.on('error', function (err) { console.log(err) });

} else {
    const httpServer = http.createServer(app);
    httpServer.listen(7766);
}
