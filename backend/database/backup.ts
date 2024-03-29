import * as cp from 'child_process'

const log = false;

import { DBCallback, DBErrorCallback } from ".";

const pgHost = process.env.POSTGRES_HOST || "localhost"
const pgDatabase = process.env.POSTGRES_DB || "stated"
const pgUser = process.env.POSTGRES_USER || "sdf"
const pgPassword = process.env.POSTGRES_PW || "sdf"
const pgPort = parseInt(process.env.POSTGRES_PORT || '5432')
const test = process.env.TEST || false

export const backup = () => {return new Promise((resolve: (arg0?: unknown) => void, reject: (arg0?: any) => void) => {
    if(test) {
        return resolve()
    }
    const fileName = __dirname + `/backups/` + `${new Date().toUTCString()}`.replace(/\W/g,'_') + `.sql`
    try {
        /* 
        to restore run
        psql -h localhost -U sdf -d stated < xyz.sql
        */
        const pgdump = cp.spawn(`pg_dump`,[`-h`,`${pgHost}`,`-U`,`${pgUser}`,`-d`,`${pgDatabase}`,`-f`,`${fileName}`], 
        {env: {PGPASSWORD: `${pgPassword}`, ...process.env}})
        pgdump.stdout.on('data', (data) => {
            try {
                log && console.log('data',data)
                return resolve()
            }
            catch(error) {
                return reject(error)
            }
        })
        pgdump.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`); 
            return reject(data)
        })
        pgdump.on('error', (error) => { 
            return reject(Error('pgdump process error: ' + error))
        })
        pgdump.on('close', (code) => {
          if(code === 0) {
            return resolve()
          }
            return reject(Error('pgdump process exited with code ' + code))
        });
    } catch (error){
        return reject(error)
    }
})
};