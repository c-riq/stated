
import {p2p_seed} from './p2p_seed.js'
import db from './db.js'
import {validateAndAddStatementIfMissing} from './statementVerification.js'
import { forbiddenChars } from './statementFormats.js'

import https from 'https'

const get = ({hostname, path}) => new Promise((resolve, reject) => {
    let cert = {}
    let ip = ''
    const options = {
        hostname: hostname,
        protocol: 'https',
        path: path,
        method: 'GET',
    }
    const req = https.request(options, res => {  
        let data = ''
        res.on('data', chunk => {
            cert = res.req.socket.getPeerCertificate()
            ip = res.req.socket.remoteAddress
            data += chunk
        })
        res.on('end', () => {
            try {
                data = JSON.parse(data)
                resolve({data, cert, ip})
            } catch(error) {
                resolve({error})
            }
        })
    })
    req.on('error', (error) => resolve({error}))
    req.end()
})

const post = ({hostname, path, data}) => new Promise((resolve, reject) => {
    const options = {
        hostname: hostname,
        protocol: 'https',
        path: path,
        method: 'POST',
    }
    const req = https.request(options, res => {  
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
            try {
                data = JSON.parse(data)
                resolve({data, cert, ip})
            } catch(error) {
                resolve({error})
            }
        })
    })
    req.on('error', (error) => resolve({error}))
    req.end()
})

const ownDomain = process.env.DOMAIN

const validateAndAddNode = ({domain}) => new Promise((resolve, reject) => {
    // sql injection; running stated?
    if ( !domain.match(/stated\./)
        || (domain.match(/\./g).length > 4)
        || domain.match(/[\/&\?]/g)
        || forbiddenChars(domain)
    ) {
        resolve({error: 'invalid domain, should be analogous to stated.example.com'})
        return
    }
    let url = 'https://' + domain + '/api/health'
    console.log('checkNode', url)
    axios.get(url)
        .then((res) => {
            try {
                console.log(res.data)
                if(res.data.application == 'stated'){
                    db.addNode({domain})
                        .then(r => resolve(r))
                        .catch(error => resolve({error}))
                } else {
                    resolve({error: 'health check failed on ' + domain})
                }
            }
            catch(error) {
                resolve({error})
            }
        })
        .catch((error) => {
            console.log(error);
            resolve({error})
        })
})
const addNodesOfPeer = (d) => new Promise((resolve, reject) => {
    let url = 'https://' + d + '/api/nodes'
    console.log('get nodes from', url)
    axios.get(url)
        .then( async (json) => {
            try {
                console.log(json.data.domains, 'json.data.domains')
                const res = await Promise.all(json.data.domains.map(dd=>validateAndAddNode({domain: dd})))
                resolve({domain: d, ...res['0']})
            }
            catch(error) {
                resolve({error})
            }
        })
        .catch((error) => {
            console.log(error);
            resolve({error})
        })
})
const addNodesOfPeers = async () => {
    const dbResult = await db.getAllNodes()
    if(dbResult?.error){
        throw dbResult.error
    }
    const domains = dbResult.rows.map(r=>r.domain)
    const result = await Promise.all(domains.map(d=>addNodesOfPeer(d)))
    if(result?.error){
        throw result.error
    }
    console.log(result)
}

const sendJoinRequest = (d) => new Promise((resolve, reject) => {
    if (!ownDomain) {
        resolve({error: 'no ownDomain defined'})
        return
    }    
    if ( !d.match(/stated\./)
        || (d.match(/\./g).length > 4)
        || d.match(/[\/&\?]/g)
        || forbiddenChars(d)
    ) {
        resolve({error: 'invalid domain, should be analogous to stated.example.com'})
        return
    }
    let url = 'https://' + d + '/api/join_network/'
    console.log('sendJoinRequest', url)
    axios({
        method: "POST",
        url, headers: { 'Content-Type': 'application/json'},
        data: { domain: 'stated.' + ownDomain }})
        .then(async (json) => {
            try {
                console.log(json.data, 'result from ', d)
                resolve({result: json.data})
            }
            catch(error) {
                resolve({error})
            }
        })
        .catch((error) => {
            console.log(error);
            resolve({error})
        })
})
const joinNetwork = async () => {
    const dbResult = await db.getAllNodes()
    if(dbResult?.error){
        throw dbResult.error
    }
    const domains = dbResult.rows.map(r=>r.domain)
    const result = await Promise.all(domains.map(d=>sendJoinRequest(d)))
    console.log(result)
}

const fetchMissingStatementsFromNode = (n) => new Promise(async (resolve, reject) => {
    console.log('fetch statements from ', n.domain)
    try {
        const res = await get({hostname: n.domain, path: '/api/statements?min_id=' + (n.last_received_statement_id || 0)})
        if (res.error){
            console.log(res.error)
        }
        const {cert, ip} = res
        const certificateAuthority = cert && cert.infoAccess && cert.infoAccess['OCSP - URI'] && ''+cert.infoAccess['OCSP - URI'][0]
        const fingerprint = cert && ''+cert.fingerprint
        Promise.all(res.data.statements.map(s => {
            validateAndAddStatementIfMissing({...s, source_node_id: n.id})
        }))
        .then(
            async r=>{
                let lastReceivedStatementId = Math.max(...res.data.statements.map(s => s.id), n.last_received_statement_id)
                if (lastReceivedStatementId >= 0) {
                    console.log('db.updateNode', lastReceivedStatementId, certificateAuthority, fingerprint, ip)
                    await db.updateNode({domain: n.domain, lastReceivedStatementId, certificateAuthority, fingerprint, ip})
                }
                resolve(r)
            }
        ).catch(error=>reject({error}))
    }
    catch (error){
            console.log(error)
            resolve({error})
    }
})

const addSeedNodes = async () => {
    console.log(p2p_seed, 'p2p_seed')
    try {
        const res = await Promise.all(p2p_seed.map(d => validateAndAddNode({domain: d})))
        console.log(res)
    } catch (error) {
        console.log(error)
    }
}

const fetchMissingStatementsFromNodes = async () => {
    const dbResult = await db.getAllNodes()
    if(dbResult?.error){
        throw dbResult.error
    }
    const nodes = dbResult.rows
    const res = await Promise.all(nodes.map(n=>fetchMissingStatementsFromNode(n)))
    console.log(res)
}

setTimeout(async () => {
    try {
        await addSeedNodes()
        await addNodesOfPeers()
        await joinNetwork()
        await fetchMissingStatementsFromNodes()
    } catch (e) {
        console.log(e)
    }
}, 1000)

setInterval(async () => {
    try {
        await fetchMissingStatementsFromNodes()
    } catch (e) {
        console.log(e)
    }
}, 20 * 1000)

export default {
    validateAndAddNode
}

// some broad cast algorithm to propagate statements through network

