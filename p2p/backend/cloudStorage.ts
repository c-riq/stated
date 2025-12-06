import AWS from 'aws-sdk'
import fs from 'node:fs'

import { request } from 'https'

const s3Bucket = process.env.S3_BUCKET || ''

const s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
})

const url = (key: string) => `https://${s3Bucket}.s3.amazonaws.com/${key}`

const checkIfFileExists = async (fileName: string) => {
    const fullUrl = url(fileName)
    try {
        const res = await new Promise((resolve, reject) => {
            try {
            const req = request(fullUrl, {
                method: 'HEAD',
            })
            req.on('response', (response) => {
                resolve(response.statusCode === 200)
            })
            req.on('error', (error) => {
                console.log('error: ', error)
                reject(error)
            })
            req.end()
            } catch (error) {
                console.log('error: ', error)
                reject(error)
            }
        })
        if (res) {
            return fullUrl
        }
        return false
    } catch (error) {
        return false
    }
}

const uploadFile = async (key: string, body: Buffer) => {
    await s3.upload({
        Bucket: s3Bucket,
        Key: key,
        Body: body,
        ContentType: 'application/pdf',
        ContentDisposition: 'inline'
    }).promise()
}

const getCloudStorageUrl = async (key: string) => {
    const exists = await checkIfFileExists(key)
    if (exists) {
        // redirect to the file
        return `https://${s3Bucket}.s3.amazonaws.com/${key}`
    }
}

const upLoadAndDeleteFiles = async () => {
    if (!fs.existsSync(__dirname + '/public/files')){
        return
    }
    const files = fs.readdirSync(__dirname + '/public/files')
    for (const file of files) {
        const exists = await checkIfFileExists(file)
        if (exists) {
            console.log('file exists in cloud storage, deleting: ', file)
            fs.unlinkSync(__dirname + '/public/files/' + file)
            continue
        }
        const filePath = __dirname + '/public/files/' + file
        const buffer = fs.readFileSync(filePath)
        try {
            await uploadFile(file, buffer)
        }
        catch (error) {
            console.log('error uploading file: ', error)
            continue
        }
    }
}

const setupSchedule = (n: number) => {
    setInterval(() => {
        upLoadAndDeleteFiles()
    }, n)
}
export default {
    setupSchedule,
    getCloudStorageUrl
}
