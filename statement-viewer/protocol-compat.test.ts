import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
    parseStatementCompat,
    parseOrganisationVerificationCompat,
    parsePDFSigningCompat,
    extractPdfHash,
    extractProfilePicture,
} from './protocol-compat';

describe('Protocol Compatibility', () => {
    describe('parseStatementCompat - version detection', () => {
        it('parses v5.3 statements', () => {
            const statement = `Stated protocol version: 5.3
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Test content`;
            
            const result = parseStatementCompat({ statement });
            assert.strictEqual(result.formatVersion, '5.3');
            assert.strictEqual(result.domain, 'example.com');
        });

        it('parses v5.1 statements', () => {
            const statement = `Stated protocol version: 5
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Test content`;
            
            const result = parseStatementCompat({ statement });
            assert.strictEqual(result.formatVersion, '5');
            assert.strictEqual(result.domain, 'example.com');
        });

        it('parses v5.2 statements', () => {
            const statement = `Stated protocol version: 5.2
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Test content`;
            
            const result = parseStatementCompat({ statement });
            assert.strictEqual(result.formatVersion, '5.2');
        });
    });

    describe('parseOrganisationVerificationCompat - parser selection', () => {
        it('uses v5.1 parser for v5/5.1 with Logo field', () => {
            const content = `    Type: Organisation verification
    Description: We verified the following information about an organisation.
    Name: Test Org
    Country: Netherlands
    Legal form: corporation
    Owner of the domain: test.com
    Logo: abc123.png
`;
            
            const result = parseOrganisationVerificationCompat(content, '5.1');
            assert.strictEqual(result.statementVersion, '5.1');
            assert.strictEqual(result.name, 'Test Org');
            if (result.statementVersion === '5.1') {
                assert.strictEqual(result.pictureHash, 'abc123.png');
            }
        });

        it('uses v5.3 parser for v5.2/5.3 without Logo field', () => {
            const content = `    Type: Organisation verification
    Description: We verified the following information about an organisation. Their logo may be attached to this statement.
    Name: Test Org
    Country: Netherlands
    Legal form: corporation
    Owner of the domain: test.com
`;
            
            const result = parseOrganisationVerificationCompat(content, '5.3');
            assert.strictEqual(result.statementVersion, '5.3');
            assert.strictEqual(result.name, 'Test Org');
        });
    });

    describe('Data extraction - backward compatibility', () => {
        it('extracts PDF hash from v5.1 content field', () => {
            const pdfData = parsePDFSigningCompat(
                `    Type: Sign PDF
    Description: We hereby digitally sign the referenced PDF file.
    PDF file hash: abc123def456
`,
                '5.1'
            );
            
            const hash = extractPdfHash(pdfData);
            assert.strictEqual(hash, 'abc123def456');
        });

        it('extracts PDF hash from v5.3 attachments', () => {
            const pdfData = parsePDFSigningCompat(
                `    Type: Sign PDF
    Description: We hereby digitally sign the attached PDF file. The filename contains a hash of the file contents.
`,
                '5.3'
            );
            
            const hash = extractPdfHash(pdfData, ['xyz789.pdf']);
            assert.strictEqual(hash, 'xyz789');
        });

        it('extracts profile picture from v5.1 Logo field', () => {
            const verification = parseOrganisationVerificationCompat(
                `    Type: Organisation verification
    Description: We verified the following information about an organisation.
    Name: Test
    Country: NL
    Legal form: corporation
    Owner of the domain: test.com
    Logo: pic123.jpg
`,
                '5.1'
            );
            
            const picture = extractProfilePicture(verification);
            assert.strictEqual(picture, 'pic123.jpg');
        });

        it('extracts profile picture from v5.3 attachments', () => {
            const verification = parseOrganisationVerificationCompat(
                `    Type: Organisation verification
    Description: We verified the following information about an organisation. Their logo may be attached to this statement.
    Name: Test
    Country: NL
    Legal form: corporation
    Owner of the domain: test.com
`,
                '5.3'
            );
            
            const picture = extractProfilePicture(verification, ['logo456.png']);
            assert.strictEqual(picture, 'logo456.png');
        });
    });
});