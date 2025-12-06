# Stated Protocol Parser

A TypeScript library for parsing and formatting statements in the Stated protocol - a decentralized statement verification system.

## Installation

```bash
npm install stated-protocol-parser
```

## Features

- **Statement Parsing & Formatting**: Parse and build statements with domain verification
- **Multiple Statement Types**: Support for various statement types including:
  - Basic statements
  - Quotations
  - Polls and votes
  - Organisation and person verifications
  - Disputes (authenticity and content)
  - Ratings, bounties, observations, and boycotts
  - PDF signing
  - Responses
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Version Support**: Handles multiple format versions (v3 and v4)
- **Validation**: Built-in validation for all statement formats

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

### Poll

```typescript
import { buildPollContent, parsePoll } from 'stated-protocol-parser';

const pollContent = buildPollContent({
  poll: 'Should we implement feature X?',
  options: ['Yes', 'No', 'Need more information'],
  deadline: new Date('2024-12-31'),
  scopeDescription: 'All registered users',
  country: undefined,
  city: undefined,
  legalEntity: undefined,
  domainScope: undefined,
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
- `parseStatement({ statement, allowNoVersion? })` - Parse a statement string

### Content Type Functions

Each content type has corresponding build and parse functions:

- **Quotation**: `buildQuotationContent()`, `parseQuotation()`
- **Poll**: `buildPollContent()`, `parsePoll()`
- **Vote**: `buildVoteContent()`, `parseVote()`
- **Organisation Verification**: `buildOrganisationVerificationContent()`, `parseOrganisationVerification()`
- **Person Verification**: `buildPersonVerificationContent()`, `parsePersonVerification()`
- **Dispute Authenticity**: `buildDisputeAuthenticityContent()`, `parseDisputeAuthenticity()`
- **Dispute Content**: `buildDisputeContentContent()`, `parseDisputeContent()`
- **Response**: `buildResponseContent()`, `parseResponseContent()`
- **PDF Signing**: `buildPDFSigningContent()`, `parsePDFSigning()`
- **Rating**: `buildRating()`, `parseRating()`
- **Bounty**: `buildBounty()`, `parseBounty()`
- **Observation**: `buildObservation()`, `parseObservation()`
- **Boycott**: `buildBoycott()`, `parseBoycott()`

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
  Quotation,
  Poll,
  OrganisationVerification,
  PersonVerification,
  Vote,
  DisputeAuthenticity,
  DisputeContent,
  ResponseContent,
  PDFSigning,
  Rating,
  Bounty,
  Observation,
  Boycott
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

### Validation Rules

- Statements must not exceed 3,000 characters
- Statements cannot contain double line breaks (`\n\n`)
- Time must be in UTC format
- Domain, author, and content are required fields

## Version Support

The library supports multiple format versions:
- **Version 3**: Legacy format with different poll structure
- **Version 4**: Current format (default)

Use `parsePoll(content, '3')` to parse version 3 polls.

## Error Handling

All parse functions throw descriptive errors when encountering invalid formats:

```typescript
try {
  const parsed = parseStatement({ statement: invalidStatement });
} catch (error) {
  console.error('Invalid statement format:', error.message);
}
```
