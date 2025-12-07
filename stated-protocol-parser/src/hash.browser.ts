/**
 * Browser-compatible hash utilities using Web Crypto API
 * Async operations for client-side use
 */

/**
 * Compute SHA-256 hash of a string and return it as URL-safe base64
 * Works in both browser and Node.js environments
 * @param input - The string or buffer to hash
 * @returns URL-safe base64 encoded hash
 */
export const sha256 = async (input: string | Uint8Array): Promise<string> => {
    let data: Uint8Array;
    
    if (typeof input === 'string') {
        const encoder = new TextEncoder();
        data = encoder.encode(input);
    } else {
        data = input;
    }
    
    // Use Web Crypto API (available in both modern browsers and Node.js 15+)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    // Convert to base64
    const base64 = btoa(String.fromCharCode(...hashArray));
    
    // Make URL-safe: remove padding and replace + with - and / with _
    const urlSafe = base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    return urlSafe;
}

/**
 * Verify that content matches a given hash
 * @param content - The content to verify
 * @param hash - The expected hash
 * @returns True if the hash matches
 */
export const verify = async (content: string | Uint8Array, hash: string): Promise<boolean> => {
    const computed = await sha256(content);
    return computed === hash;
}

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
}

/**
 * Convert standard base64 to URL-safe base64
 * @param base64 - Standard base64 string
 * @returns URL-safe base64 string without padding
 */
export const toUrlSafeBase64 = (base64: string): string => {
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}