const crypto = require('crypto')


const verify = (content, hash) => {
    const computedHash = crypto.createHash('sha256').update(content).digest('base64');
    console.log("verifyHash", hash, content, computedHash, hash == computedHash)
    return hash == computedHash
}
const hexToB64 = (hex) => Buffer.from(hex || '', 'hex').toString('base64')
const b64ToHex = (b64) => Buffer.from(b64, 'base64').toString('hex')


module.exports = {
    verify,
    hexToB64,
    b64ToHex
}
