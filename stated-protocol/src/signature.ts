/**
 * Universal signature utilities using @noble/ed25519
 * Works in both browser and Node.js environments
 */

import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
import { toUrlSafeBase64, fromUrlSafeBase64, sha256, base64ToBytes } from './hash';
import type { CryptographicallySignedStatement } from './types';

// Set up sha512 for @noble/ed25519
ed.hashes.sha512 = (message: Uint8Array) => sha512(message);

const ALGORITHM = 'Ed25519'; // Fully specifies: EdDSA signature scheme with Curve25519

/**
 * Generate a new Ed25519 key pair for signing statements
 * @returns Object containing publicKey and privateKey as URL-safe base64
 */
export const generateKeyPair = async (): Promise<{ publicKey: string; privateKey: string }> => {
  const privateKey = ed.utils.randomSecretKey();
  const publicKey = await ed.getPublicKey(privateKey);

  return {
    publicKey: toUrlSafeBase64(bytesToBase64(publicKey)),
    privateKey: toUrlSafeBase64(bytesToBase64(privateKey)),
  };
};

/**
 * Sign a statement with a private key
 * @param statement - The statement text to sign
 * @param privateKeyUrlSafe - Private key in URL-safe base64 format
 * @returns URL-safe base64-encoded signature
 */
export const signStatement = async (
  statement: string,
  privateKeyUrlSafe: string
): Promise<string> => {
  const privateKeyBytes = base64ToBytes(fromUrlSafeBase64(privateKeyUrlSafe));
  const messageBytes = new TextEncoder().encode(statement);

  const signature = await ed.sign(messageBytes, privateKeyBytes);

  return toUrlSafeBase64(bytesToBase64(signature));
};

/**
 * Verify a statement signature
 * @param statement - The statement text that was signed
 * @param signatureUrlSafe - URL-safe base64-encoded signature
 * @param publicKeyUrlSafe - Public key in URL-safe base64 format
 * @returns true if signature is valid, false otherwise
 */
export const verifySignature = async (
  statement: string,
  signatureUrlSafe: string,
  publicKeyUrlSafe: string
): Promise<boolean> => {
  try {
    const publicKeyBytes = base64ToBytes(fromUrlSafeBase64(publicKeyUrlSafe));
    const signatureBytes = base64ToBytes(fromUrlSafeBase64(signatureUrlSafe));
    const messageBytes = new TextEncoder().encode(statement);

    return await ed.verify(signatureBytes, messageBytes, publicKeyBytes);
  } catch (error) {
    return false;
  }
};

/**
 * Build a signed statement
 * @param statement - The statement text to sign
 * @param privateKeyUrlSafe - Private key in URL-safe base64 format
 * @param publicKeyUrlSafe - Public key in URL-safe base64 format
 * @returns Signed statement with appended signature fields
 */
export const buildSignedStatement = async (
  statement: string,
  privateKeyUrlSafe: string,
  publicKeyUrlSafe: string
): Promise<string> => {
  const statementHash = sha256(statement);
  const signature = await signStatement(statement, privateKeyUrlSafe);
  return (
    statement +
    `---\n` +
    `Statement hash: ${statementHash}\n` +
    `Public key: ${publicKeyUrlSafe}\n` +
    `Signature: ${signature}\n` +
    `Algorithm: ${ALGORITHM}\n`
  );
};

/**
 * Parse a signed statement
 * @param signedStatement - The signed statement text
 * @returns Parsed CryptographicallySignedStatement object or null if invalid
 */
export const parseSignedStatement = (
  signedStatement: string
): CryptographicallySignedStatement | null => {
  const regex =
    /^([\s\S]+?)---\nStatement hash: ([A-Za-z0-9_-]+)\nPublic key: ([A-Za-z0-9_-]+)\nSignature: ([A-Za-z0-9_-]+)\nAlgorithm: ([^\n]+)\n$/;
  const match = signedStatement.match(regex);

  if (!match) return null;

  const statement = match[1];
  const statementHash = match[2];
  const publicKey = match[3];
  const signature = match[4];
  const algorithm = match[5];

  // Verify statement hash matches
  const computedHash = sha256(statement);
  if (computedHash !== statementHash) {
    return null;
  }

  // Verify algorithm is supported
  if (algorithm !== ALGORITHM) {
    return null;
  }

  return {
    statement,
    publicKey,
    signature,
    statementHash,
    algorithm,
  };
};

/**
 * Verify a signed statement
 * @param signedStatement - The signed statement text
 * @returns true if signature is valid, false otherwise
 */
export const verifySignedStatement = async (signedStatement: string): Promise<boolean> => {
  const parsed = parseSignedStatement(signedStatement);
  if (!parsed) return false;

  return await verifySignature(parsed.statement, parsed.signature, parsed.publicKey);
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
