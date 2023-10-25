
import * as cp from 'child_process'
import {validateDomainFormat} from './domainNames/validateDomainFormat'

const log = true

type DNSSECResult = {
    TXTEntries: string[],
    validated: boolean,
    trust: string
}

export const checkDnssecValidation = (output, strict) => {
    const TXTEntries = (''+output).split('\n').map(s=>s.replace(/\"/g,''))
    const trust = TXTEntries.splice(0,1)[0]
    if (strict && trust !== '; fully validated') {
        throw (Error('not fully validated' + trust))
    } else {
        return({TXTEntries, validated: trust === '; fully validated', trust})
    }
}

export const getTXTEntriesDNSSEC = ({domain, strict}) => new Promise((resolve: (result: DNSSECResult) => void, reject) => {
    if(!validateDomainFormat(domain)){
        return reject(Error('invalid domain format'))
    }
    try {
        log && console.log('getTXTEntriesDNSSEC', domain)
        if (! /^[a-zA-Z\.-]{3,260}$/.test(domain)) {
            console.log('invalid domain', domain)
            reject(Error('invalid domain '+ domain))
        }
        const delv = cp.spawn('delv', ['@1.1.1.1', 'TXT', `${domain}`, '+short', '+trust'])
        delv.stdout.on('data', (data) => {
            try {
                log && console.log('data',data)
                const result = checkDnssecValidation(data, strict)
                resolve(result)
            }
            catch(error) {
                reject(error)
            }
        })
        delv.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`); 
            reject(Error(data))
        })
        delv.on('error', (error) => { 
            reject(Error('delv process error: ' + error)) 
        })
        delv.on('close', function (code) {
            reject(Error('delv process exited with code ' + code))
        });

    } catch (error){
        reject(error)
    }
})
