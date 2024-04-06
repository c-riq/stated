import express from 'express'
import bodyParser from 'body-parser'
import http from 'http'
import https from 'https'
import fs from 'fs'

import { humanReadableEndpoints } from './humanReadableEndpoints'
import api from './api'

import p2p from './p2p'
import retryAndCleanUp from './retryAndCleanUp'
import verificationLog from './verificationLog'
import cloudStorage from './cloudStorage'

import { fetchOVInfoForMostPopularDomains } from './prefillOV'

process.on('unhandledRejection', (error, promise) => {
    // @ts-ignore
    console.log('Unhandled Rejection at: Promise', promise, 'reason:', error, error.stack);
});

const prod = process.env.NODE_ENV === "production"
const port = parseInt(process.env.PORT || '7766')
const certPath = process.env.SSL_CERT_PATH
const pullIntervalSeconds = parseFloat(process.env.PULL_INTERVAL_SECONDS || '20')
const logIntervalSeconds = parseFloat(process.env.LOG_INTERVAL_SECONDS || `${60 * 60}`)
const retryIntervalSeconds = parseFloat(process.env.RETRY_INTERVAL_SECONDS || '7')
const prefillSSLOVInfo = (!!process.env.PREFILL_SSL_OV_INFO)
const enableVerificationLog = (!!process.env.VERIFICATION_LOG)
const enableRetry = (process.env.RETRY === 'false') ? false : true
const test = (!!process.env.TEST);
const s3BucketExists = !!process.env.S3_BUCKET;

(async () => {
    if (test) {
        setInterval(async () => {
            await p2p.addSeedNodes()
        }, 1000 * pullIntervalSeconds)
    }
    await p2p.addSeedNodes()
})()
p2p.setupSchedule(pullIntervalSeconds)
if(enableRetry) retryAndCleanUp.setupSchedule(retryIntervalSeconds)
if(prefillSSLOVInfo) fetchOVInfoForMostPopularDomains()
if(enableVerificationLog) verificationLog.setupSchedule(logIntervalSeconds)
s3BucketExists && cloudStorage.setupSchedule(5000)

const app = express();

app.get("/files/*",  async (req, res, next) =>{
    if (!s3BucketExists) {
        return next()
    }
    const cloudUrl = await cloudStorage.getCloudStorageUrl(req.path.replace("/files/",""))
    if(cloudUrl){
        res.header("Content-Type", "application/pdf")
        res.header("Content-Disposition", "inline")
        res.redirect('' + cloudUrl)
    } else {
        next()
    }
});
app.use("/", express.static(__dirname + '/public/'));
app.disable('x-powered-by')
app.all('/*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "*")
    res.header("Access-Control-Allow-Methods", "*")
    next();
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.options('/*', function (req, res, next) {
    res.status(200).send();
});

app.use("/api",api)

app.all([
    "/statements$|/statements/$|statements.txt",
    "/text/statements/:hash",
    "/verifications|verifications.txt",
    "/nodes|nodes.txt",
],humanReadableEndpoints)

app.get("/files/*", (req, res) =>{
    console.log("could not find file " + req.path)
    res.status(404);
    res.send("File not found")}
);
app.get("/static/*", (req, res) =>{
    console.log("could not find file " + req.path)
    res.status(404);
    res.send("File not found")}
);
app.get("*", (req,res)=>{
    res.sendFile(__dirname + '/public/index.html')
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log(err)
    res.status(500);
    let message = "unknown error"
    if (err) {
        if (err.message || err.error) {
            message = (err.message || err.error) + '; ' + (err.stack ? err.stack : '')
        } else {
            try {
                message = JSON.stringify(err)
            }
            catch (e) {
                console.log(e)
            }
        }
    }
    res.send("Server Error: " + message)
});



if (prod) {
    
    http.createServer(function (req, res) {
        res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
        res.end();
    }).listen(80);

    const privateKey = fs.readFileSync(certPath + 'privkey.pem', 'utf8');
    const certificate = fs.readFileSync(certPath + 'cert.pem', 'utf8');
    const ca = fs.readFileSync(certPath + 'fullchain.pem', 'utf8');
    const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca
    }
    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(443, () => {
        console.log('HTTPS Server running on port 443');
    });
    httpsServer.on('error', function (err) { console.log(err) });
} else {
    const httpServer = http.createServer(app);
    httpServer.listen(port);
}
