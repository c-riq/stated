import * as cp from 'child_process'

import fs from 'node:fs'
import {sha256} from './hash'

const log=false

if (!fs.existsSync(__dirname + '/public/files')){
    fs.mkdirSync(__dirname + '/public/files');
}

export const saveFile = async(req) => {
    let result
    const b64 = req.body.file.split("data:application/pdf;base64,")[1]
    const buf = Buffer.from(b64, 'base64')
    if(Buffer.byteLength(buf) > 25000000){
        return({error: 'File too large'})
    }
    const sha = sha256(buf)
    const filePath = 'files/' + sha + ".pdf"
    const fsFilePath = __dirname + '/public/' + filePath
    await fs.writeFileSync(fsFilePath, buf, 'binary')
    let validPDF = false
    try{
        validPDF = await checkPDF(fsFilePath) as boolean
    } catch(error) {}
    if (false && !validPDF) {
        // TODO: fix
        fs.unlinkSync(fsFilePath)
        throw('Error saving PDF')
    } else {
        result = {sha256sum : sha, error: null, filePath}
    }
    return result
}

export const checkPDF = (filePath) => new Promise((resolve, reject) => {
    try {
        log && console.log('checkPDF', filePath)
        if (! /^[a-zA-Z0-9\.\-_\/]{1,290}\.pdf$/.test(filePath)) {
            console.log('invalid file path', filePath)
            reject({error: 'invalid file path '+ filePath})
        }
        //const qpdf = cp.spawn('pdfinfo', [`${filePath}`])
        const qpdf = cp.spawn('qpdf', ['--check', `${filePath}`])
        //        const qpdf = cp.spawn('open', [`'${filePath}'`])

        qpdf.stdout.on('data', (data) => {
            try {
                log && console.log('data',data)
                const outputOk = (''+data).match("PDF Version: ")
                if (!outputOk) {
                    reject({error: 'not fully validated', data})
                    return
                } else {
                    resolve(true)
                }
            }
            catch(error) {
                reject({error})
            }
        })
        qpdf.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`); 
            reject({error: data})
        })
        qpdf.on('error', (error) => { 
            reject({error: 'qpdf process error: ' + error}) 
        })
        qpdf.on('close', function (code) {
            reject({error: 'qpdf process exited with code ' + code})
        });
          
    } catch (error){
        reject({error})
    }
})
