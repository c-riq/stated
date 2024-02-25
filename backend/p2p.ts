import { p2p_seed } from './p2p_seed'
import { getAllNodes, updateNode, addNode } from './database'
import { validateAndAddStatementIfMissing } from './statementVerification'

import { get, post } from './request'

const log = false

const ownDomain = process.env.DOMAIN
const seedNodesFromEnv = (process.env.SEED_NODES || '').split(',').filter(Boolean)
const test = process.env.TEST || false

export const forbiddenChars = (s: string) => /;|>|<|"|\\/.test(s)

console.log('seedNodesFromEnv', seedNodesFromEnv, 'p2p_seed', p2p_seed)

const sample = (arr: any[], n: number) => arr.map(a => [a, Math.random()]).sort((a, b) => { return a[1] < b[1] ? -1 : 1; }).slice(0, n).map(a => a[0])

const validateAndAddNode = ({domain}: { domain: string }) => new Promise(async (resolve, reject) => {
    try {
        log && console.log('validateAndAddNode ',  domain)
        if (!test && ! /^[a-zA-Z\.-_:]{7,260}$/.test(domain)) {
            console.log('invalid domain ' + domain)
            throw(Error('invalid domain'))
        }
        if (domain === 'stated.' + ownDomain || domain === ownDomain) {
            throw(Error('skip validatin of own domain ' + domain))
        }
        const res = await get({hostname: domain, path: '/api/health', cache: false})
        if(res?.data?.application == 'stated'){
            const res = await addNode({domain})
            resolve(res)
        } else {
            console.log('health check failed on ' + domain + res.error)
            throw(Error('health check failed on ' + domain))
        }
        resolve({res})
    } catch(error) { 
        reject(error)
    }
})

const addNodesOfPeer = ({domain}: { domain: string }) => new Promise(async (resolve, reject) => {
    try {
        log && console.log('get nodes from', domain)
        const response = await get({hostname: domain, path: '/api/nodes'})
        const result = await Promise.allSettled(response.data?.result?.map((
            {domain}: { domain: string }) => validateAndAddNode({domain})))
        resolve(result)
    } catch(error) {
        reject(error)
    }
})

const addNodesOfPeers = async () => {
    const dbResult = await getAllNodes()
    let nodes = (dbResult?.rows || []).map(row => row.domain)
    if (nodes.length > 10) {
        nodes = sample(nodes, 10)
    }
    const result = await Promise.allSettled(nodes.map(domain => addNodesOfPeer({domain})))
    return result
}

