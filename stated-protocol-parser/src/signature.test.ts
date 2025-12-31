import { describe, it, before } from 'node:test'
import assert from 'node:assert'
import { generateKeyPair, signStatement, verifySignature, buildSignedStatement, parseSignedStatement, verifySignedStatement } from './signature'
import { buildStatement, parseStatement } from './protocol'

describe('Signature Functions', () => {
    let publicKey: string
    let privateKey: string
    const testStatement = `Stated protocol version: 5
Publishing domain: example.com
Author: Test Author
Time: Thu, 15 Jun 2023 20:01:26 GMT
Statement content:
This is a test statement
`

    before(async () => {
        const keys = await generateKeyPair()
        publicKey = keys.publicKey
        privateKey = keys.privateKey
    })

    describe('generateKeyPair', () => {
        it('should generate a valid Ed25519 key pair in URL-safe base64', async () => {
            const keys = await generateKeyPair()
            assert.ok(keys.publicKey)
            assert.ok(keys.privateKey)
            assert.ok(/^[A-Za-z0-9_-]+$/.test(keys.publicKey))
            assert.ok(/^[A-Za-z0-9_-]+$/.test(keys.privateKey))
        })
    })

    describe('signStatement', () => {
        it('should sign a statement and return URL-safe base64 signature', async () => {
            const signature = await signStatement(testStatement, privateKey)
            assert.ok(signature)
            assert.strictEqual(typeof signature, 'string')
            assert.ok(/^[A-Za-z0-9_-]+$/.test(signature))
        })
    })

    describe('verifySignature', () => {
        it('should verify a valid signature', async () => {
            const signature = await signStatement(testStatement, privateKey)
            const isValid = await verifySignature(testStatement, signature, publicKey)
            assert.strictEqual(isValid, true)
        })

        it('should reject an invalid signature', async () => {
            const signature = await signStatement(testStatement, privateKey)
            const tamperedStatement = testStatement.replace('Test Author', 'Hacker')
            const isValid = await verifySignature(tamperedStatement, signature, publicKey)
            assert.strictEqual(isValid, false)
        })

        it('should reject a signature with wrong public key', async () => {
            const signature = await signStatement(testStatement, privateKey)
            const { publicKey: wrongPublicKey } = await generateKeyPair()
            const isValid = await verifySignature(testStatement, signature, wrongPublicKey)
            assert.strictEqual(isValid, false)
        })
    })

    describe('buildSignedStatement', () => {
        it('should build a properly formatted signed statement', async () => {
            const signedStatement = await buildSignedStatement(testStatement, privateKey, publicKey)
            assert.ok(signedStatement.includes(testStatement))
            assert.ok(signedStatement.includes('---'))
            assert.ok(signedStatement.includes('Statement hash:'))
            assert.ok(signedStatement.includes('Public key:'))
            assert.ok(signedStatement.includes('Signature:'))
            assert.ok(signedStatement.includes('Algorithm: Ed25519'))
            assert.ok(signedStatement.includes(publicKey))
        })
    })

    describe('parseSignedStatement', () => {
        it('should parse a valid signed statement', async () => {
            const signedStatement = await buildSignedStatement(testStatement, privateKey, publicKey)
            const parsed = parseSignedStatement(signedStatement)
            
            assert.ok(parsed !== null)
            assert.strictEqual(parsed?.statement, testStatement)
            assert.ok(parsed?.statementHash)
            assert.strictEqual(parsed?.publicKey, publicKey)
            assert.ok(parsed?.signature)
            assert.strictEqual(parsed?.algorithm, 'Ed25519')
        })

        it('should return null for invalid format', () => {
            const invalidStatement = 'This is not a signed statement'
            const parsed = parseSignedStatement(invalidStatement)
            assert.strictEqual(parsed, null)
        })

        it('should reject statement with tampered hash', async () => {
            const signedStatement = await buildSignedStatement(testStatement, privateKey, publicKey)
            const tamperedStatement = signedStatement.replace(/Statement hash: [A-Za-z0-9_-]+/, 'Statement hash: invalid_hash_here')
            const parsed = parseSignedStatement(tamperedStatement)
            assert.strictEqual(parsed, null)
        })

        it('should reject statement with unsupported algorithm', async () => {
            const signedStatement = await buildSignedStatement(testStatement, privateKey, publicKey)
            const tamperedStatement = signedStatement.replace('Algorithm: Ed25519', 'Algorithm: RSA')
            const parsed = parseSignedStatement(tamperedStatement)
            assert.strictEqual(parsed, null)
        })
    })

    describe('verifySignedStatement', () => {
        it('should verify a valid signed statement', async () => {
            const signedStatement = await buildSignedStatement(testStatement, privateKey, publicKey)
            const isValid = await verifySignedStatement(signedStatement)
            assert.strictEqual(isValid, true)
        })

        it('should reject a tampered signed statement', async () => {
            const signedStatement = await buildSignedStatement(testStatement, privateKey, publicKey)
            const tamperedStatement = signedStatement.replace('Test Author', 'Hacker')
            const isValid = await verifySignedStatement(tamperedStatement)
            assert.strictEqual(isValid, false)
        })
    })

    describe('Integration with buildStatement and parseStatement', () => {
        it('should work with statements built using buildStatement', async () => {
            const statement = buildStatement({
                domain: 'example.com',
                author: 'Test Author',
                time: new Date('2023-06-15T20:01:26Z'),
                content: 'This is a test statement'
            })

            const signedStatement = await buildSignedStatement(statement, privateKey, publicKey)
            const isValid = await verifySignedStatement(signedStatement)
            assert.strictEqual(isValid, true)

            const parsed = parseSignedStatement(signedStatement)
            assert.strictEqual(parsed?.statement, statement)
        })

        it('should automatically verify signature when parsing with parseStatement', async () => {
            const statement = buildStatement({
                domain: 'example.com',
                author: 'Test Author',
                time: new Date('2023-06-15T20:01:26Z'),
                content: 'This is a test statement'
            })

            const signedStatement = await buildSignedStatement(statement, privateKey, publicKey)
            
            const parsed = parseStatement({ statement: signedStatement })
            assert.strictEqual(parsed.domain, 'example.com')
            assert.strictEqual(parsed.author, 'Test Author')
            assert.strictEqual(parsed.content, 'This is a test statement')
        })

        it('should reject tampered signed statement in parseStatement', async () => {
            const statement = buildStatement({
                domain: 'example.com',
                author: 'Test Author',
                time: new Date('2023-06-15T20:01:26Z'),
                content: 'This is a test statement'
            })

            const signedStatement = await buildSignedStatement(statement, privateKey, publicKey)
            const tamperedStatement = signedStatement.replace('Test Author', 'Hacker')
            
            assert.throws(() => {
                parseStatement({ statement: tamperedStatement })
            }, /Statement hash mismatch|Invalid cryptographic signature/)
        })

        it('should still parse unsigned statements (backward compatibility)', () => {
            const statement = buildStatement({
                domain: 'example.com',
                author: 'Test Author',
                time: new Date('2023-06-15T20:01:26Z'),
                content: 'This is a test statement'
            })

            // Should parse successfully without signature
            const parsed = parseStatement({ statement })
            assert.strictEqual(parsed.domain, 'example.com')
            assert.strictEqual(parsed.author, 'Test Author')
            assert.strictEqual(parsed.content, 'This is a test statement')
        })
    })
})