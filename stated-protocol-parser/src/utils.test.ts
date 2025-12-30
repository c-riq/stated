import { buildStatement } from './protocol'
import {
    generateFileHash,
    validateFileHash,
    generateStatementContentHash,
    validateStatementContentHash,
    generateStatementHash,
    validateStatementHash,
    generateStatementsFile,
    parseStatementsFile,
    generateStatementFilename,
    generateAttachmentFilename
} from './utils.node'

describe('Statement Utils', () => {
    const testContent = 'test content'
    const testFileContent = Buffer.from('test file content')

    describe('File Hash Functions', () => {
        it('should generate file hash', () => {
            const hash = generateFileHash(testFileContent)
            expect(hash).toBeTruthy()
            expect(typeof hash).toBe('string')
        })

        it('should validate file hash', () => {
            const hash = generateFileHash(testFileContent)
            expect(validateFileHash(testFileContent, hash)).toBe(true)
            expect(validateFileHash(testFileContent, 'invalid-hash')).toBe(false)
        })

        it('should generate attachment filename', () => {
            const filename = generateAttachmentFilename(testFileContent, 'pdf')
            expect(filename).toMatch(/^[A-Za-z0-9_-]+\.pdf$/)
        })

        it('should handle extension with dot', () => {
            const filename = generateAttachmentFilename(testFileContent, '.jpg')
            expect(filename).toMatch(/^[A-Za-z0-9_-]+\.jpg$/)
        })
    })

    describe('Statement Content Hash Functions', () => {
        it('should generate statement content hash', () => {
            const hash = generateStatementContentHash(testContent)
            expect(hash).toBeTruthy()
            expect(typeof hash).toBe('string')
        })

        it('should validate statement content hash', () => {
            const hash = generateStatementContentHash(testContent)
            expect(validateStatementContentHash(testContent, hash)).toBe(true)
            expect(validateStatementContentHash(testContent, 'invalid-hash')).toBe(false)
        })
    })

    describe('Statement Hash Functions', () => {
        const statement = buildStatement({
            domain: 'example.com',
            author: 'Test Author',
            time: new Date('2023-06-15T20:01:26.000Z'),
            content: 'Test statement content'
        })

        it('should generate statement hash', () => {
            const hash = generateStatementHash(statement)
            expect(hash).toBeTruthy()
            expect(typeof hash).toBe('string')
        })

        it('should validate statement hash', () => {
            const hash = generateStatementHash(statement)
            expect(validateStatementHash(statement, hash)).toBe(true)
            expect(validateStatementHash(statement, 'invalid-hash')).toBe(false)
        })

        it('should generate statement filename', () => {
            const filename = generateStatementFilename(statement)
            expect(filename).toMatch(/^[A-Za-z0-9_-]+\.txt$/)
        })

        it('should exclude signature fields from hash', () => {
            const signedStatement = statement + '---\n' +
                'Statement hash: test-hash\n' +
                'Public key: test-key\n' +
                'Signature: test-signature\n' +
                'Algorithm: Ed25519\n'
            
            const hash = generateStatementHash(signedStatement)
            const hashWithoutSignature = generateStatementHash(statement)
            expect(hash).toBe(hashWithoutSignature)
        })
    })

    describe('Statements File Functions', () => {
        const statement1 = buildStatement({
            domain: 'example.com',
            author: 'Test Author',
            time: new Date('2023-06-15T20:01:26.000Z'),
            content: 'First statement'
        })

        const statement2 = buildStatement({
            domain: 'example.com',
            author: 'Test Author',
            time: new Date('2023-06-16T10:30:00.000Z'),
            content: 'Second statement'
        })

        it('should generate statements file', () => {
            const statementsFile = generateStatementsFile([statement1, statement2])
            expect(statementsFile).toContain(statement1)
            expect(statementsFile).toContain(statement2)
            expect(statementsFile).toContain('\n\n')
        })

        it('should parse statements file', () => {
            const statementsFile = generateStatementsFile([statement1, statement2])
            const parsed = parseStatementsFile(statementsFile)
            expect(parsed).toHaveLength(2)
            expect(parsed[0]).toBe(statement1)
            expect(parsed[1]).toBe(statement2)
        })

        it('should throw error for invalid statement in file', () => {
            const invalidFile = 'Invalid statement\n\nAnother invalid statement'
            expect(() => parseStatementsFile(invalidFile)).toThrow()
        })

        it('should filter empty statements', () => {
            const fileWithEmpty = statement1 + '\n\n\n\n' + statement2
            const parsed = parseStatementsFile(fileWithEmpty)
            expect(parsed).toHaveLength(2)
        })
    })
})