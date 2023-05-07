import express from 'express'
import bodyParser from 'body-parser'
import http from 'http'
import https from 'https'
import fs from 'fs'

import {humanReadableEndpoints} from './humanReadableEndpoints.js'
import api from './api.js'

import { dirname } from 'path';
import { fileURLToPath } from 'url';

import p2p from './p2p.js'
import retryAndCleanUp from './retryAndCleanUp.js'
import updateIdentityBeliefs from './updateIdentityBeliefs.js'

p2p.setupSchedule()
retryAndCleanUp.setupSchedule()
//updateIdentityBeliefs.setupSchedule()

const __dirname = dirname(fileURLToPath(import.meta.url));

const prod = process.env.NODE_ENV === "production"
const ownDomain = process.env.DOMAIN
const port = parseInt(process.env.PORT || '7766')
const certPath = process.env.SSL_CERT_PATH

const app = express();

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

app.use("/api",api)

app.use("/own",humanReadableEndpoints)

app.use("/", express.static(__dirname + '/public/'));
app.get("/files/*", (req, res) =>{
    console.log("could not find file " + req.path)
    res.status(404);
    res.send("File not found")}
);
app.get("*", (req,res)=>{
    res.sendFile(__dirname + '/public/index.html')
});

app.use((err, req, res, next) => {
    console.log(err)
    res.status(500);
    res.send("Server Error." + err)
});

http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80);

if (prod) {
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
