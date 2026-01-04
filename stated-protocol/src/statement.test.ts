import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseStatement, buildStatement } from './protocol';

const randomUnicodeString = () =>
  Array.from({ length: 20 }, () => String.fromCharCode(Math.floor(Math.random() * 65536)))
    .join('')
    .replace(/[\n;>=<"''\\]/g, '');

describe('Statement building', () => {
  it('build & parse function compatibility: input=parse(build(input))', () => {
    const [domain, author, representative, content, supersededStatement] = Array.from(
      { length: 5 },
      randomUnicodeString
    );
    const tags = Array.from({ length: 4 }, randomUnicodeString);
    const contentWithTrailingNewline = content + (content.match(/\n$/) ? '' : '\n');
    const time = new Date('Sun, 04 Sep 2022 14:48:50 GMT');
    const statementContent = buildStatement({
      domain,
      author,
      time,
      content: contentWithTrailingNewline,
      representative,
      supersededStatement,
      tags,
    });
    const parsedStatement = parseStatement({ statement: statementContent });
    assert.strictEqual(parsedStatement.domain, domain);
    assert.strictEqual(parsedStatement.author, author);
    assert.strictEqual(parsedStatement.time?.toUTCString(), time.toUTCString());
    assert.strictEqual(parsedStatement.content, content);
    assert.strictEqual(parsedStatement.representative, representative);
    assert.strictEqual(parsedStatement.supersededStatement, supersededStatement);
    assert.deepStrictEqual(parsedStatement.tags?.sort(), tags.sort());
  });
  it('build & parse statement with attachments', () => {
    const domain = 'example.com';
    const author = 'Test Author';
    const time = new Date('Thu, 15 Jun 2023 20:01:26 GMT');
    const content = 'Statement with attachments';
    const attachments = ['abc123_-XYZ.pdf', 'def456-_ABC.jpg', 'xyz789_hash.docx'];

    const statementContent = buildStatement({
      domain,
      author,
      time,
      content,
      attachments,
    });

    const parsedStatement = parseStatement({ statement: statementContent });
    assert.strictEqual(parsedStatement.domain, domain);
    assert.strictEqual(parsedStatement.author, author);
    assert.strictEqual(parsedStatement.content, content);
    assert.deepStrictEqual(parsedStatement.attachments, attachments);
  });

  it('reject statement with more than 5 attachments', () => {
    const domain = 'example.com';
    const author = 'Test Author';
    const time = new Date();
    const content = 'Too many attachments\n';
    const attachments = [
      'hash1.pdf',
      'hash2.pdf',
      'hash3.pdf',
      'hash4.pdf',
      'hash5.pdf',
      'hash6.pdf',
    ];

    assert.throws(() => {
      buildStatement({
        domain,
        author,
        time,
        content,
        attachments,
      });
    }, /Maximum 5 attachments allowed/);
  });

  it('reject attachment with invalid format', () => {
    const domain = 'example.com';
    const author = 'Test Author';
    const time = new Date();
    const content = 'Invalid attachment\n';
    const attachments = ['invalid file name.pdf'];

    assert.throws(() => {
      buildStatement({
        domain,
        author,
        time,
        content,
        attachments,
      });
    }, /Attachment 1 must be in format 'base64hash.extension' \(URL-safe base64\)/);
  });
});
