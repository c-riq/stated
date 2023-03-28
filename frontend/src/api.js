
const req = (method, path, body, cb, reject) => {
    const url = `${(
        process.env.NODE_ENV == 'development' || window.location.host == 'localhost:7766' ? 'http://localhost:7766' : 'https://'+ window.location.host 
        )}/api/${path}`
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
            if(res.status != 200) {
                reject(res)
            }
            else {
                res.json().then(json => {
                    console.log("json", json)
                    cb(json)
                })
                .catch(error => reject(error))
            }
        })
        .catch(error => reject(error))
}

export const getStatement = (hash_b64, cb) => {
    req('POST', 'statement', {hash_b64}, (json) => {
        if ("statements" in json) {
            cb(json.statements[0])
            window.scrollTo(0,0)
        } 
    }, e => {return})
}
export const getStatements = (searchQuery, cb) => {
    req('GET',(searchQuery ? 'statements_with_details?search_query=' + searchQuery : 'statements_with_details'), {}, (json) => {
        cb(json)
    }, e => {return})
}
export const getDomainSuggestions = (searchQuery, cb) => {
    if (searchQuery.length < 1) {
        cb([])
        return
    }
    req('GET',(searchQuery ? 'match_domain?domain_substring=' + searchQuery : 'match_domain'), {}, (json) => {
        cb(json)
    }, e => {return})
}
export const getSSLOVInfo = (domain, cb) => {
    if (!domain || domain.length < 1) {
        cb([])
        return
    }
    req('GET',(domain ? 'get_ssl_ov_info?domain=' + domain : 'get_ssl_ov_info'), {}, (json) => {
        cb(json)
    }, e => {return})
}
export const getDNSSECInfo = (domain, cb) => {
    if (!domain || domain.length < 1) {
        cb([])
        return
    }
    req('GET',(domain ? 'check_dnssec?domain=' + domain : 'check_dnssec'), {}, (json) => {
        cb(json)
    }, e => {return})
}
export const getJoiningStatements = (hash_b64, cb) => {
    req('POST', 'joining_statements', {hash_b64}, (json) => {
        if ("statements" in json) {
            cb(json.statements)
            window.scrollTo(0,0)
        } 
    }, e => {return})
}
export const getVotes = (hash_b64, cb) => {
    req('POST', 'votes', {hash_b64}, (json) => {
        if ("statements" in json) {
            cb(json.statements)
            window.scrollTo(0,0)
        } 
    }, e => {return})
}
export const getVerifications = (hash_b64, cb) => {
    req('POST', 'verifications', {hash_b64}, (json) => {
        if ("statements" in json) {
            cb(json.statements)
            window.scrollTo(0,0)
        } 
    })
}

export const checkDomainVerification = (domain, cb, reject) => {
    req('POST', "get_txt_records", domain, cb, reject)
}
export const submitStatement = (body, cb, reject) => {
    req('POST', 'submit_statement', body, cb, reject)
}

