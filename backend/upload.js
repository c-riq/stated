
import fs from 'node:fs'
import {sha256} from './hash.js'

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const saveFile = async(req) => {
    let result = {error: "File not saved"}
    try {
        const b64 = req.body.file.split("data:application/pdf;base64,")[1]
        const buf = Buffer.from(b64, 'base64')
        const sha = sha256(buf)
        const filePath = 'files/' + sha + ".pdf"
        await fs.writeFileSync(__dirname + '/public/' + filePath, buf, 'binary')
        result = {sha256sum : sha, error: null, filePath}
    } catch (error) {
        return({error})
    }
    return result
}
