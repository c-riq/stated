import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
    parseStatement,
    getPdfHash,
    getOrganizationLogo,
    getPersonPicture,
    extractAttachment,
} from './protocol-compat';

describe('Protocol Parser - Migration to v5.3', () => {
    describe('parseStatement - version detection and migration', () => {
        it('parses v5.3 statements', () => {
            const statement = `Stated protocol version: 5.3
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Test content`;
            
            const result = parseStatement(statement);
            assert.strictEqual(result.originalVersion, '5.3');
            assert.strictEqual(result.statement.formatVersion, '5.3');
            assert.strictEqual(result.statement.domain, 'example.com');
            assert.strictEqual(result.originalStatement, statement);
        });

        it('parses v5.1 statements', () => {
            const statement = `Stated protocol version: 5
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Test content`;
            
            const result = parseStatement(statement);
            assert.strictEqual(result.originalVersion, '5');
            assert.strictEqual(result.statement.formatVersion, '5');
            assert.strictEqual(result.statement.domain, 'example.com');
            assert.strictEqual(result.originalStatement, statement);
        });

        it('parses v5.2 statements', () => {
            const statement = `Stated protocol version: 5.2
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Test content`;
            
            const result = parseStatement(statement);
            assert.strictEqual(result.originalVersion, '5.2');
            assert.strictEqual(result.statement.formatVersion, '5.2');
            assert.strictEqual(result.originalStatement, statement);
        });
    });

    describe('Migration - inline fields to attachments', () => {
        it('migrates v5.1 OrganisationVerification Logo to migratedAttachments', () => {
            const statement = `Stated protocol version: 5
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Type: Organisation verification
    Description: We verified the following information about an organisation.
    Name: Test Org
    Country: Netherlands
    Legal form: corporation
    Owner of the domain: test.com
    Logo: abc123.png
`;
            
            const result = parseStatement(statement);
            assert.strictEqual(result.originalVersion, '5');
            assert.deepStrictEqual(result.migratedAttachments, ['abc123.png']);
        });

        it('migrates v5.1 PersonVerification picture to migratedAttachments', () => {
            const statement = `Stated protocol version: 5
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Type: Person verification
    Description: We verified the following information about a person.
    Name: John Doe
    Date of birth: 1 Jan 1990
    City of birth: Amsterdam
    Country of birth: Netherlands
    Owner of the domain: johndoe.com
    Picture: profile123.jpg
`;
            
            const result = parseStatement(statement);
            assert.strictEqual(result.originalVersion, '5');
            assert.deepStrictEqual(result.migratedAttachments, ['profile123.jpg']);
        });

        it('migrates v5.1 PDFSigning hash to migratedAttachments', () => {
            const statement = `Stated protocol version: 5
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Type: Sign PDF
    Description: We hereby digitally sign the referenced PDF file.
    PDF file hash: xyz789abc
`;
            
            const result = parseStatement(statement);
            assert.strictEqual(result.originalVersion, '5');
            assert.deepStrictEqual(result.migratedAttachments, ['xyz789abc']);
        });

        it('preserves v5.3 attachments in migratedAttachments', () => {
            const statement = `Stated protocol version: 5.3
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Test content
Attachments: file1.pdf, file2.jpg
`;
            
            const result = parseStatement(statement);
            assert.strictEqual(result.originalVersion, '5.3');
            assert.deepStrictEqual(result.migratedAttachments, ['file1.pdf', 'file2.jpg']);
        });
    });

    describe('Helper functions - data extraction', () => {
        it('getPdfHash extracts from v5.1 content field', () => {
            const statement = `Stated protocol version: 5
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Type: Sign PDF
    Description: We hereby digitally sign the referenced PDF file.
    PDF file hash: abc123def456
`;
            
            const result = parseStatement(statement);
            const hash = getPdfHash(result);
            assert.strictEqual(hash, 'abc123def456');
        });

        it('getPdfHash extracts from v5.3 migratedAttachments', () => {
            const statement = `Stated protocol version: 5.3
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Type: Sign PDF
    Description: We hereby digitally sign the attached PDF file. The filename contains a hash of the file contents.
Attachments: xyz789.pdf
`;
            
            const result = parseStatement(statement);
            const hash = getPdfHash(result);
            assert.strictEqual(hash, 'xyz789');
        });

        it('getOrganizationLogo extracts from v5.1 Logo field', () => {
            const statement = `Stated protocol version: 5
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Type: Organisation verification
    Description: We verified the following information about an organisation.
    Name: Test
    Country: NL
    Legal form: corporation
    Owner of the domain: test.com
    Logo: pic123.jpg
`;
            
            const result = parseStatement(statement);
            const logo = getOrganizationLogo(result);
            assert.strictEqual(logo, 'pic123.jpg');
        });

        it('getOrganizationLogo extracts from v5.3 migratedAttachments', () => {
            const statement = `Stated protocol version: 5.3
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Type: Organisation verification
    Description: We verified the following information about an organisation. Their logo may be attached to this statement.
    Name: Test
    Country: NL
    Legal form: corporation
    Owner of the domain: test.com
Attachments: logo456.png
`;
            
            const result = parseStatement(statement);
            const logo = getOrganizationLogo(result);
            assert.strictEqual(logo, 'logo456.png');
        });

        it('getPersonPicture extracts from v5.1 picture field', () => {
            const statement = `Stated protocol version: 5
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Type: Person verification
    Description: We verified the following information about a person.
    Name: Jane Doe
    Date of birth: 15 Mar 1985
    City of birth: Rotterdam
    Country of birth: Netherlands
    Owner of the domain: janedoe.com
    Picture: jane123.jpg
`;
            
            const result = parseStatement(statement);
            const picture = getPersonPicture(result);
            assert.strictEqual(picture, 'jane123.jpg');
        });

        it('getPersonPicture extracts from v5.3 migratedAttachments', () => {
            const statement = `Stated protocol version: 5.3
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Type: Person verification
    Description: We verified the following information about a person. Their profile picture may be attached to this statement.
    Name: Jane Doe
    Date of birth: 15 Mar 1985
    City of birth: Rotterdam
    Country of birth: Netherlands
    Owner of the domain: janedoe.com
Attachments: jane456.jpg
`;
            
            const result = parseStatement(statement);
            const picture = getPersonPicture(result);
            assert.strictEqual(picture, 'jane456.jpg');
        });

        it('extractAttachment gets attachment by index', () => {
            const statement = `Stated protocol version: 5.3
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Test content
Attachments: file1.pdf, file2.jpg, file3.png
`;
            
            const result = parseStatement(statement);
            assert.strictEqual(extractAttachment(result, 0), 'file1.pdf');
            assert.strictEqual(extractAttachment(result, 1), 'file2.jpg');
            assert.strictEqual(extractAttachment(result, 2), 'file3.png');
        });
    });
});