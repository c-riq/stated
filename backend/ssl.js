import { get } from './request.js'
import { validateDomainFormat } from './domainNames/validateDomainFormat.js'
import db from './db.js'


const getOVInfo = ({domain}) => new Promise(async (resolve, reject) => {
    console.log('get SSL OV info for ', domain)
    const cached = await db.getCertCache({domain})
    if (cached && cached.rows && cached.result[0] && cached.result[0].O){
        const {O, L, ST, C} = cached.result[0]
        return resolve({subject: {O, L, ST, C}, domain})
    }
    try {
        const res = await get({hostname: domain, path: '', cache: false})
        if (res.error){
            console.log(domain, res.error)
            console.trace()
        }
        const {cert} = res
        const subject = cert && cert.subject 
        if (subject && subject.O && subject.C){
            db.setCertCache({domain, O: subject.O, L: subject.L, ST: subject.ST, C: subject.C})
        }
        resolve({...subject, domain})
    }
    catch (error){
        console.log(error)
        console.trace()
        resolve({error})
    }
})

const getOVInfoForSubdomains = ({domain}) => new Promise(async (resolve, reject) => {
    if(!validateDomainFormat(domain)){
        resolve({error: 'invalid domain format'})
        return
}
    console.log('get SSL OV info for ', domain)
    if (domain.match(/^stated\./)){
        domain = domain.replace(/^stated\./, '')
    }
    try {
        const promises = [domain, 'www.' + domain, 'stated.' + domain].map(domain => getOVInfo({domain}))
        const results = await Promise.all(promises)
        if (results.error) {
            console.log(results.error)
            console.trace()
        } else {
            resolve(results)
        }
        return
    }
    catch (error){
        console.log(error)
        console.trace()
        resolve({error})
    }
})

export default {getOVInfo, getOVInfoForSubdomains}