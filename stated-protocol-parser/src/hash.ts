/**
 * Universal hash utilities using @noble/hashes
 * Works in both browser and Node.js environments
 */

import { sha256 as nobleSha256 } from '@noble/hashes/sha2.js';

/**
 * Compute SHA-256 hash of a string and return it as URL-safe base64
 * Works in both browser and Node.js environments
 * @param input - The string or buffer to hash
 * @returns URL-safe base64 encoded hash
 */
export const sha256 = (input: string | Uint8Array): string => {
  let data: Uint8Array;

  if (typeof input === 'string') {
    const encoder = new TextEncoder();
    data = encoder.encode(input);
  } else {
    data = input;
  }

  // Use @noble/hashes for consistent cross-platform hashing
  const hashArray = nobleSha256(data);

  // Convert to base64
  const base64 = bytesToBase64(hashArray);

  // Make URL-safe: remove padding and replace + with - and / with _
  const urlSafe = base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return urlSafe;
};

/**
 * Verify that content matches a given hash
 * @param content - The content to verify
 * @param hash - The expected hash
 * @returns True if the hash matches
 */
export const verify = (content: string | Uint8Array, hash: string): boolean => {
  const computed = sha256(content);
  return computed === hash;
};

/**
 * Convert URL-safe base64 back to standard base64
 * @param urlSafe - URL-safe base64 string
 * @returns Standard base64 string with padding
 */
export const fromUrlSafeBase64 = (urlSafe: string): string => {
  const base64 = urlSafe.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  return base64 + padding;
};

/**
 * Convert standard base64 to URL-safe base64
 * @param base64 - Standard base64 string
 * @returns URL-safe base64 string without padding
 */
export const toUrlSafeBase64 = (base64: string): string => {
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

/**
 * Convert bytes to base64 string
 * @param bytes - Uint8Array to convert
 * @returns Base64 string
 */
function bytesToBase64(bytes: Uint8Array): string {
  // Use btoa if available (browser), otherwise use Buffer (Node.js)
  if (typeof btoa !== 'undefined') {
    return btoa(String.fromCharCode(...Array.from(bytes)));
  } else {
    return Buffer.from(bytes).toString('base64');
  }
}

/**
 * Convert base64 string to bytes
 * @param base64 - Base64 string to convert
 * @returns Uint8Array
 */
export function base64ToBytes(base64: string): Uint8Array {
  // Use atob if available (browser), otherwise use Buffer (Node.js)
  if (typeof atob !== 'undefined') {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } else {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
}
