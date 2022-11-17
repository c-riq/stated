
import {Buffer} from 'buffer';

export const b64ToHex = (b64) => {
    const buffer = Buffer.from(b64, 'base64');
    return buffer.toString('hex');
}

export const digest = async (input) => {
    var enc = new TextEncoder(); // utf-8
    const buf = enc.encode(input)
    const hashBuffer = await crypto.subtle.digest('SHA-256', buf)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashB64 = Buffer.from(hashArray).toString('base64');
    return hashB64
}
