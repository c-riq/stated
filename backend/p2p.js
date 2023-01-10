
import { p2p_seed } from './p2p_seed.js'
import db from './db.js'
import { validateAndAddStatementIfMissing } from './statementVerification.js'
import { forbiddenChars } from './statementFormats.js'

import { get, post } from './request.js'

const ownDomain = process.env.DOMAIN

const validateAndAddNode = ({domain}) => new Promise(async (resolve, reject) => {
    if (! /^[a-zA-Z\.-]{7,260}$/.test(domain)) {
        resolve({error: 'invalid domain'})
        return
    }
    if (domain === 'stated.' + ownDomain) {
        resolve({error: 'skip validatin of own domain ' + domain})
        return
    }
    const res = await get({hostname: domain, path: '/api/health'})
    console.log(res, 'validateAndAddNode')
    if(res && res.data && res.data.application == 'stated'){
        const res = await db.addNode({domain})
        if (res.error){
            console.log(res.error)
            resolve({res})
        } else {
            resolve(res)
        }
    } else {
        resolve({error: 'health check failed on ' + domain})
    }
    resolve({res})
})

const addNodesOfPeer = ({domain}) => new Promise(async (resolve, reject) => {
    try {
        console.log('get nodes from', domain)
        const response = await get({hostname: domain, path: '/api/nodes'})
        const result = await Promise.all(response.data.domains.map(domain => validateAndAddNode({domain})))
        resolve(result)
    } catch(error) { resolve({error})}
})

const addNodesOfPeers = async () => {
    const dbResult = await db.getAllNodes()
    const domains = (dbResult.rows || []).map(row => row.domain)
    const result = await Promise.all(domains.map(domain => addNodesOfPeer({domain})))
    return result
}

const sendJoinRequest = ({domain}) => new Promise(async (resolve, reject) => {
    if (!ownDomain) {
        resolve({error: 'no ownDomain defined'}); return}    
    if ( !domain.match(/stated\./) || (domain.match(/\./g).length > 4) || domain.match(/[\/&\?]/g) || forbiddenChars(domain)) { 
        resolve({error: 'invalid domain, should be analogous to stated.example.com'})
        return
    }
    
    console.log('sendJoinRequest to ', domain)
    const res = await post({ hostname: domain, path: '/api/join_network/', data: { domain: 'stated.' + ownDomain }})
    resolve(res)
})
const joinNetwork = async () => {
    const dbResult = await db.getAllNodes()
    const domains = dbResult.rows.map(row => row.domain)
    const result = await Promise.all(domains.map(domain => sendJoinRequest({domain})))
    return result
}

const fetchMissingStatementsFromNode = ({domain, id, last_received_statement_id}) => new Promise(async (resolve, reject) => {
    console.log('fetch statements from ', domain)
    try {
        if (domain === 'stated.' + ownDomain) { resolve(); return }
        const res = await get({hostname: domain, path: '/api/statements?min_id=' + (last_received_statement_id || 0)})
        if (res.error){
            console.log(domain, res.error)
            console.trace()
        }
        const {cert, ip} = res
        const certificateAuthority = cert && cert.infoAccess && cert.infoAccess['OCSP - URI'] && ''+cert.infoAccess['OCSP - URI'][0]
        const fingerprint = cert && cert.fingerprint && cert.fingerprint.match(":") && ''+cert.fingerprint
        const res2 = await Promise.all(res.data.statements.map(s => { validateAndAddStatementIfMissing({...s, source_node_id: id})}))
        console.log(res2, 'res2')
        if(res2 && res2.length && res2.reduce((c,i) => c || (i && i.error)), false){
            const errors = res2.filter((i) => i.error)
            console.log(errors)
            resolve(errors)
        }
        // TODO: check if all statements were added already before updating last_received_statement_id
        let lastReceivedStatementId = Math.max(...res.data.statements.map(s => s.id), last_received_statement_id)
        if (lastReceivedStatementId >= 0) {
            await db.updateNode({domain: domain, lastReceivedStatementId, certificateAuthority, fingerprint, ip})
        }
        resolve(res2)
    }
    catch (error){
        console.log(error)
        console.trace()
        resolve({error})
    }
})

const addSeedNodes = async () => {
    console.log(p2p_seed, 'p2p_seed')
    try {
        const res = await Promise.all(p2p_seed.map(domain => validateAndAddNode({domain})))
    } catch (error) {
        console.log(error)
        console.trace()
    }
}

const fetchMissingStatementsFromNodes = async () => {
    const dbResult = await db.getAllNodes()
    const nodes = dbResult.rows
    const res = await Promise.all(nodes.map(node => 
        fetchMissingStatementsFromNode({domain: node.domain, id: node.id, last_received_statement_id: node.last_received_statement_id})))
    return res
}

setTimeout(async () => {
    try {
        const seedRes = await addSeedNodes()
        const addNodesRes = await addNodesOfPeers()
        const joinNetworkRes = await joinNetwork()
        const fetchStatmentsRes = await fetchMissingStatementsFromNodes();
        [seedRes, addNodesRes, joinNetworkRes, fetchStatmentsRes].map(i => {
            if(i && i.error){
                console.log(i.error)
                console.trace()
            }
            if(i && i.length > 0){
                for(let j of i){
                    if(j && j.error){
                        console.log(j.error)
                        console.trace()
                    }
                }
            }
        })
    } catch (error) {
        console.log(error)
        console.trace()
    }
}, 3000)

setInterval(async () => {
    try {
        await fetchMissingStatementsFromNodes()
    } catch (error) {
        console.log(error)
        console.trace()
    }
}, 20 * 1000)

export default {
    validateAndAddNode
}
