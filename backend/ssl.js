import { get } from './request.js'


const getOVInfo = ({domain}) => new Promise(async (resolve, reject) => {
    console.log('get SSL OV info for ', domain)
    try {
        const res = await get({hostname: domain, path: '', cache: false})
        if (res.error){
            console.log(domain, res.error)
            console.trace()
        }
        const {cert} = res
        const subject = cert && cert.subject 
        resolve({...subject, domain})
    }
    
    catch (error){
        console.log(error)
        console.trace()
        resolve({error})
    }
})

const getOVInfoForSubdomains = ({domain}) => new Promise(async (resolve, reject) => {
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