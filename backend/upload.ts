// @ts-nocheck

import * as cp from 'child_process'

import fs from 'node:fs'
import {sha256} from './hash'

const log=false

export const saveFile = async(req) => {
    let result = {error: "File not saved"}
    try {
        const b64 = req.body.file.split("data:application/pdf;base64,")[1]
        const buf = Buffer.from(b64, 'base64')
        if(Buffer.byteLength(buf) > 25000000){
            return({error: 'File too large'})
        }
        const sha = sha256(buf)
        const filePath = 'files/' + sha + ".pdf"
        const fsFilePath = __dirname + '/public/' + filePath
        await fs.writeFileSync(fsFilePath, buf, 'binary')
        const {validPDF} = await checkPDF(fsFilePath)
        if (false && !validPDF) {
            fs.unlinkSync(fsFilePath)
            result = {error: 'Error saving PDF'}
        } else {
            result = {sha256sum : sha, error: null, filePath}
        }
    } catch (error) {
        return({error})
    }
    return result
}

export const checkPDF = (filePath) => new Promise((resolve, reject) => {
    try {
        log && console.log('checkPDF', filePath)
        if (! /^[a-zA-Z0-9\.\-_\/]{1,290}\.pdf$/.test(filePath)) {
            console.log('invalid file path', filePath)
            resolve({error: 'invalid file path '+ filePath})
        }
        //const qpdf = cp.spawn('pdfinfo', [`${filePath}`])
        const qpdf = cp.spawn('qpdf', ['--check', `${filePath}`])
        //        const qpdf = cp.spawn('open', [`'${filePath}'`])

        qpdf.stdout.on('data', (data) => {
            try {
                log && console.log('data',data)
                const outputOk = (''+data).match("PDF Version: ")
                if (!outputOk) {
                    resolve({error: 'not fully validated', data})
                    return
                } else {
                    resolve({validPDF: true})
                }
            }
            catch(error) {
                resolve({error})
            }
        })
        qpdf.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`); 
            resolve({error: data})
        })
        qpdf.on('error', (error) => { 
            resolve({error: 'qpdf process error: ' + error}) 
        })
        qpdf.on('close', function (code) {
            resolve({error: 'qpdf process exited with code ' + code})
        });
          
    } catch (error){
        resolve({error})
    }
})
