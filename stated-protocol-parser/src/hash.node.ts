/**
 * Node.js-specific hash utilities using native crypto module
 * Synchronous operations for server-side use
 */

import crypto from 'crypto'

/**
 * Compute SHA-256 hash and return as URL-safe base64 (Node.js)
 * @param input - String or buffer to hash
 * @returns URL-safe base64 encoded hash
 */
export const sha256 = (input: crypto.BinaryLike): string => {
    const base64 = crypto.createHash('sha256').update(input).digest('base64')
    const urlSafe = base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    return urlSafe
}

/**
 * Verify that content matches a given hash
 * @param content - Content to verify
 * @param hash - Expected hash
 * @returns True if hash matches
 */
export const verify = (content: crypto.BinaryLike, hash: string): boolean => {
    return hash === sha256(content)
}

/**
 * Convert URL-safe base64 back to standard base64
 * @param urlSafe - URL-safe base64 string
 * @returns Standard base64 string with padding
 */
export const fromUrlSafeBase64 = (urlSafe: string): string => {
    const base64 = urlSafe.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    return base64 + padding;
}

/**
 * Convert standard base64 to URL-safe base64
 * @param base64 - Standard base64 string
 * @returns URL-safe base64 string without padding
 */
export const toUrlSafeBase64 = (base64: string): string => {
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}