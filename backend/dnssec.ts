
import * as cp from 'child_process'
import {validateDomainFormat} from './domainNames/validateDomainFormat'

const log = true

type DNSSECResult = {
    TXTEntries: string[],
    validated: boolean,
    trust: string
}

export const getTXTEntriesDNSSEC = ({domain, strict}) => new Promise((resolve: (result: DNSSECResult) => void, reject) => {
    if(!validateDomainFormat(domain)){
        return reject(Error('invalid domain format'))
    }
    try {
        log && console.log('getTXTEntriesDNSSEC', domain)
        if (! /^[a-zA-Z\.-]{4,260}$/.test(domain)) {
            console.log('invalid domain', domain)
            reject(Error('invalid domain '+ domain))
        }
        const dig = cp.spawn('delv', ['@1.1.1.1', 'TXT', `${domain}`, '+short', '+trust'])
        dig.stdout.on('data', (data) => {
            try {
                log && console.log('data',data)
                const TXTEntries = (''+data).split('\n').map(s=>s.replace(/\"/g,''))
                const trust = TXTEntries.splice(0,1)[0]
                if (strict && trust !== '; fully validated') {
                    return reject(Error('not fully validated' + trust))
                } else {
                    resolve({TXTEntries, validated: trust === '; fully validated', trust})
                }
            }
            catch(error) {
                reject(error)
            }
        })
        dig.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`); 
            reject(Error(data))
        })
        dig.on('error', (error) => { 
            reject(Error('dig process error: ' + error)) 
        })
        dig.on('close', function (code) {
            reject(Error('dig process exited with code ' + code))
        });
          
    } catch (error){
        reject(error)
    }
})
