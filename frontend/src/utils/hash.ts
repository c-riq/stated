
import {Buffer} from 'buffer';

export const sha256 = async (input: string) => {
    var enc = new TextEncoder(); // utf-8
    const buf = enc.encode(input)
    const hashBuffer = await crypto.subtle.digest('SHA-256', buf)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashB64 = Buffer.from(hashArray).toString('base64');
    const urlSafe = hashB64.replace(/=/g, '').replace(/\+/g, '-')
        .replace(/\//g, '_')
    return urlSafe
}
