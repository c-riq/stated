// @ts-nocheck

import { p2p_seed } from './p2p_seed'
import { getAllNodes, updateNode, addNode } from './db'
import { validateAndAddStatementIfMissing } from './statementVerification'
import { forbiddenChars } from './statementFormats'

import { get, post } from './request'

const log = false

const ownDomain = process.env.DOMAIN
const seedNodesFromEnv = (process.env.SEED_NODES || '').split(',').filter(Boolean)
const test = process.env.TEST || false

console.log('seedNodesFromEnv', seedNodesFromEnv, 'p2p_seed', p2p_seed)

const sample = (arr,n) => arr.map(a => [a,Math.random()]).sort((a,b) => {return a[1] < b[1] ? -1 : 1;}).slice(0,n).map(a => a[0])

const validateAndAddNode = ({domain}) => new Promise(async (resolve, reject) => {
    log && console.log('validateAndAddNode ',  domain)
    if (!test && ! /^[a-zA-Z\.-_:]{7,260}$/.test(domain)) {
        console.log('invalid domain ' + domain)
        resolve({error: 'invalid domain'})
        return
    }
    if (domain === 'stated.' + ownDomain || domain === ownDomain) {
        resolve({error: 'skip validatin of own domain ' + domain})
        return
    }
    const res = await get({hostname: domain, path: '/api/health', cache: false})
    if(res && res.data && res.data.application == 'stated'){
        const res = await addNode({domain})
        if (res.error){
            console.log(res.error)
            resolve({res})
        } else {
            resolve(res)
        }
    } else {
        console.log('health check failed on ' + domain + res.error)
        resolve({error: 'health check failed on ' + domain})
    }
    resolve({res})
})

const addNodesOfPeer = ({domain}) => new Promise(async (resolve, reject) => {
    try {
        log && console.log('get nodes from', domain)
        const response = await get({hostname: domain, path: '/api/nodes'})
        const result = await Promise.all(response.data.domains.map(domain => validateAndAddNode({domain})))
        resolve(result)
    } catch(error) { resolve({error})}
})

const addNodesOfPeers = async () => {
    const dbResult = await getAllNodes()
    let nodes = (dbResult.rows || []).map(row => row.domain)
    if (nodes.length > 10) {
        nodes = sample(nodes, 10)
    }
    const result = await Promise.all(nodes.map(domain => addNodesOfPeer({domain})))
    return result
}

const sendJoinRequest = ({domain}) => new Promise(async (resolve, reject) => {
    if (
        !test && 
            (!domain.match(/stated.|/) || (domain.match(/\./g).length > 4) || 
            domain.match(/[\/&\?]/g) || forbiddenChars(domain))) { 
        console.log('invalid domain, should be analogous to stated.example.com', domain)
        resolve({error: 'invalid domain, should be analogous to stated.example.com'})
        return
    }
    
    log && console.log('sendJoinRequest to ', domain)
    const res = await post({ hostname: domain, path: '/api/join_network/', data: { domain: (!test ? 'stated.' : '') + ownDomain }})
    resolve(res)
})
const joinNetwork = async () => {
    if (!ownDomain && ownDomain !== 'localhost') {
        return
    }
    const dbResult = await getAllNodes()
    const domains = dbResult.rows.map(row => row.domain)
    const result = await Promise.all(domains.map(domain => sendJoinRequest({domain})))
    return result
}

const fetchMissingStatementsFromNode = ({domain, id, last_received_statement_id}) => new Promise(async (resolve, reject) => {
    console.log('fetch statements from ', domain)
    try {
        if (domain === 'stated.' + ownDomain) { resolve({}); return }
        const res = await get({hostname: domain, path: '/api/statements?min_id=' + (last_received_statement_id || 0)})
        if (res.error){
            log && console.log(domain, res.error)
            log && console.trace()
        }
        const {cert, ip} = res
        const certificateAuthority = cert && cert.infoAccess && cert.infoAccess['OCSP - URI'] && ''+cert.infoAccess['OCSP - URI'][0]
        const fingerprint = cert && cert.fingerprint && cert.fingerprint.match(":") && ''+cert.fingerprint
        log && console.log(res.data.statements.length, ' new statements from ', domain)
        const addStatementsResult = await Promise.all(res.data.statements.map(s => { validateAndAddStatementIfMissing({...s, source_node_id: id})}))
        log && console.log(addStatementsResult, 'res2')
        if(addStatementsResult && addStatementsResult.length && addStatementsResult.reduce((c,i) => c || (i && i.error)), false){
            const errors = addStatementsResult.filter((i) => i.error)
            console.trace()
            console.log(errors)
            resolve(errors)
            return
        }
        let allStatementsInDB = false
        if(addStatementsResult && addStatementsResult.length && addStatementsResult.reduce((c,i) => c && (i && i.existsOrCreated)), true){
            allStatementsInDB = true
        }
        if(!allStatementsInDB){
            console.log('not all statements are in DB, and errors not handeled', domain)
            resolve({error: 'not all statements added to DB'})
            return
        }
        // TODO: check if all statements were added already before updating last_received_statement_id
        let lastReceivedStatementId = Math.max(...res.data.statements.map(s => s.id), last_received_statement_id)
        if (lastReceivedStatementId >= 0) {
            let dbResult = await updateNode({domain: domain, lastReceivedStatementId, certificateAuthority, fingerprint, ip})
            if(dbResult.error) {
                console.log(dbResult)
                console.trace()
            }
        }
        resolve(addStatementsResult)
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
        const res = await Promise.all([...p2p_seed, ...seedNodesFromEnv].filter(i=>i).map(domain => validateAndAddNode({domain})))
    } catch (error) {
        console.log(error)
        console.trace()
    }
}

const fetchMissingStatementsFromNodes = async () => {
    const dbResult = await getAllNodes()
    let nodes = dbResult.rows
    if (nodes.length > 10) {
        nodes = sample(nodes, 10)
    }
    const res = await Promise.all(nodes.map(node => 
        fetchMissingStatementsFromNode({domain: node.domain, id: node.id, last_received_statement_id: node.last_received_statement_id})))
    return res
}

const setupSchedule = () => {
    setInterval(async () => {
        try {
            const seedRes = await addSeedNodes()
            const addNodesRes = await addNodesOfPeers()
            const joinNetworkRes = await joinNetwork()
            const fetchStatmentsRes = await fetchMissingStatementsFromNodes();
            [seedRes, addNodesRes, joinNetworkRes, fetchStatmentsRes].map(i => {
                // @ts-ignore
                if(i && i.error){
                    // @ts-ignore
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
    }, 20 * 1000)
}

export default {
    validateAndAddNode,
    setupSchedule
}