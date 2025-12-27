/**
 * Example: Using Cryptographic Signatures with Stated Protocol (Version 5)
 * 
 * This example demonstrates how to:
 * 1. Generate Ed25519 key pairs
 * 2. Build and sign statements
 * 3. Verify signed statements
 * 4. Parse signed statement wrappers
 */

import {
    buildStatement,
    generateKeyPair,
    signStatement,
    verifySignature,
    buildSignedStatement,
    parseSignedStatement,
    verifySignedStatement
} from '../src/index.node'

// Example 1: Generate a key pair
console.log('=== Example 1: Generate Key Pair ===')
const { publicKey, privateKey } = generateKeyPair()
console.log('Public Key (first 50 chars):', publicKey.substring(0, 50) + '...')
console.log('Private Key (first 50 chars):', privateKey.substring(0, 50) + '...')
console.log()

// Example 2: Build a statement
console.log('=== Example 2: Build Statement ===')
const statement = buildStatement({
    domain: 'example.com',
    author: 'Example Organization',
    time: new Date('2023-12-25T14:00:00Z'),
    tags: ['announcement', 'signed'],
    content: 'This is our official signed statement for version 5 of the protocol.'
})
console.log('Statement:')
console.log(statement)
console.log()

// Example 3: Sign the statement directly
console.log('=== Example 3: Sign Statement ===')
const signature = signStatement(statement, privateKey)
console.log('Signature:', signature)
console.log()

// Example 4: Verify the signature
console.log('=== Example 4: Verify Signature ===')
const isValid = verifySignature(statement, signature, publicKey)
console.log('Signature valid:', isValid)
console.log()

// Example 5: Build a signed statement wrapper
console.log('=== Example 5: Build Signed Statement Wrapper ===')
const signedStatement = buildSignedStatement(statement, privateKey, publicKey)
console.log('Signed Statement:')
console.log(signedStatement)
console.log()

// Example 6: Parse the signed statement wrapper
console.log('=== Example 6: Parse Signed Statement ===')
const parsed = parseSignedStatement(signedStatement)
if (parsed) {
    console.log('Parsed successfully!')
    console.log('Algorithm:', parsed.algorithm)
    console.log('Statement (first 100 chars):', parsed.statement.substring(0, 100) + '...')
    console.log('Public Key (first 50 chars):', parsed.publicKey.substring(0, 50) + '...')
    console.log('Signature (first 50 chars):', parsed.signature.substring(0, 50) + '...')
} else {
    console.log('Failed to parse signed statement')
}
console.log()

// Example 7: Verify the signed statement wrapper
console.log('=== Example 7: Verify Signed Statement Wrapper ===')
const wrapperValid = verifySignedStatement(signedStatement)
console.log('Signed statement valid:', wrapperValid)
console.log()

// Example 8: Detect tampering
console.log('=== Example 8: Detect Tampering ===')
const tamperedStatement = signedStatement.replace('Example Organization', 'Fake Organization')
const tamperedValid = verifySignedStatement(tamperedStatement)
console.log('Tampered statement valid:', tamperedValid)
console.log()

// Example 9: Wrong public key
console.log('=== Example 9: Wrong Public Key ===')
const { publicKey: wrongPublicKey } = generateKeyPair()
const wrongKeyValid = verifySignature(statement, signature, wrongPublicKey)
console.log('Signature valid with wrong key:', wrongKeyValid)
console.log()

// Example 10: Complete workflow
console.log('=== Example 10: Complete Workflow ===')
console.log('1. Generate keys')
const keys = generateKeyPair()

console.log('2. Create statement')
const myStatement = buildStatement({
    domain: 'mycompany.com',
    author: 'My Company Inc.',
    time: new Date(),
    content: 'We hereby announce our new product launch.'
})

console.log('3. Sign and wrap statement')
const mySignedStatement = buildSignedStatement(myStatement, keys.privateKey, keys.publicKey)

console.log('4. Verify signature')
const myValid = verifySignedStatement(mySignedStatement)
console.log('Final verification result:', myValid)

console.log('\n✅ All examples completed successfully!')