const sendJoinRequest = ({domain}: { domain: string }) => new Promise(async (resolve, reject) => {
    if (
        !test && 
            (!domain.match(/stated.|/) || (domain.match(/\./g)?.length ?? 0 > 4) || 
            domain.match(/[\/&\?]/g) || forbiddenChars(domain))) { 
        console.log('invalid domain, should be analogous to stated.example.com', domain)
        reject(Error('invalid domain, should be analogous to stated.example.com'))
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
    const domains = dbResult?.rows?.map(row => row.domain) || []
    const result = await Promise.allSettled(domains.map(domain => sendJoinRequest({domain})))
    return result
}

const fetchMissingStatementsFromNode = ({domain, id, last_received_statement_id}: { domain: string, id: number, last_received_statement_id: number }) => new Promise(async (resolve, reject) => {
    console.log('fetch statements from ', domain)
    try {
        if (domain === 'stated.' + ownDomain) { resolve({}); return }
        const res = await get({hostname: domain, path: '/api/statements?min_id=' + (last_received_statement_id || 0) + '&n=20'})
        if (res.error){
            log && console.log(domain, res.error)
            log && console.trace()
        }
        const {cert, ip} = res
        const certificateAuthority = '' + cert?.infoAccess?.['OCSP - URI']?.[0]
        const fingerprint = cert?.fingerprint?.match(":") && ''+cert.fingerprint
        log && console.log(res.data.statements.length, ' new statements from ', domain)
        const addStatementsResult: PromiseSettledResult<{existsOrCreated:boolean, tryIncremented:boolean}>[] = await Promise.allSettled(
            res.data.statements.map( (s:StatementDB) => validateAndAddStatementIfMissing({
                ...s, 
                source_node_id: id,
                hidden: undefined,
                api_key: '',
                verification_method: s.verification_method || undefined
            })))
        log && console.log(addStatementsResult, 'res2')
        const allExistsOrCreated = addStatementsResult.reduce((acc,i) => acc && 
            (i.status==='fulfilled' && i.value && (
                i.value.existsOrCreated ||
                i.value.tryIncremented)), true)
        if(!allExistsOrCreated){
            const errors = addStatementsResult.filter((i) => i.status==="rejected")
            console.trace()
            console.log(errors)
            // TODO: prevent malformatted statedments from blocking syncing of other statements
            resolve(errors)
            return
        }
        let lastReceivedStatementId = Math.max(...res.data.statements.map((s: any) => s.id), last_received_statement_id)
        if (lastReceivedStatementId >= 0) {
            await updateNode({domain: domain, last_received_statement_id: BigInt(lastReceivedStatementId), certificate_authority: certificateAuthority, fingerprint, ip})
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
        const res = await Promise.allSettled([...p2p_seed, ...seedNodesFromEnv]
            .filter(i => i !== undefined).map(domain => domain && validateAndAddNode({ domain: domain })))
    } catch (error) {
        console.log(error)
        console.trace()
    }
}

const fetchMissingStatementsFromNodes = async () => {
    const dbResult = await getAllNodes()
    let nodes = dbResult?.rows || []
    if (nodes.length > 10) {
        nodes = sample(nodes, 10)
    }
    const res = await Promise.allSettled(nodes.map(node => 
        fetchMissingStatementsFromNode({domain: node.domain, id: node.id, last_received_statement_id: Number(node.last_received_statement_id)})))
    return res
}

const setupSchedule = (pullIntervalSeconds: number) => {
    setTimeout(() => {
    setInterval(async () => {
        let addNodesRes 
        try {
            addNodesRes = await addNodesOfPeers()
        } catch (error) {
            console.log(error)
            console.trace()
        }
        if (addNodesRes && addNodesRes.length > 0) {
            for (let i of addNodesRes) {
                if (i && i.status === "rejected" && (i as PromiseRejectedResult).reason) {
                    console.log((i as PromiseRejectedResult).reason);
                    console.trace();
                }
            }
        }
    }, pullIntervalSeconds * 1000)
    }, pullIntervalSeconds * 1000 * 0.3)

    setTimeout(() => {
    setInterval(async () => {
        let joinNetworkRes
        try {
            joinNetworkRes = await joinNetwork()
        } catch (error) {
            console.log(error)
            console.trace()
        }
        if(joinNetworkRes && joinNetworkRes.length > 0){
            for(let i of joinNetworkRes){
                if(i && i.status === "rejected" && (i as PromiseRejectedResult).reason && (i as PromiseRejectedResult).reason.error){
                    console.log((i as PromiseRejectedResult).reason.error)
                    console.trace()
                }
            }
        }
    }, pullIntervalSeconds * 1000)
    }, pullIntervalSeconds * 1000 * 0.5)

    setTimeout(() => {
    setInterval(async () => {
        let fetchStatmentsRes
        try {
            fetchStatmentsRes = await fetchMissingStatementsFromNodes()
        } catch (error) {
            console.log(error)
            console.trace()
        }
        if (fetchStatmentsRes && Array.isArray(fetchStatmentsRes)) {
            for (let i of fetchStatmentsRes) {
                if (i && i.status === "rejected" && (i as PromiseRejectedResult).reason && (i as PromiseRejectedResult).reason.error) {
                    console.log((i as PromiseRejectedResult).reason.error);
                    console.trace();
                }
            }
        }
    }, pullIntervalSeconds * 1000)
    }, pullIntervalSeconds * 1000 * 0.7)
}

export default {
    validateAndAddNode,
    setupSchedule,
    addSeedNodes
}
