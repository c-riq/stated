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

## Static File Publication Standard

Organizations can publish statements as static files on their domain following this standardized structure. This enables automated verification and aggregation of statements.

### Directory Structure

All statement files should be published under the `/.well-known/` directory:

```
/.well-known/
├── statements.txt                           # All statements concatenated
├── statements/
│   ├── index.txt                           # List of all statement files
│   ├── <urlsafe_b64_statement_hash>.txt    # Individual statement files
│   └── attachments/
│       ├── index.txt                       # List of all attachment files
│       └── <urlsafe_b64_contents_hash>.<ext>    # Attachment files
```

### Peer Replication Structure

For peer-to-peer replication of statements from other domains, use the following directory structure under `/.well-known/statements/peers/`:

```
/.well-known/statements/
├── peers/
│   ├── index.txt                                    # List of all peer domains
│   └── <peer_domain>/
│       ├── metadata.json                            # Sync metadata for this peer
│       ├── statements.txt                           # All statements from peer
│       ├── statements/
│       │   ├── index.txt                           # List of statement files
│       │   ├── <urlsafe_b64_statement_hash>.txt    # Individual statements
│       │   └── attachments/
│       │       ├── index.txt                       # List of attachments
│       │       └── <urlsafe_b64_contents_hash>.<ext>  # Attachment files
```


### File Specifications

#### `/.well-known/statements.txt`

Contains all statements concatenated with 2 newline characters (`\n\n`) between each statement.

**Example:**
```
Stated protocol version: 5
Publishing domain: example.com
Author: Example Organization
Time: Thu, 15 Jun 2023 20:01:26 GMT
Statement content:
First statement content


Stated protocol version: 5
Publishing domain: example.com
Author: Example Organization
Time: Fri, 16 Jun 2023 10:30:00 GMT
Statement content:
Second statement content
```

#### `/.well-known/statements/<urlsafe_b64_signed_statement_hash>.txt`

Individual statement files named using the URL-safe base64-encoded SHA-256 hash of the complete file content.

**Important Hash Terminology:**

For signed statements, there are three distinct hash values:

1. **Statement content hash**: Hash of only the content field (the actual message text)
2. **Statement hash**: Hash of the complete unsigned statement (all fields: domain, author, time, content, etc., but excluding the signature block)
3. **Signed statement hash**: Hash of the complete signed statement (unsigned statement + signature block)

**Usage:**
- **Filename**: Uses the **signed statement hash** (hash of entire file content)
- **Signature block "Statement hash" field**: Contains the **statement hash** (hash of unsigned statement, used for cryptographic verification)
- **Response references**: Use the **signed statement hash** to reference which statement is being responded to

**Naming Convention:**
- Hash the complete statement text using SHA-256
- Encode the hash using URL-safe base64 (replacing `+` with `-` and `/` with `_`, removing padding `=`)
- Use `.txt` extension

**Example:**
```
/.well-known/statements/qg51IiW3RKIXSxiaF_hVQdZdtHzKsU4YePxFuZ2YVtQ.txt
```

**File Content:**
```
Stated protocol version: 5
Publishing domain: example.com
Author: Example Organization
Time: Thu, 15 Jun 2023 20:01:26 GMT
Statement content:
This is the statement content
```

#### `/.well-known/statements/index.txt`

Newline-delimited list of all statement file paths relative to `/.well-known/statements/`.

**Example:**
```
qg51IiW3RKIXSxiaF_hVQdZdtHzKsU4YePxFuZ2YVtQ.txt
YTIhylbTsXvJZN8og3LvusdfjjjnnVudocw1mki11Vs.txt
NF6irhgDU0F_HEgTRKnhnDlA2R8c9YnjihhiCyNGsQA.txt
```

#### `/.well-known/statements/attachments/<urlsafe_b64_contents_hash>.<file_extension>`

Attachment files referenced in statements, named using the URL-safe base64-encoded SHA-256 hash of the file contents with the appropriate file extension.

**Naming Convention:**
- Hash the complete file contents using SHA-256
- Encode the hash using URL-safe base64
- Append the original file extension (e.g., `.pdf`, `.jpg`, `.png`, `.json`)

**Example:**
```
/.well-known/statements/attachments/8kF3mN9pQ2rT5vW7xY1zA3bC4dE6fG8hI0jK2lM4nO6.pdf
/.well-known/statements/attachments/pQ9rS1tU3vW5xY7zA9bC1dE3fG5hI7jK9lM1nO3pQ5.jpg
```

#### `/.well-known/statements/attachments/index.txt`

Newline-delimited list of all attachment file paths relative to `/.well-known/statements/attachments/`.

**Example:**
```
8kF3mN9pQ2rT5vW7xY1zA3bC4dE6fG8hI0jK2lM4nO6.pdf
pQ9rS1tU3vW5xY7zA9bC1dE3fG5hI7jK9lM1nO3pQ5.jpg
xY1zA3bC4dE6fG8hI0jK2lM4nO6pQ9rS1tU3vW5xY7z.json
```
