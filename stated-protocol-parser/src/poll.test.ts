import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parsePoll, buildPollContent } from './protocol';

const randomUnicodeString = () =>
  Array.from({ length: 20 }, () => String.fromCharCode(Math.floor(Math.random() * 65536)))
    .join('')
    .replace(/[\n;>=<"''\\]/g, '');

describe('Poll building', () => {
  it('build & parse function compatibility: input=parse(build(input))', () => {
    const [poll, scopeDescription] = Array.from({ length: 2 }, randomUnicodeString);
    const options = Array.from({ length: 2 }, randomUnicodeString);
    const deadline = new Date('Thu, 01 Dec 2022 13:38:26 GMT');
    const pollContent = buildPollContent({
      deadline,
      poll,
      options,
      scopeDescription,
    });
    const parsedPoll = parsePoll(pollContent, '5');
    assert.strictEqual(parsedPoll.poll, poll);
    assert.strictEqual(parsedPoll.scopeDescription, scopeDescription);
    assert.strictEqual(parsedPoll.deadline?.toUTCString(), deadline.toUTCString());
    assert.strictEqual(parsedPoll.options[0], options[0]);
    assert.strictEqual(parsedPoll.options[1], options[1]);
  });
});
