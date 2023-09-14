import { raw } from 'express'
import http, { RequestOptions } from 'http'
import https, { RequestOptions as RequestOptionsHttps } from 'https'

const ownDomain = process.env.DOMAIN
const test = process.env.TEST || false
const log = true

type response = {
    data?: any,
    error?: any,
    cert?: any,
    ip?: any
}

export const get = ({hostname, path='', cache=false, json=true}) => new Promise((resolve: (res: response) => void, reject) => {
    log && console.log('get request', hostname, path)
    try {
        if(hostname === 'stated.' + ownDomain || hostname === ownDomain){
            resolve({error: 'skip request to own domain: ' + hostname})
            return
        }
        let cert = {}
        let ip = ''
        let data = ''
        const options: RequestOptions | RequestOptionsHttps = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            ...(!cache && { 'agent': false })
        }
        const req = (test ? http : https).request(`http${(test ? '' : 's')}://${hostname}${path}`, options, res => {  
            let rawData = ''
            res.setEncoding('utf8')
            res.on('data', chunk => {
                // @ts-ignore
                cert = !test && res.req?.socket?.getPeerCertificate()
                // @ts-ignore
                ip = res.req?.socket?.remoteAddress
                rawData += chunk
            })
            res.on('end', () => {
                try {
                    data = json ? JSON.parse(rawData) : rawData
                    resolve({data, cert, ip})
                } catch(error) {
                    resolve({error, data: rawData, cert, ip})
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
    const options: RequestOptions | RequestOptionsHttps  = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }
    let ip = ''
    let responseData = ''
    const req = (test ? http : https).request(`http${(test ? '' : 's')}://${hostname}${path}`, options, res => {
        let rawData = ''
        res.setEncoding('utf8')
        res.on('data', chunk => rawData += chunk)
        res.on('end', () => {
            try {
                responseData = JSON.parse(rawData)
                resolve({data: responseData, ip})
            } catch(error) {
                resolve({error})
            }
        })
    })
    req.on('error', (error) => resolve({error}))
    req.write(JSON.stringify(data))
    req.end()
})
