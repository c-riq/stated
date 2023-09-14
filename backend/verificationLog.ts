
import { verifyViaStatedApi, verifyViaStaticTextFile, verifyTXTRecord } from './statementVerification'

import { getStatementsToVerify, addLog } from './database'

const log = true
const ownDomain = process.env.DOMAIN

const verificationRetryScheduleHours = [0, 0.01, 0.05, 0.1, 0.2, 1, 10, 24, 100, 336, 744]

const timeoutWithFalse = (promise, ms) => new Promise((resolve, reject) => {
    promise()
        .then((r) => {
            log && console.log('result: ', r)
            resolve(r)
        })
        .catch(e => {
            log && console.log('error: ', e)
            resolve(false)
        });
    setTimeout(() => {
        log && console.log('timeout')
        resolve(false)
    }, ms)
})

const tryVerifications = ({domain, hash_b64, statement, s}) => new Promise((resolve, reject) => {
    Promise.allSettled([
        timeoutWithFalse(() => verifyViaStatedApi(domain, hash_b64), 0.5 * s * 1000),
        timeoutWithFalse(() => verifyViaStaticTextFile(domain, statement), 10 * s * 1000),
        timeoutWithFalse(() => verifyTXTRecord("stated." + domain, hash_b64), 10 * s * 1000)
    ]).then((results) => {
        // @ts-ignore
        const [api, txt, dns] = results.map(r => r.value)
        return resolve({api, dns, txt})
    })
})

const logVerifications = async (retryIntervalSeconds) => {
    try {
        const dbResult = await getStatementsToVerify({n:20, ownDomain})
        let outdatedVerifications = dbResult.rows
        log && console.log('outdated verifications count ', outdatedVerifications.length)
        outdatedVerifications = outdatedVerifications.filter(s => {
            // @ts-ignore
            const sinceFirst = (new Date()) - s.min_t
            // @ts-ignore
            const sinceLast = (new Date()) - s.min_t
            const targetRetryCount = verificationRetryScheduleHours.filter(h => h < sinceFirst / (1000 * 60 * 60)).length
            if (targetRetryCount > parseInt(s.n) || sinceLast > 744) {
                if(s.domain === ownDomain){
                    return false
                }
                return true
            } return false
        })
        log && console.log('verifications to check ', outdatedVerifications.length)

        const res = await Promise.allSettled(outdatedVerifications.map(({domain, hash_b64, statement}) =>
            new Promise(async (resolve, reject) => {
                // prevent DNS throttling
                await new Promise(resolve => setTimeout(resolve, Math.random() * 0.5 * retryIntervalSeconds * 1000))
                return resolve(await tryVerifications({domain, hash_b64, statement, s: retryIntervalSeconds}))
            })
        ))
        res.map((r, i) => {
            if(r.status === 'fulfilled'){
                // @ts-ignore
                const {api, dns, txt} = r.value
                addLog({hash_b64: outdatedVerifications[i].hash_b64, api, dns, txt})
            }
        })
        return res
    } catch (error) {
        console.log(error)
        console.trace()
    }
}

const setupSchedule = (retryIntervalSeconds) => {
    setInterval(async () => {
        log && console.log('verification log started')
        try {
            await logVerifications(retryIntervalSeconds)
        } catch (error) {
            console.log(error)
            console.trace()
        }
    }, retryIntervalSeconds * 1000)   
}

export default {
    setupSchedule
}
