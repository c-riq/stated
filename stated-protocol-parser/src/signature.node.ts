import { sign, verify, generateKeyPairSync } from 'crypto'
import { toUrlSafeBase64, fromUrlSafeBase64, sha256 } from './hash.node'
import type { CryptographicallySignedStatement } from './types'

const ALGORITHM = 'Ed25519' // Fully specifies: EdDSA signature scheme with Curve25519

/**
 * Generate a new Ed25519 key pair for signing statements
 * @returns Object containing publicKey and privateKey as URL-safe base64
 */
export const generateKeyPair = (): { publicKey: string; privateKey: string } => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
        publicKeyEncoding: { type: 'spki', format: 'der' },
        privateKeyEncoding: { type: 'pkcs8', format: 'der' }
    })
    return {
        publicKey: toUrlSafeBase64(publicKey.toString('base64')),
        privateKey: toUrlSafeBase64(privateKey.toString('base64'))
    }
}

/**
 * Sign a statement with a private key
 * @param statement - The statement text to sign
 * @param privateKeyUrlSafe - Private key in URL-safe base64 format
 * @returns URL-safe base64-encoded signature
 */
export const signStatement = (statement: string, privateKeyUrlSafe: string): string => {
    const privateKeyDer = Buffer.from(fromUrlSafeBase64(privateKeyUrlSafe), 'base64')
    const signature = sign(null, Buffer.from(statement, 'utf8'), {
        key: privateKeyDer,
        format: 'der',
        type: 'pkcs8'
    })
    return toUrlSafeBase64(signature.toString('base64'))
}

/**
 * Verify a statement signature
 * @param statement - The statement text that was signed
 * @param signatureUrlSafe - URL-safe base64-encoded signature
 * @param publicKeyUrlSafe - Public key in URL-safe base64 format
 * @returns true if signature is valid, false otherwise
 */
export const verifySignature = (statement: string, signatureUrlSafe: string, publicKeyUrlSafe: string): boolean => {
    try {
        const publicKeyDer = Buffer.from(fromUrlSafeBase64(publicKeyUrlSafe), 'base64')
        const signatureBuffer = Buffer.from(fromUrlSafeBase64(signatureUrlSafe), 'base64')
        return verify(null, Buffer.from(statement, 'utf8'), {
            key: publicKeyDer,
            format: 'der',
            type: 'spki'
        }, signatureBuffer)
    } catch (error) {
        return false
    }
}

/**
 * Build a signed statement (Node.js version)
 * @param statement - The statement text to sign
 * @param privateKeyUrlSafe - Private key in URL-safe base64 format
 * @param publicKeyUrlSafe - Public key in URL-safe base64 format
 * @returns Signed statement with appended signature fields
 */
export const buildSignedStatement = (
    statement: string,
    privateKeyUrlSafe: string,
    publicKeyUrlSafe: string
): string => {
    const statementHash = sha256(statement)
    const signature = signStatement(statement, privateKeyUrlSafe)
    return statement +
        `---\n` +
        `Statement hash: ${statementHash}\n` +
        `Public key: ${publicKeyUrlSafe}\n` +
        `Signature: ${signature}\n` +
        `Algorithm: ${ALGORITHM}\n`
}

/**
 * Parse a signed statement (Node.js version)
 * @param signedStatement - The signed statement text
 * @returns Parsed CryptographicallySignedStatement object or null if invalid
 */
export const parseSignedStatement = (signedStatement: string): CryptographicallySignedStatement | null => {
    const regex = /^([\s\S]+?)---\nStatement hash: ([A-Za-z0-9_-]+)\nPublic key: ([A-Za-z0-9_-]+)\nSignature: ([A-Za-z0-9_-]+)\nAlgorithm: ([^\n]+)\n$/
    const match = signedStatement.match(regex)
    
    if (!match) return null
    
    const statement = match[1]
    const statementHash = match[2]
    const publicKey = match[3]
    const signature = match[4]
    const algorithm = match[5]
    
    // Verify statement hash matches
    const computedHash = sha256(statement)
    if (computedHash !== statementHash) {
        return null
    }
    
    // Verify algorithm is supported
    if (algorithm !== ALGORITHM) {
        return null
    }
    
    return {
        statement,
        publicKey,
        signature,
        statementHash,
        algorithm
    }
}

/**
 * Verify a signed statement (Node.js version)
 * @param signedStatement - The signed statement text
 * @returns true if signature is valid, false otherwise
 */
export const verifySignedStatement = (signedStatement: string): boolean => {
    const parsed = parseSignedStatement(signedStatement)
    if (!parsed) return false
    
    return verifySignature(parsed.statement, parsed.signature, parsed.publicKey)
}