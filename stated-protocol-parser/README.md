# Stated Protocol Parser

A TypeScript library for parsing and formatting statements in the Stated protocol - a decentralized statement verification system.

## Installation

```bash
npm install stated-protocol-parser
```

## Features

- **Statement Parsing & Formatting**: Parse and build statements with domain verification
- **Cryptographic Signatures**: Sign and verify statements using Ed25519 (Version 5)
- **Multiple Statement Types**: Support for various statement types including:
  - Basic statements
  - Polls and votes
  - Organisation and person verifications
  - Disputes (authenticity and content)
  - Ratings
  - PDF signing
  - Responses
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Version Support**: Supports version 5 format
- **Validation**: Built-in validation for all statement formats
- **Cross-Platform**: Works in both Node.js and browser environments

## Usage

### Basic Statement

```typescript
import { buildStatement, parseStatement } from 'stated-protocol-parser';

// Build a statement
const statement = buildStatement({
  domain: 'example.com',
  author: 'Example Organization',
  time: new Date(),
  tags: ['announcement', 'update'],
  content: 'This is our official statement.',
});

// Parse a statement
const parsed = parseStatement({ statement });
console.log(parsed.domain); // 'example.com'
console.log(parsed.author); // 'Example Organization'
```

### Cryptographic Signatures (Version 5)

Version 5 introduces cryptographic signatures for statements, providing non-repudiation and tamper detection.

#### Node.js Example

```typescript
import {
  buildStatement,
  generateKeyPair,
  buildSignedStatement,
  verifySignedStatement,
  parseSignedStatement
} from 'stated-protocol-parser/node';

// Generate a key pair
const { publicKey, privateKey } = generateKeyPair();

// Build a statement
const statement = buildStatement({
  domain: 'example.com',
  author: 'Example Organization',
  time: new Date(),
  content: 'This is our official signed statement.',
});

// Sign the statement
const signedStatement = buildSignedStatement(statement, privateKey, publicKey);

// Verify the signed statement
const isValid = verifySignedStatement(signedStatement);
console.log('Signature valid:', isValid); // true

// Parse the signed statement
const parsed = parseSignedStatement(signedStatement);
console.log('Original statement:', parsed?.statement);
console.log('Public key:', parsed?.publicKey);
console.log('Signature:', parsed?.signature);
```

#### Browser Example

```typescript
import {
  buildStatement,
  generateKeyPair,
  buildSignedStatement,
  verifySignedStatement
} from 'stated-protocol-parser';

// Generate a key pair (async in browser)
const { publicKey, privateKey } = await generateKeyPair();

// Build and sign a statement
const statement = buildStatement({
  domain: 'example.com',
  author: 'Example Organization',
  time: new Date(),
  content: 'This is our official signed statement.',
});

const signedStatement = await buildSignedStatement(statement, privateKey, publicKey);

// Verify the signed statement
const isValid = await verifySignedStatement(signedStatement);
console.log('Signature valid:', isValid);
```

#### Signed Statement Format

```
Stated protocol version: 5
Publishing domain: example.com
Author: Example Organization
Time: Thu, 15 Jun 2023 20:01:26 GMT
Statement content:
This is our official signed statement.
---
Statement hash: <url-safe-base64-sha256-hash>
Public key: <url-safe-base64-encoded-public-key>
Signature: <url-safe-base64-encoded-signature>
Algorithm: Ed25519
```


### Poll

```typescript
import { buildPollContent, parsePoll } from 'stated-protocol-parser';

const pollContent = buildPollContent({
  poll: 'Should we implement feature X?',
  options: ['Yes', 'No', 'Need more information'],
  deadline: new Date('2024-12-31'),
  scopeDescription: 'All registered users',
});

const parsed = parsePoll(pollContent);
```

### Organisation Verification

```typescript
import { buildOrganisationVerificationContent, parseOrganisationVerification } from 'stated-protocol-parser';

const verification = buildOrganisationVerificationContent({
  name: 'Example Corp',
  country: 'United States',
  city: 'New York',
  legalForm: 'corporation',
  domain: 'example.com',
  // ... other fields
});
```

### Person Verification

```typescript
import { buildPersonVerificationContent, parsePersonVerification } from 'stated-protocol-parser';

const verification = buildPersonVerificationContent({
  name: 'John Doe',
  dateOfBirth: new Date('1990-01-01'),
  cityOfBirth: 'New York',
  countryOfBirth: 'United States',
  ownDomain: 'johndoe.com',
  // ... other fields
});
```

## API Reference

### Statement Functions

- `buildStatement(params)` - Build a statement string
- `parseStatement({ statement })` - Parse a statement string

### Content Type Functions

Each content type has corresponding build and parse functions:

- **Poll**: `buildPollContent()`, `parsePoll()`
- **Vote**: `buildVoteContent()`, `parseVote()`
- **Organisation Verification**: `buildOrganisationVerificationContent()`, `parseOrganisationVerification()`
- **Person Verification**: `buildPersonVerificationContent()`, `parsePersonVerification()`
- **Dispute Authenticity**: `buildDisputeAuthenticityContent()`, `parseDisputeAuthenticity()`
- **Dispute Content**: `buildDisputeContentContent()`, `parseDisputeContent()`
- **Response**: `buildResponseContent()`, `parseResponseContent()`
- **PDF Signing**: `buildPDFSigningContent()`, `parsePDFSigning()`
- **Rating**: `buildRating()`, `parseRating()`

### Constants

```typescript
import { 
  statementTypes,
  legalForms,
  peopleCountBuckets,
  UTCFormat 
} from 'stated-protocol-parser';
```

### Types

All TypeScript types are exported:

```typescript
import type {
  Statement,
  Poll,
  OrganisationVerification,
  PersonVerification,
  Vote,
  DisputeAuthenticity,
  DisputeContent,
  ResponseContent,
  PDFSigning,
  Rating
} from 'stated-protocol-parser';
```

## Format Specifications

### Statement Format

Statements follow a specific format with required fields:
- Publishing domain
- Author
- Time (UTC format)
- Format version
- Statement content

Optional fields:
- Authorized signing representative
- Tags
- Superseded statement
- Translations (multi-language support)
- Attachments (up to 5 file references)

### Validation Rules

- Statements must not exceed 3,000 characters
- Statements cannot contain double line breaks (`\n\n`)
- Time must be in UTC format
- Domain, author, and content are required fields

## Version Support

The library supports version 5 format with cryptographic signature support using Ed25519.

## Error Handling

All parse functions throw descriptive errors when encountering invalid formats:

```typescript
try {
  const parsed = parseStatement({ statement: invalidStatement });
} catch (error) {
  console.error('Invalid statement format:', error.message);
}
```
