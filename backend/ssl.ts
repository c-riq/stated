import { get } from './request'
import { validateDomainFormat } from './domainNames/validateDomainFormat'
import {getCertCache, setCertCache} from './database'


export const getOVInfo = ({domain}) => new Promise(async (resolve, reject) => {
    console.log('get SSL OV info for ', domain)
    const cached = await getCertCache({domain})
    if (cached && cached.rows && cached.rows[0] && cached.rows[0].subject_o){
        const {subject_o, subject_l, subject_st, subject_c, sha256, issuer_o, issuer_c, issuer_cn} = cached.rows[0]
        return resolve({domain, O: subject_o, L: subject_l, ST: subject_st, C: subject_c, sha256,
            issuer_o: issuer_o, issuer_c: issuer_c, issuer_cn: issuer_cn})
    }
    try {
        const res = await get({hostname: domain, path: '', cache: false})
        const {cert} = res
        const subject = cert && cert.subject 
        const issuer = cert && cert.issuer 
        if (subject && subject.O && subject.C){
           setCertCache({domain, subject_o: subject.O, subject_l: subject.L, subject_st: subject.ST, subject_c: subject.C, 
            subject_cn: subject.CN, subject_serialnumber: subject.serialNumber, subjectaltname: cert.subjectaltname,
            issuer_o: issuer.O, issuer_c: issuer.C, issuer_cn: issuer.CN,
            sha256: cert.fingerprint256.replace(/:/g,""), validFrom: cert.valid_from, validTo: cert.valid_to})
            resolve({...subject, issuer_o: issuer.O, issuer_c: issuer.C, issuer_cn: issuer.CN, domain, sha256: cert.fingerprint256?.replace(/:/g,"")})
        }
        else {
            resolve({domain})
        }
    }
    catch (error){
        reject(error)
    }
})

export const getOVInfoForSubdomains = ({domain}) => new Promise(async (resolve, reject) => {
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
        const results = await Promise.allSettled(promises)
        results.filter(r=>r.status == 'rejected').map(r=>{
            // @ts-ignore
            console.log('' + r.reason)
            console.trace()
        })
        return resolve(results)
    }
    catch (error){
        reject(error)
    }
})
