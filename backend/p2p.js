
import axios from 'axios'

import {p2p_seed} from './p2p_seed.js'
import db from './db.js'
import {validateAndAddStatementIfMissing} from './statementVerification.js'

const ownDomain = process.env.DOMAIN

const validateAndAddNode = (d) => new Promise((resolve, reject) => {
    // sql injection; running stated?
    if ( !d.match(/stated\./)
        || (d.match(/\./g).length > 4)
        || d.match(/[\/&\?]/g)
        || db.forbiddenChars(d)
    ) {
        resolve({error: 'invalid domain, should be analogous to stated.example.com'})
        return
    }
    let url = 'https://' + d + '/api/health'
    console.log('checkNode', url)
    axios.get(url)
        .then((res) => {
            try {
                // console.log(res.request.res.socket.getPeerCertificate(false).infoAccess['OCSP - URI'])
                // console.log(res.request.res.socket.getPeerCertificate(false).fingerprint)
                // console.log(res.request.socket.remoteAddress)
                console.log(res.data)
                if(res.data.application == 'stated'){
                    db.addNode(d)
                        .then(r => resolve(r))
                        .catch(error => resolve({error}))
                } else {
                    resolve({error: 'health check failed on ' + d})
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
                const res = await Promise.all(json.data.domains.map(dd=>validateAndAddNode(dd)))
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
        || db.forbiddenChars(d)
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

const fetchMissingStatementsFromNode = (n) => new Promise((resolve, reject) => {
    let url = 'https://' + n.domain + '/api/statements?min_id=' + (n.last_received_statement_id || 0)
    console.log('fetch statements from ', url)
    axios.get(url)
        .then((json) => {
            try {
                console.log(json.data)
                console.log(json.data.statements)
                Promise.all(json.data.statements.map(s => {
                    validateAndAddStatementIfMissing({...s, source_node_id: n.id})
                }))
                    .then(
                        async r=>{
                            let lastReceivedStatementId = Math.max(...json.data.statements.map(s => s.id))
                            if (lastReceivedStatementId >= 0) {
                                await db.setLastReceivedStatementId({domain: n.domain, lastReceivedStatementId})
                            }
                            resolve(r)
                        }
                    ).catch(error=>reject({error}))
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

const addSeedNodes = async () => {
    const res = await Promise.all(p2p_seed.domains.map(d => validateAndAddNode(d)))
    console.log(res)
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

(async () => {
    try {
        //await addSeedNodes()
        //await addNodesOfPeers()
        //await joinNetwork()
        //await fetchMissingStatementsFromNodes()
    } catch (e) {
        console.log(e)
    }
})()

setInterval(async () => {
    try {
        //await fetchMissingStatementsFromNodes()
    } catch (e) {
        console.log(e)
    }
}, 20 * 1000)

export default {
    validateAndAddNode
}

// some broad cast algorithm to propagate statements through network

