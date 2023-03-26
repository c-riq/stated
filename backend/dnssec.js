
import * as cp from 'child_process'

const log = true

export const getTXTEntriesDNSSEC = ({domain, strict}) => new Promise((resolve, reject) => {
    try {
        log && console.log('getTXTEntriesDNSSEC', domain)
        if (! /^[a-zA-Z\.-]{7,260}$/.test(domain)) {
            console.log('invalid domain', domain)
            resolve({error: 'invalid domain '+ domain})
        }
        const dig = cp.spawn('delv', ['@8.8.8.8', 'TXT', `${domain}`, '+short', '+trust'])
        dig.stdout.on('data', (data) => {
            try {
                log && console.log('data',data)
                const TXTEntries = (''+data).split('\n').map(s=>s.replace(/\"/g,''))
                const trust = TXTEntries.splice(0,1)[0]
                if (strict && trust !== '; fully validated') {
                    resolve({error: 'not fully validated', trust})
                    return
                } else {
                    resolve({TXTEntries, validated: trust === '; fully validated', trust})
                }
            }
            catch(error) {
                resolve({error})
            }
        })
        dig.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`); 
            resolve({error: data})
        })
        dig.on('error', (error) => { 
            resolve({error: 'dig process error: ' + error}) 
        })
        dig.on('close', function (code) {
            resolve({error: 'dig process exited with code ' + code})
        });
          
    } catch (error){
        resolve({error})
    }
})
