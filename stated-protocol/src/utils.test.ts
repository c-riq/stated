import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildStatement } from './protocol';
import {
  generateFileHash,
  validateFileHash,
  generateStatementContentHash,
  validateStatementContentHash,
  generateStatementHash,
  validateStatementHash,
  generateStatementsFile,
  splitStatements,
  generateStatementFilename,
  generateAttachmentFilename,
} from './utils';

describe('Statement Utils', () => {
  const testContent = 'test content';
  const testFileContent = Buffer.from('test file content');

  describe('File Hash Functions', () => {
    it('should generate file hash', () => {
      const hash = generateFileHash(testFileContent);
      assert.ok(hash);
      assert.strictEqual(typeof hash, 'string');
    });

    it('should validate file hash', () => {
      const hash = generateFileHash(testFileContent);
      assert.strictEqual(validateFileHash(testFileContent, hash), true);
      assert.strictEqual(validateFileHash(testFileContent, 'invalid-hash'), false);
    });

    it('should generate attachment filename', () => {
      const filename = generateAttachmentFilename(testFileContent, 'pdf');
      assert.ok(/^[A-Za-z0-9_-]+\.pdf$/.test(filename));
    });

    it('should handle extension with dot', () => {
      const filename = generateAttachmentFilename(testFileContent, '.jpg');
      assert.ok(/^[A-Za-z0-9_-]+\.jpg$/.test(filename));
    });
  });

  describe('Statement Content Hash Functions', () => {
    it('should generate statement content hash', () => {
      const hash = generateStatementContentHash(testContent);
      assert.ok(hash);
      assert.strictEqual(typeof hash, 'string');
    });

    it('should validate statement content hash', () => {
      const hash = generateStatementContentHash(testContent);
      assert.strictEqual(validateStatementContentHash(testContent, hash), true);
      assert.strictEqual(validateStatementContentHash(testContent, 'invalid-hash'), false);
    });
  });

  describe('Statement Hash Functions', () => {
    const statement = buildStatement({
      domain: 'example.com',
      author: 'Test Author',
      time: new Date('2023-06-15T20:01:26.000Z'),
      content: 'Test statement content',
    });

    it('should generate statement hash', () => {
      const hash = generateStatementHash(statement);
      assert.ok(hash);
      assert.strictEqual(typeof hash, 'string');
    });

    it('should validate statement hash', () => {
      const hash = generateStatementHash(statement);
      assert.strictEqual(validateStatementHash(statement, hash), true);
      assert.strictEqual(validateStatementHash(statement, 'invalid-hash'), false);
    });

    it('should generate statement filename', () => {
      const filename = generateStatementFilename(statement);
      assert.ok(/^[A-Za-z0-9_-]+\.txt$/.test(filename));
    });

    it('should exclude signature fields from hash', () => {
      const signedStatement =
        statement +
        '---\n' +
        'Statement hash: test-hash\n' +
        'Public key: test-key\n' +
        'Signature: test-signature\n' +
        'Algorithm: Ed25519\n';

      const hash = generateStatementHash(signedStatement);
      const hashWithoutSignature = generateStatementHash(statement);
      assert.strictEqual(hash, hashWithoutSignature);
    });
  });

  describe('Statements File Functions', () => {
    const statement1 = buildStatement({
      domain: 'example.com',
      author: 'Test Author',
      time: new Date('2023-06-15T20:01:26.000Z'),
      content: 'First statement',
    });

    const statement2 = buildStatement({
      domain: 'example.com',
      author: 'Test Author',
      time: new Date('2023-06-16T10:30:00.000Z'),
      content: 'Second statement',
    });

    it('should generate statements file', () => {
      const statementsFile = generateStatementsFile([statement1, statement2]);
      assert.ok(statementsFile.includes(statement1));
      assert.ok(statementsFile.includes(statement2));
      assert.ok(statementsFile.includes('\n\n'));
    });

    it('should split statements file', () => {
      const statementsFile = generateStatementsFile([statement1, statement2]);
      const parsed = splitStatements(statementsFile);
      assert.strictEqual(parsed.length, 2);
      assert.strictEqual(parsed[0], statement1);
      assert.strictEqual(parsed[1], statement2);
    });

    it('should filter empty statements when splitting', () => {
      const fileWithEmpty = statement1 + '\n\n\n\n' + statement2;
      const parsed = splitStatements(fileWithEmpty);
      assert.strictEqual(parsed.length, 2);
    });
  });
});
