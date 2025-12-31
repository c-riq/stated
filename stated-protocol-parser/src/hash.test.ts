import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sha256, verify, fromUrlSafeBase64, toUrlSafeBase64 } from './hash';

describe('Hash utilities', () => {
  describe('sha256', () => {
    it('should hash a simple string', () => {
      const input = 'hello world';
      const hash = sha256(input);

      // Verify it's URL-safe (no +, /, or =)
      assert.ok(!hash.includes('+'));
      assert.ok(!hash.includes('/'));
      assert.ok(!hash.includes('='));

      // Verify consistent output
      const hash2 = sha256(input);
      assert.strictEqual(hash, hash2);
    });

    it('should produce correct hash for known input', () => {
      const input = 'hello world';
      const expectedHash = 'uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvzek';
      const hash = sha256(input);
      assert.strictEqual(hash, expectedHash);
    });

    it('should handle empty string', () => {
      const hash = sha256('');
      assert.ok(hash);
      assert.strictEqual(typeof hash, 'string');
    });

    it('should handle unicode characters', () => {
      const input = '你好世界 🌍';
      const hash = sha256(input);
      assert.ok(hash);
      assert.strictEqual(typeof hash, 'string');

      // Verify consistency
      const hash2 = sha256(input);
      assert.strictEqual(hash, hash2);
    });

    it('should handle Buffer input', () => {
      const data = Buffer.from('hello world');
      const hash = sha256(data);

      // Should produce same hash as string input
      const stringHash = sha256('hello world');
      assert.strictEqual(hash, stringHash);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = sha256('hello');
      const hash2 = sha256('world');
      assert.notStrictEqual(hash1, hash2);
    });

    it('should produce 43-character URL-safe base64 string', () => {
      const hash = sha256('test');
      // SHA-256 produces 256 bits = 32 bytes
      // Base64 encoding: 32 bytes * 4/3 = 42.67, rounded up = 43 chars (without padding)
      assert.strictEqual(hash.length, 43);
    });
  });

  describe('verify', () => {
    it('should verify correct hash', () => {
      const content = 'hello world';
      const hash = sha256(content);
      const isValid = verify(content, hash);
      assert.strictEqual(isValid, true);
    });

    it('should reject incorrect hash', () => {
      const content = 'hello world';
      const wrongHash = 'incorrect_hash_value_here_1234567890';
      const isValid = verify(content, wrongHash);
      assert.strictEqual(isValid, false);
    });

    it('should reject hash for different content', () => {
      const content1 = 'hello world';
      const content2 = 'goodbye world';
      const hash1 = sha256(content1);
      const isValid = verify(content2, hash1);
      assert.strictEqual(isValid, false);
    });

    it('should work with Buffer', () => {
      const data = Buffer.from('test data');
      const hash = sha256(data);
      const isValid = verify(data, hash);
      assert.strictEqual(isValid, true);
    });
  });

  describe('fromUrlSafeBase64', () => {
    it('should convert URL-safe base64 to standard base64', () => {
      // Use a URL-safe string that contains both - and _ characters
      const urlSafe = 'abc-def_ghi';
      const standard = fromUrlSafeBase64(urlSafe);

      // Should replace - with + and _ with /
      assert.ok(standard.includes('+'));
      assert.ok(standard.includes('/'));
      // Should add padding
      assert.strictEqual(standard.endsWith('='), true);
    });

    it('should add correct padding', () => {
      // Test different padding scenarios
      const testCases = [
        { input: 'abc', expectedPadding: 1 },
        { input: 'abcd', expectedPadding: 0 },
        { input: 'abcde', expectedPadding: 3 },
        { input: 'abcdef', expectedPadding: 2 },
      ];

      testCases.forEach(({ input, expectedPadding }) => {
        const result = fromUrlSafeBase64(input);
        const paddingCount = (result.match(/=/g) || []).length;
        assert.strictEqual(paddingCount, expectedPadding);
      });
    });

    it('should handle strings without special characters', () => {
      const input = 'abcdefghijklmnop';
      const result = fromUrlSafeBase64(input);
      assert.ok(result);
    });
  });

  describe('toUrlSafeBase64', () => {
    it('should convert standard base64 to URL-safe', () => {
      const standard = 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=';
      const urlSafe = toUrlSafeBase64(standard);

      // Should not contain standard base64 special characters
      assert.ok(!urlSafe.includes('+'));
      assert.ok(!urlSafe.includes('/'));
      assert.ok(!urlSafe.includes('='));

      // Should contain URL-safe replacements
      assert.ok(urlSafe.includes('-'));
    });

    it('should remove padding', () => {
      const withPadding = 'abc=';
      const result = toUrlSafeBase64(withPadding);
      assert.ok(!result.includes('='));
      assert.strictEqual(result, 'abc');
    });

    it('should be reversible with fromUrlSafeBase64', () => {
      // Start with a standard base64 string with special chars
      const original = 'test+data/with==';
      const urlSafe = toUrlSafeBase64(original);
      const restored = fromUrlSafeBase64(urlSafe);

      // Should restore to equivalent base64 (padding might differ slightly)
      assert.strictEqual(restored.replace(/=+$/, ''), original.replace(/=+$/, ''));
    });
  });

  describe('Round-trip conversions', () => {
    it('should maintain hash integrity through URL-safe conversion', () => {
      const content = 'test content for hashing';
      const hash = sha256(content);

      // Convert to standard base64 and back
      const standard = fromUrlSafeBase64(hash);
      const backToUrlSafe = toUrlSafeBase64(standard);

      assert.strictEqual(backToUrlSafe, hash);
    });

    it('should verify hash after conversion', () => {
      const content = 'verification test';
      const hash = sha256(content);

      // Convert and back
      const standard = fromUrlSafeBase64(hash);
      const urlSafe = toUrlSafeBase64(standard);

      // Should still verify
      const isValid = verify(content, urlSafe);
      assert.strictEqual(isValid, true);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const hash = sha256(longString);
      assert.ok(hash);
      assert.strictEqual(hash.length, 43);
    });

    it('should handle special characters', () => {
      const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = sha256(special);
      assert.ok(hash);

      const isValid = verify(special, hash);
      assert.strictEqual(isValid, true);
    });

    it('should handle newlines and whitespace', () => {
      const withNewlines = 'line1\nline2\r\nline3\ttab';
      const hash = sha256(withNewlines);
      assert.ok(hash);

      const isValid = verify(withNewlines, hash);
      assert.strictEqual(isValid, true);
    });
  });
});
