import crypto from 'crypto'

export const sha256 = strOrBuffer => {
    const base64 = crypto.createHash('sha256').update(strOrBuffer).digest('base64')
    const urlSafe = base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    return urlSafe
}

export const verify = (content, hash) => {
    return hash === sha256(content)
}
