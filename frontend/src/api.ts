import { statement } from "./statementFormats"

export const backendHost = process.env.NODE_ENV === 'development' || window.location.host.match(/^localhost.*/) ? (
    window.location.host.match(/^localhost:3000/) ? 'http://localhost:7766' : 'http://' + window.location.host
 ) : 'https://'+ window.location.host 

type method = 'GET' | 'POST' | 'PUT' | 'DELETE'
type res<T> = (arg0:T|undefined)=>void
type validatedResponseHandler<T> = (arg0:T)=>void
type cb = (arg0:any)=>void

const req = (method:method, path:string, body:any, cb:cb, reject:cb) => {
    const url = `${backendHost}/api/${path}`
    const opts = {
        headers: {
            'accept': `application/json`,
            'Content-Type': 'application/json'
        },
        method: method,
        ...(method === 'GET' ? {} : {body: JSON.stringify(body)})
    }
    console.log(url, opts)
    fetch(url, opts)
        .then(res => {
            if(res.status === 200) {
                res.json().then(json => {
                    console.log("json", json)
                    cb(json)
                })
                .catch(error => reject(error))
            } else {
                reject(res)
            }
        })
        .catch(error => reject({error}))
}

export const getStatement = (hash:string, cb:res<statement|any>) => {
    if (hash.length < 1) {
        return cb({})
    }
    req('GET',('statement?hash=' + hash), {}, (json) => {
        if ("statements" in json) {
            cb(json.statements[0])
            window.scrollTo(0,0)
        }
    }, e => {console.log(e); return})
}
export const getStatements = (searchQuery:string|undefined, cb:res<statement[]>) => {
    req('GET',(searchQuery ? 'statements_with_details?search_query=' + searchQuery : 'statements_with_details'), {}, (json) => {
        cb(json)
    }, e => {console.log(e); return})
}
type domainSuggestionResponse = {
    result: {
        domain: string,
        organisation: string
    }[]
}
export const getDomainSuggestions = (searchQuery:string, cb:res<domainSuggestionResponse>) => {
    if (searchQuery.length < 1) {
        return cb(undefined)
    }
    req('GET',(searchQuery ? 'match_domain?domain_substring=' + searchQuery : 'match_domain'), {}, (json) => {
        cb(json)
    }, e => {console.log(e); return})
}
export const getDomainVerifications = (domain:string|undefined, cb:cb) => {
    req('GET',(domain ? 'domain_verifications?domain=' + domain : 'domain_verifications'), {}, (json) => {
        cb(json)
    }, e => {console.log(e); return})
}
export const getNodes = (cb:cb) => {
    req('GET', 'nodes', {}, (json) => {
        cb(json)
    }, e => {console.log(e); return})
}
export const getSSLOVInfo = (domain:string, cb:cb, cacheOnly?:boolean) => {
    console.log("getSSLOVInfo", domain)
    if (!domain || domain.length < 1) {
        cb([])
        return
    }
    req('GET',(domain ? 'ssl_ov_info?domain=' + domain : '&cache_only=' + !!cacheOnly), {}, (json) => {
        cb(json)
    }, e => {console.log(e); return})
}
export const getDNSSECInfo = (domain:string, cb:cb) => {
    if (!domain || domain.length < 1) {
        cb({})
        return
    }
    req('GET',(domain ? 'check_dnssec?domain=' + domain : 'check_dnssec'), {}, (json) => {
        const {validated, domain} = json
        cb({validated, domain})
    }, e => {console.log(e); return})
}
export const getJoiningStatements = (hash:string, cb:cb) => {
    hash && req('GET',('joining_statements?hash=' + hash), {}, (json) => {
        if ("statements" in json) {
            cb(json)
        }
    }, e => {console.log(e); return})
}
export const getVotes = (hash:string, cb:cb) => {
    hash && req('GET',('votes?hash=' + hash), {}, (json) => {
        if ("statements" in json) {
            cb(json.statements)
        }
    }, e => {console.log(e); return})
}
export const getOrganisationVerifications = (hash:string, cb:cb) => {
    hash && req('GET',('organisation_verifications?hash=' + hash), {}, (json) => {
        if ("statements" in json) {
            cb(json.statements)
        }
    }, e => {console.log(e); return})
}
export const getPersonVerifications = (hash:string, cb:cb) => {
    hash && req('GET',('person_verifications?hash=' + hash), {}, (json) => {
        if ("statements" in json) {
            cb(json.statements)
        }
    }, e => {console.log(e); return})
}
type dnsRes = {
    records:string[]
}
export const getTXTRecords = (domain:string, cb:res<dnsRes>, reject:cb) => {
    req('GET', "txt_records?domain=" + domain, {}, cb, reject)
}
export const submitStatement = (body:any, cb:cb, reject:cb) => {
    req('POST', 'submit_statement', body, cb, reject)
}

export const uploadPdf = (body:any, cb:validatedResponseHandler<{sha256sum: string, filePath: string}>, reject:cb) => {
    req('POST', 'upload_pdf', body, (json)=>{
        if (json.sha256sum && json.filePath) {
            cb(json)
        } else {
            reject("upload failed")
        }
    }, reject)
}

