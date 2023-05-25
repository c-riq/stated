// send n statements to different nodes

var http = require('http');

const crypto = require('node:crypto');

function sha256(content) {  
    const base64 = crypto.createHash('sha256').update(content).digest('base64')
    const urlSafe = base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    return urlSafe
  }
  
const nodes = [1,2,3,4]//,5,6]

const statementCount = nodes.length * 20
const verificationCount = nodes.length * 3

const request = (method, data, node, path, callback) => {
    console.log(method, data, node, path)
    try {
        var post_options = {
            host: 'localhost',
            port: 7000 + node,
            path: '/api/' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        }
        var post_req = http.request(post_options, (res) => {
            let rawData = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                //console.log('Response: ' + chunk);
                rawData += chunk;
            });
            res.on('end', function () {
                callback && callback(rawData)
            });
            res.on('error', function (e) {
                console.log('Error: ' + e.message);
            });
        });
        post_req.on('error', function (e) {
            console.log('Error: ' + e.message);
        });

        method === 'POST' && post_req.write(JSON.stringify(data))
        post_req.end()


    } catch (e) {
        console.log(e)
    }
}

const generateContent = (node) => {
    return `Domain: stated_${node}:${7000+node}
Author: node_${node}
Time: Thu, 30 Mar 2023 09:18:04 GMT
Content: hi2 ${new Date()} ${Math.random()}`
}


const buildOrganisationVerificationContent = (
    {verifyName, country, city, province, legalEntity, verifyDomain, foreignDomain, serialNumber,
    verificationMethod, confidence, supersededVerificationHash, pictureHash}) => {
// console.log(verifyName, country, city, province, legalEntity, verifyDomain)
if(!verifyName || !country || !legalEntity || (!verifyDomain && !foreignDomain)) return ""
if (!["limited liability corporation","local government","state government","national government"].includes(legalEntity)) 
        return ""
return "\n" +
"\t" + "Type: Organisation verification" + "\n" +
"\t" + "Description: We verified the following information about an organisation." + "\n" +
"\t" + "Name: " + verifyName + "\n" +
"\t" + "Country: " + country + "\n" +
"\t" + "Legal entity: " + legalEntity + "\n" +
(verifyDomain ? "\t" + "Owner of the domain: " + verifyDomain + "\n" : "") +
(foreignDomain ? "\t" + "Foreign domain used for publishing statements: " + foreignDomain + "\n" : "") +
(province ? "\t" + "Province or state: " + province + "\n" : "") +
(serialNumber ? "\t" + "Business register number: " + serialNumber + "\n" : "") +
(city ? "\t" + "City: " + city + "\n" : "") +
(pictureHash ? "\t" + "Logo: " + pictureHash + "\n" : "") +
(verificationMethod ? "\t" + "Verification method: " + verificationMethod + "\n" : "") +
(supersededVerificationHash ? "\t" + "Superseded verification: " + supersededVerificationHash + "\n" : "") +
(confidence ? "\t" + "Confidence: " + confidence + "\n" : "") +
""
}

const generateVerification = (node) => {
    var node_2 = nodes[Math.floor(Math.random()*nodes.length)];
    return `Domain: stated_${node}:${7000+node}
Author: node_${node}
Time: Thu, 30 Mar 2023 09:18:04 GMT
Content: ${buildOrganisationVerificationContent({verifyName: 'node_'+node_2,
 verifyDomain: 'stated_'+node_2+':'+(7000+node_2), 
 country: 'DE', city: "Berlin", legalEntity: 'limited liability corporation', confidence: Math.random()})}`
}


const generateStatement = (node) => {
    const statement = generateContent(node)
    const hash_b64 = sha256(statement)
    return({statement, hash_b64, api_key: "XXX" })
}


const generateVerificationStatement = (node) => {
    const statement = generateVerification(node)
    const hash_b64 = sha256(statement)
    return({statement, hash_b64, api_key: "XXX" })
}

let beforeCount = 1e9

const test = () => {
    request('GET', {}, 1, 'statements', (res) => {
        console.log(res)
        const r = JSON.parse(res)
        beforeCount = r.statements.length
        console.log(beforeCount)

        let i = 0
        while (i < statementCount){
            const node = (i % nodes.length) + 1
            const json = generateStatement(node)
            //console.log(json)
            request('POST', json, node, 'submit_statement')
            //request('POST', json, node, 'submit_statement')
            i = i+1
        }

        i = 0
        while (i < verificationCount){
            const node = (i % nodes.length) + 1
            const json = generateVerificationStatement(node)
            //console.log(json)
            request('POST', json, node, 'submit_statement')
            //request('POST', json, node, 'submit_statement')
            i = i+1
        }
    })


    setTimeout(() => {
        request('GET', {}, 1, 'nodes', (res) => {
            const r = JSON.parse(res)
            console.log(nodes.length, r.domains.length)
            if ((r.domains.length - (nodes.length - 1)) < 0) {
                throw(new Error('Not all nodes registered with node 1'))
            } else {
                request('GET', {}, 1, 'statements', (res) => {
                    const r = JSON.parse(res)
                    console.log(r.statements.length)
                    if ((r.statements.length - beforeCount) < (statementCount + verificationCount)) {
                        console.log(r.statements.length - beforeCount, statementCount + verificationCount)
                        throw(new Error('Not all statements propagated to node 1'))
                    } else {
                        process.stdout.write('success');
                    }
                })
            }
        })
        }, 
    12 * 1000)
}

const healthTestInterval = setInterval(() => {
    try {
        request('GET', {}, 1, 'health', (res) => {
            try {
                const r = JSON.parse(res)
                console.log('healthTest response: ', r)
                if(r.application == 'stated') {
                    setTimeout(test, 1000)
                    clearInterval(healthTestInterval)
                }
            } catch (e) {
                console.log(e)
            }
        })
    } catch (e) {
        console.log(e)
    }
}, 1000)
