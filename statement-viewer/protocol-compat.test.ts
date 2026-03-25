import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
    parseStatement,
    getPdfHash,
    getOrganizationLogo,
    getPersonPicture,
} from './protocol-compat';

describe('parseStatement', () => {
    it('parses and returns fully parsed statement with typed content', () => {
        const statement = `Stated protocol version: 5.3
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Type: Poll
    Poll: What is your favorite color?
    Option 1: Red
    Option 2: Blue
`;
        
        const result = parseStatement(statement);
        
        // Basic fields
        assert.strictEqual(result.domain, 'example.com');
        assert.strictEqual(result.author, 'Test Author');
        assert.strictEqual(result.formatVersion, '5.3');
        assert.strictEqual(result.originalVersion, '5.3');
        
        // Parsed content
        assert.strictEqual(result.parsedContent?.type, 'poll');
        assert.strictEqual(result.parsedContent?.data.poll, 'What is your favorite color?');
        assert.deepStrictEqual(result.parsedContent?.data.options, ['Red', 'Blue']);
    });

    it('migrates v5.1 attachments to v5.3 format', () => {
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
    Logo: logo123.png
`;
        
        const result = parseStatement(statement);
        assert.strictEqual(result.originalVersion, '5');
        assert.deepStrictEqual(result.attachments, ['logo123.png']);
        
        const logo = getOrganizationLogo(result);
        assert.strictEqual(logo, 'logo123.png');
    });

    it('handles v5.2 statements', () => {
        const statement = `Stated protocol version: 5.2
Publishing domain: example.com
Author: Test Author
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Test content
`;
        
        const result = parseStatement(statement);
        assert.strictEqual(result.originalVersion, '5.2');
        assert.strictEqual(result.formatVersion, '5.2');
    });

    it('parses vote statements with typed content', () => {
        const statement = `Stated protocol version: 5.3
Publishing domain: example.com
Author: Voter
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Type: Vote
    Poll id: abc123def456
    Poll:
        What is your favorite color?
    Option:
        Blue
`;
        
        const result = parseStatement(statement);
        assert.strictEqual(result.parsedContent?.type, 'vote');
        assert.strictEqual(result.parsedContent?.data.pollHash, 'abc123def456');
        assert.strictEqual(result.parsedContent?.data.poll, 'What is your favorite color?');
        assert.strictEqual(result.parsedContent?.data.vote, 'Blue');
    });

    it('parses rating statements with typed content', () => {
        const statement = `Stated protocol version: 5.3
Publishing domain: example.com
Author: Rater
Time: Mon, 01 Jan 2024 00:00:00 GMT
Statement content:
    Type: Rating
    Subject type: Product
    Subject name: Test Product
    Our rating: 5/5 Stars
`;
        
        const result = parseStatement(statement);
        assert.strictEqual(result.parsedContent?.type, 'rating');
        assert.strictEqual(result.parsedContent?.data.subjectType, 'Product');
        assert.strictEqual(result.parsedContent?.data.subjectName, 'Test Product');
        assert.strictEqual(result.parsedContent?.data.rating, 5);
    });
});