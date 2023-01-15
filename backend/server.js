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

p2p.setupSchedule()
retryAndCleanUp.setupSchedule()

const __dirname = dirname(fileURLToPath(import.meta.url));

const prod = process.env.NODE_ENV === "production"
const ownDomain = process.env.DOMAIN

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

app.use("/api",api)

app.use("/own",humanReadableEndpoints)

app.use("/", express.static(__dirname + '/public/'));
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
