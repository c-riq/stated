const crypto = require('crypto')

const sha256Hash = str => crypto.createHash('sha256').update(str).digest('base64');

const verify = (content, hash) => {
    return hash === sha256Hash(content)
}
const hexToB64 = (hex) => Buffer.from(hex || '', 'hex').toString('base64')
const b64ToHex = (b64) => Buffer.from(b64, 'base64').toString('hex')


module.exports = {
    verify,
    sha256Hash,
    hexToB64,
    b64ToHex
}
