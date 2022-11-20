import crypto from 'crypto'

export const sha256Hash = str => crypto.createHash('sha256').update(str).digest('base64');

export const verify = (content, hash) => {
    return hash === sha256Hash(content)
}
export const hexToB64 = (hex) => Buffer.from(hex || '', 'hex').toString('base64')
export const b64ToHex = (b64) => Buffer.from(b64, 'base64').toString('hex')
