import type { CryptographicallySignedStatement } from './types'
import { toUrlSafeBase64, fromUrlSafeBase64, sha256 } from './hash.browser'

const ALGORITHM = 'Ed25519' // Fully specifies: EdDSA signature scheme with Curve25519

/**
 * Generate a new Ed25519 key pair for signing statements (browser version)
 * @returns Object containing publicKey and privateKey as URL-safe base64
 */
export const generateKeyPair = async (): Promise<{ publicKey: string; privateKey: string }> => {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'Ed25519',
        } as any,
        true,
        ['sign', 'verify']
    )
    
    // Export as raw format for consistency with Node.js
    const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey)
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey)
    
    // Convert raw public key to base64
    const publicKeyArray = Array.from(new Uint8Array(publicKeyRaw))
    const publicKeyBase64 = btoa(String.fromCharCode(...publicKeyArray))
    
    // Extract private key bytes from JWK (d parameter contains the private key)
    const privateKeyBytes = Uint8Array.from(atob(privateKeyJwk.d!), c => c.charCodeAt(0))
    const privateKeyBase64 = btoa(String.fromCharCode(...Array.from(privateKeyBytes)))
    
    return {
        publicKey: toUrlSafeBase64(publicKeyBase64),
        privateKey: toUrlSafeBase64(privateKeyBase64)
    }
}

/**
 * Sign a statement with a private key (browser version)
 * @param statement - The statement text to sign
 * @param privateKeyUrlSafe - Private key in URL-safe base64 format
 * @returns URL-safe base64-encoded signature
 */
export const signStatement = async (statement: string, privateKeyUrlSafe: string): Promise<string> => {
    const privateKeyBytes = Uint8Array.from(atob(fromUrlSafeBase64(privateKeyUrlSafe)), c => c.charCodeAt(0))
    
    // Import private key from raw bytes
    const privateKey = await crypto.subtle.importKey(
        'jwk',
        {
            kty: 'OKP',
            crv: 'Ed25519',
            d: btoa(String.fromCharCode(...Array.from(privateKeyBytes))),
            ext: true
        },
        {
            name: 'Ed25519',
        } as any,
        false,
        ['sign']
    )
    
    const encoder = new TextEncoder()
    const data = encoder.encode(statement)
    const signature = await crypto.subtle.sign('Ed25519' as any, privateKey, data)
    
    // Convert ArrayBuffer to URL-safe base64
    const signatureArray = Array.from(new Uint8Array(signature))
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray))
    return toUrlSafeBase64(signatureBase64)
}

/**
 * Verify a statement signature (browser version)
 * @param statement - The statement text that was signed
 * @param signatureUrlSafe - URL-safe base64-encoded signature
 * @param publicKeyUrlSafe - Public key in URL-safe base64 format
 * @returns true if signature is valid, false otherwise
 */
export const verifySignature = async (statement: string, signatureUrlSafe: string, publicKeyUrlSafe: string): Promise<boolean> => {
    try {
        const publicKeyBytes = Uint8Array.from(atob(fromUrlSafeBase64(publicKeyUrlSafe)), c => c.charCodeAt(0))
        
        // Import public key from raw bytes
        const publicKey = await crypto.subtle.importKey(
            'raw',
            publicKeyBytes,
            {
                name: 'Ed25519',
            } as any,
            false,
            ['verify']
        )
        
        const encoder = new TextEncoder()
        const data = encoder.encode(statement)
        
        // Convert URL-safe base64 to ArrayBuffer
        const signatureStr = atob(fromUrlSafeBase64(signatureUrlSafe))
        const signatureArray = new Uint8Array(signatureStr.length)
        for (let i = 0; i < signatureStr.length; i++) {
            signatureArray[i] = signatureStr.charCodeAt(i)
        }
        
        return await crypto.subtle.verify('Ed25519' as any, publicKey, signatureArray, data)
    } catch (error) {
        return false
    }
}

/**
 * Build a signed statement (browser version)
 * @param statement - The statement text to sign
 * @param privateKeyUrlSafe - Private key in URL-safe base64 format
 * @param publicKeyUrlSafe - Public key in URL-safe base64 format
 * @returns Signed statement with appended signature fields
 */
export const buildSignedStatement = async (statement: string, privateKeyUrlSafe: string, publicKeyUrlSafe: string): Promise<string> => {
    const statementHash = await sha256(statement)
    const signature = await signStatement(statement, privateKeyUrlSafe)
    return statement +
        `---\n` +
        `Statement hash: ${statementHash}\n` +
        `Public key: ${publicKeyUrlSafe}\n` +
        `Signature: ${signature}\n` +
        `Algorithm: ${ALGORITHM}\n`
}

/**
 * Parse a signed statement (browser version)
 * @param signedStatement - The signed statement text
 * @returns Parsed CryptographicallySignedStatement object or null if invalid
 */
export const parseSignedStatement = async (signedStatement: string): Promise<CryptographicallySignedStatement | null> => {
    const regex = /^([\s\S]+?)---\nStatement hash: ([A-Za-z0-9_-]+)\nPublic key: ([A-Za-z0-9_-]+)\nSignature: ([A-Za-z0-9_-]+)\nAlgorithm: ([^\n]+)\n$/
    const match = signedStatement.match(regex)
    
    if (!match) return null
    
    const statement = match[1]
    const statementHash = match[2]
    const publicKey = match[3]
    const signature = match[4]
    const algorithm = match[5]
    
    // Verify statement hash matches
    const computedHash = await sha256(statement)
    if (computedHash !== statementHash) {
        return null
    }
    
    // Verify algorithm is supported
    if (algorithm !== ALGORITHM) {
        return null
    }
    
    return {
        statement,
        statementHash,
        publicKey,
        signature,
        algorithm
    }
}

/**
 * Verify a signed statement (browser version)
 * @param signedStatement - The signed statement text
 * @returns true if signature is valid, false otherwise
 */
export const verifySignedStatement = async (signedStatement: string): Promise<boolean> => {
    const parsed = await parseSignedStatement(signedStatement)
    if (!parsed) return false
    
    return await verifySignature(parsed.statement, parsed.signature, parsed.publicKey)
}