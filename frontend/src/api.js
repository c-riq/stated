
export const backendHost = process.env.NODE_ENV === 'development' || window.location.host.match(/^localhost.*/) ? (
    window.location.host.match(/^localhost:3000/) ? 'http://localhost:7766' : 'http://' + window.location.host
 ) : 'https://'+ window.location.host 

const req = (method, path, body, cb, reject) => {
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

export const getStatement = (hash_b64, cb) => {
    if (hash_b64.length < 1) {
        return cb({})
    }
    req('GET',('statement?hash=' + hash_b64), {}, (json) => {
        if ("statements" in json) {
            cb(json.statements[0])
            window.scrollTo(0,0)
        }
    }, e => {console.log(e); return})
}
export const getStatements = (searchQuery, cb) => {
    req('GET',(searchQuery ? 'statements_with_details?search_query=' + searchQuery : 'statements_with_details'), {}, (json) => {
        cb(json)
    }, e => {console.log(e); return})
}
export const getDomainSuggestions = (searchQuery, cb) => {
    if (searchQuery.length < 1) {
        cb([])
        return
    }
    req('GET',(searchQuery ? 'match_domain?domain_substring=' + searchQuery : 'match_domain'), {}, (json) => {
        cb(json)
    }, e => {console.log(e); return})
}
export const getDomainVerifications = (domain, cb) => {
    req('GET',(domain ? 'domain_verifications?domain=' + domain : 'domain_verifications'), {}, (json) => {
        cb(json)
    }, e => {console.log(e); return})
}
export const getNodes = (cb) => {
    req('GET', 'nodes', {}, (json) => {
        cb(json)
    }, e => {console.log(e); return})
}
export const getSSLOVInfo = ({domain, cacheOnly = false}, cb) => {
    console.log("getSSLOVInfo", domain)
    if (!domain || domain.length < 1) {
        cb([])
        return
    }
    req('GET',(domain ? 'ssl_ov_info?domain=' + domain : '&cache_only=' + cacheOnly), {}, (json) => {
        cb(json)
    }, e => {console.log(e); return})
}
export const getDNSSECInfo = (domain, cb) => {
    if (!domain || domain.length < 1) {
        cb({})
        return
    }
    req('GET',(domain ? 'check_dnssec?domain=' + domain : 'check_dnssec'), {}, (json) => {
        const {validated, domain} = json
        cb({validated, domain})
    }, e => {console.log(e); return})
}
export const getJoiningStatements = (hash_b64, cb) => {
    hash_b64 && req('GET',('joining_statements?hash=' + hash_b64), {}, (json) => {
        if ("statements" in json) {
            cb(json)
        }
    }, e => {console.log(e); return})
}
export const getVotes = (hash_b64, cb) => {
    hash_b64 && req('GET',('votes?hash=' + hash_b64), {}, (json) => {
        if ("statements" in json) {
            cb(json.statements)
        }
    }, e => {console.log(e); return})
}
export const getOrganisationVerifications = (hash_b64, cb) => {
    hash_b64 && req('GET',('organisation_verifications?hash=' + hash_b64), {}, (json) => {
        if ("statements" in json) {
            cb(json.statements)
        }
    }, e => {console.log(e); return})
}
export const getPersonVerifications = (hash_b64, cb) => {
    hash_b64 && req('GET',('person_verifications?hash=' + hash_b64), {}, (json) => {
        if ("statements" in json) {
            cb(json.statements)
        }
    }, e => {console.log(e); return})
}

export const checkDomainVerification = (domain, cb, reject) => {
    req('GET', "txt_records?domain=" + domain, {}, cb, reject)
}
export const submitStatement = (body, cb, reject) => {
    req('POST', 'submit_statement', body, cb, reject)
}

export const uploadPdf = (body, cb, reject) => {
    req('POST', 'upload_pdf', body, cb, reject)
}

