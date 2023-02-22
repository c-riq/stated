import https from 'https'

const ownDomain = process.env.DOMAIN
const log = false

export const get = ({hostname, path}) => new Promise((resolve, reject) => {
    log && console.log('get request', hostname, path)
    try {
        if(hostname === 'stated.' + ownDomain || hostname === ownDomain){
            resolve({error: 'skip request to own domain: ' + hostname})
            return
        }
        let cert = {}
        let ip = ''
        const options = {
            hostname: hostname,
            protocol: 'https:',
            path: path,
            method: 'GET',
        }
        const req = https.request(options, res => {  
            let data = ''
            res.setEncoding('utf8')
            res.on('data', chunk => {
                cert = res.req.socket.getPeerCertificate()
                ip = res.req.socket.remoteAddress
                data += chunk
            })
            res.on('end', () => {
                try {
                    data = JSON.parse(data)
                    resolve({data, cert, ip})
                } catch(error) {
                    resolve({error})
                }
            })
        })
        req.on('error', (error) => resolve({error}))
        req.end()
    }catch (error) {
        resolve({error})
    }
})

export const post = ({hostname, path, data}) => new Promise((resolve, reject) => {
    log && console.log('post request', hostname, path, data)
    if(hostname.match(ownDomain)){
        resolve({error: 'skip request to own domain: ' + hostname})
        return
    }
    const options = {
        hostname: hostname,
        protocol: 'https:',
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }
    const req = https.request(options, res => {  
        let data = ''
        res.setEncoding('utf8')
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
            try {
                data = JSON.parse(data)
                resolve({data, cert, ip})
            } catch(error) {
                resolve({error})
            }
        })
    })
    req.on('error', (error) => resolve({error}))
    req.write(JSON.stringify(data))
    req.end()
})
