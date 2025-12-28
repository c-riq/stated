import { generateKeyPair, signStatement, verifySignature, buildSignedStatement, parseSignedStatement, verifySignedStatement } from './signature.node'
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

    beforeAll(() => {
        const keys = generateKeyPair()
        publicKey = keys.publicKey
        privateKey = keys.privateKey
    })

    describe('generateKeyPair', () => {
        it('should generate a valid Ed25519 key pair in URL-safe base64', () => {
            const keys = generateKeyPair()
            expect(keys.publicKey).toBeTruthy()
            expect(keys.privateKey).toBeTruthy()
            // URL-safe base64 should not contain +, /, or =
            expect(keys.publicKey).toMatch(/^[A-Za-z0-9_-]+$/)
            expect(keys.privateKey).toMatch(/^[A-Za-z0-9_-]+$/)
        })
    })

    describe('signStatement', () => {
        it('should sign a statement and return URL-safe base64 signature', () => {
            const signature = signStatement(testStatement, privateKey)
            expect(signature).toBeTruthy()
            expect(typeof signature).toBe('string')
            // URL-safe base64 signature
            expect(signature).toMatch(/^[A-Za-z0-9_-]+$/)
        })
    })

    describe('verifySignature', () => {
        it('should verify a valid signature', () => {
            const signature = signStatement(testStatement, privateKey)
            const isValid = verifySignature(testStatement, signature, publicKey)
            expect(isValid).toBe(true)
        })

        it('should reject an invalid signature', () => {
            const signature = signStatement(testStatement, privateKey)
            const tamperedStatement = testStatement.replace('Test Author', 'Hacker')
            const isValid = verifySignature(tamperedStatement, signature, publicKey)
            expect(isValid).toBe(false)
        })

        it('should reject a signature with wrong public key', () => {
            const signature = signStatement(testStatement, privateKey)
            const { publicKey: wrongPublicKey } = generateKeyPair()
            const isValid = verifySignature(testStatement, signature, wrongPublicKey)
            expect(isValid).toBe(false)
        })
    })

    describe('buildSignedStatement', () => {
        it('should build a properly formatted signed statement', () => {
            const signedStatement = buildSignedStatement(testStatement, privateKey, publicKey)
            expect(signedStatement).toContain(testStatement)
            expect(signedStatement).toContain('---')
            expect(signedStatement).toContain('Statement hash:')
            expect(signedStatement).toContain('Public key:')
            expect(signedStatement).toContain('Signature:')
            expect(signedStatement).toContain('Algorithm: Ed25519')
            expect(signedStatement).toContain(publicKey)
        })
    })

    describe('parseSignedStatement', () => {
        it('should parse a valid signed statement', () => {
            const signedStatement = buildSignedStatement(testStatement, privateKey, publicKey)
            const parsed = parseSignedStatement(signedStatement)
            
            expect(parsed).not.toBeNull()
            expect(parsed?.statement).toBe(testStatement)
            expect(parsed?.statementHash).toBeTruthy()
            expect(parsed?.publicKey).toBe(publicKey)
            expect(parsed?.signature).toBeTruthy()
            expect(parsed?.algorithm).toBe('Ed25519')
        })

        it('should return null for invalid format', () => {
            const invalidStatement = 'This is not a signed statement'
            const parsed = parseSignedStatement(invalidStatement)
            expect(parsed).toBeNull()
        })

        it('should reject statement with tampered hash', () => {
            const signedStatement = buildSignedStatement(testStatement, privateKey, publicKey)
            // Tamper with the hash
            const tamperedStatement = signedStatement.replace(/Statement hash: [A-Za-z0-9_-]+/, 'Statement hash: invalid_hash_here')
            const parsed = parseSignedStatement(tamperedStatement)
            expect(parsed).toBeNull()
        })

        it('should reject statement with unsupported algorithm', () => {
            const signedStatement = buildSignedStatement(testStatement, privateKey, publicKey)
            // Change algorithm
            const tamperedStatement = signedStatement.replace('Algorithm: Ed25519', 'Algorithm: RSA')
            const parsed = parseSignedStatement(tamperedStatement)
            expect(parsed).toBeNull()
        })
    })

    describe('verifySignedStatement', () => {
        it('should verify a valid signed statement', () => {
            const signedStatement = buildSignedStatement(testStatement, privateKey, publicKey)
            const isValid = verifySignedStatement(signedStatement)
            expect(isValid).toBe(true)
        })

        it('should reject a tampered signed statement', () => {
            const signedStatement = buildSignedStatement(testStatement, privateKey, publicKey)
            const tamperedStatement = signedStatement.replace('Test Author', 'Hacker')
            const isValid = verifySignedStatement(tamperedStatement)
            expect(isValid).toBe(false)
        })
    })

    describe('Integration with buildStatement and parseStatement', () => {
        it('should work with statements built using buildStatement', () => {
            const statement = buildStatement({
                domain: 'example.com',
                author: 'Test Author',
                time: new Date('2023-06-15T20:01:26Z'),
                content: 'This is a test statement'
            })

            const signedStatement = buildSignedStatement(statement, privateKey, publicKey)
            const isValid = verifySignedStatement(signedStatement)
            expect(isValid).toBe(true)

            const parsed = parseSignedStatement(signedStatement)
            expect(parsed?.statement).toBe(statement)
        })

        it('should automatically verify signature when parsing with parseStatement', () => {
            const statement = buildStatement({
                domain: 'example.com',
                author: 'Test Author',
                time: new Date('2023-06-15T20:01:26Z'),
                content: 'This is a test statement'
            })

            const signedStatement = buildSignedStatement(statement, privateKey, publicKey)
            
            // parseStatement should automatically verify the signature
            const parsed = parseStatement({ statement: signedStatement })
            expect(parsed.domain).toBe('example.com')
            expect(parsed.author).toBe('Test Author')
            expect(parsed.content).toBe('This is a test statement\n')
        })

        it('should reject tampered signed statement in parseStatement', () => {
            const statement = buildStatement({
                domain: 'example.com',
                author: 'Test Author',
                time: new Date('2023-06-15T20:01:26Z'),
                content: 'This is a test statement'
            })

            const signedStatement = buildSignedStatement(statement, privateKey, publicKey)
            const tamperedStatement = signedStatement.replace('Test Author', 'Hacker')
            
            // parseStatement should throw an error for tampering (either hash mismatch or invalid signature)
            expect(() => {
                parseStatement({ statement: tamperedStatement })
            }).toThrow(/Statement hash mismatch|Invalid cryptographic signature/)
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
            expect(parsed.domain).toBe('example.com')
            expect(parsed.author).toBe('Test Author')
            expect(parsed.content).toBe('This is a test statement\n')
        })
    })
})