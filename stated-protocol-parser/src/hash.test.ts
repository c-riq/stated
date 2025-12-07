import { sha256, verify, fromUrlSafeBase64, toUrlSafeBase64 } from './hash.node';

describe('Hash utilities', () => {
    describe('sha256', () => {
        it('should hash a simple string', () => {
            const input = 'hello world';
            const hash = sha256(input);
            
            // Verify it's URL-safe (no +, /, or =)
            expect(hash).not.toContain('+');
            expect(hash).not.toContain('/');
            expect(hash).not.toContain('=');
            
            // Verify consistent output
            const hash2 = sha256(input);
            expect(hash).toBe(hash2);
        });

        it('should produce correct hash for known input', () => {
            const input = 'hello world';
            const expectedHash = 'uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvzek';
            const hash = sha256(input);
            expect(hash).toBe(expectedHash);
        });

        it('should handle empty string', () => {
            const hash = sha256('');
            expect(hash).toBeTruthy();
            expect(typeof hash).toBe('string');
        });

        it('should handle unicode characters', () => {
            const input = '你好世界 🌍';
            const hash = sha256(input);
            expect(hash).toBeTruthy();
            expect(typeof hash).toBe('string');
            
            // Verify consistency
            const hash2 = sha256(input);
            expect(hash).toBe(hash2);
        });

        it('should handle Buffer input', () => {
            const data = Buffer.from('hello world');
            const hash = sha256(data);
            
            // Should produce same hash as string input
            const stringHash = sha256('hello world');
            expect(hash).toBe(stringHash);
        });

        it('should produce different hashes for different inputs', () => {
            const hash1 = sha256('hello');
            const hash2 = sha256('world');
            expect(hash1).not.toBe(hash2);
        });

        it('should produce 43-character URL-safe base64 string', () => {
            const hash = sha256('test');
            // SHA-256 produces 256 bits = 32 bytes
            // Base64 encoding: 32 bytes * 4/3 = 42.67, rounded up = 43 chars (without padding)
            expect(hash.length).toBe(43);
        });
    });

    describe('verify', () => {
        it('should verify correct hash', () => {
            const content = 'hello world';
            const hash = sha256(content);
            const isValid = verify(content, hash);
            expect(isValid).toBe(true);
        });

        it('should reject incorrect hash', () => {
            const content = 'hello world';
            const wrongHash = 'incorrect_hash_value_here_1234567890';
            const isValid = verify(content, wrongHash);
            expect(isValid).toBe(false);
        });

        it('should reject hash for different content', () => {
            const content1 = 'hello world';
            const content2 = 'goodbye world';
            const hash1 = sha256(content1);
            const isValid = verify(content2, hash1);
            expect(isValid).toBe(false);
        });

        it('should work with Buffer', () => {
            const data = Buffer.from('test data');
            const hash = sha256(data);
            const isValid = verify(data, hash);
            expect(isValid).toBe(true);
        });
    });

    describe('fromUrlSafeBase64', () => {
        it('should convert URL-safe base64 to standard base64', () => {
            // Use a URL-safe string that contains both - and _ characters
            const urlSafe = 'abc-def_ghi';
            const standard = fromUrlSafeBase64(urlSafe);
            
            // Should replace - with + and _ with /
            expect(standard).toContain('+');
            expect(standard).toContain('/');
            // Should add padding
            expect(standard.endsWith('=')).toBe(true);
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
                expect(paddingCount).toBe(expectedPadding);
            });
        });

        it('should handle strings without special characters', () => {
            const input = 'abcdefghijklmnop';
            const result = fromUrlSafeBase64(input);
            expect(result).toBeTruthy();
        });
    });

    describe('toUrlSafeBase64', () => {
        it('should convert standard base64 to URL-safe', () => {
            const standard = 'uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=';
            const urlSafe = toUrlSafeBase64(standard);
            
            // Should not contain standard base64 special characters
            expect(urlSafe).not.toContain('+');
            expect(urlSafe).not.toContain('/');
            expect(urlSafe).not.toContain('=');
            
            // Should contain URL-safe replacements
            expect(urlSafe).toContain('-');
        });

        it('should remove padding', () => {
            const withPadding = 'abc=';
            const result = toUrlSafeBase64(withPadding);
            expect(result).not.toContain('=');
            expect(result).toBe('abc');
        });

        it('should be reversible with fromUrlSafeBase64', () => {
            // Start with a standard base64 string with special chars
            const original = 'test+data/with==';
            const urlSafe = toUrlSafeBase64(original);
            const restored = fromUrlSafeBase64(urlSafe);
            
            // Should restore to equivalent base64 (padding might differ slightly)
            expect(restored.replace(/=+$/, '')).toBe(original.replace(/=+$/, ''));
        });
    });

    describe('Round-trip conversions', () => {
        it('should maintain hash integrity through URL-safe conversion', () => {
            const content = 'test content for hashing';
            const hash = sha256(content);
            
            // Convert to standard base64 and back
            const standard = fromUrlSafeBase64(hash);
            const backToUrlSafe = toUrlSafeBase64(standard);
            
            expect(backToUrlSafe).toBe(hash);
        });

        it('should verify hash after conversion', () => {
            const content = 'verification test';
            const hash = sha256(content);
            
            // Convert and back
            const standard = fromUrlSafeBase64(hash);
            const urlSafe = toUrlSafeBase64(standard);
            
            // Should still verify
            const isValid = verify(content, urlSafe);
            expect(isValid).toBe(true);
        });
    });

    describe('Edge cases', () => {
        it('should handle very long strings', () => {
            const longString = 'a'.repeat(10000);
            const hash = sha256(longString);
            expect(hash).toBeTruthy();
            expect(hash.length).toBe(43);
        });

        it('should handle special characters', () => {
            const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
            const hash = sha256(special);
            expect(hash).toBeTruthy();
            
            const isValid = verify(special, hash);
            expect(isValid).toBe(true);
        });

        it('should handle newlines and whitespace', () => {
            const withNewlines = 'line1\nline2\r\nline3\ttab';
            const hash = sha256(withNewlines);
            expect(hash).toBeTruthy();
            
            const isValid = verify(withNewlines, hash);
            expect(isValid).toBe(true);
        });
    });
});