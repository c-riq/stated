# Usage Guide for stated-protocol-parser

## Installation

```bash
npm install stated-protocol-parser
```

## Quick Start

### Importing the Library

```typescript
// Import everything
import * as StatedParser from 'stated-protocol-parser';

// Or import specific functions
import { 
  buildStatement, 
  parseStatement,
  buildPollContent,
  parsePoll 
} from 'stated-protocol-parser';

// Import types
import type { Statement, Poll, Rating } from 'stated-protocol-parser';
```

## Core Concepts

The Stated protocol uses a structured text format for statements. Each statement has:
- **Publishing domain**: The domain that published the statement
- **Author**: The organization or person making the statement
- **Time**: UTC timestamp
- **Content**: The actual statement content (can be typed)
- **Optional fields**: Tags, representative, superseded statement

## Common Use Cases

### 1. Creating and Parsing Basic Statements

```typescript
import { buildStatement, parseStatement } from 'stated-protocol-parser';

// Create a statement
const statement = buildStatement({
  domain: 'example.com',
  author: 'Example Corp',
  time: new Date(),
  content: 'We are committed to sustainability.',
  tags: ['sustainability', 'announcement']
});

// Parse a statement
const parsed = parseStatement({ statement });
console.log(parsed.domain);  // 'example.com'
console.log(parsed.author);  // 'Example Corp'
console.log(parsed.tags);    // ['sustainability', 'announcement']
```

### 2. Working with Polls

```typescript
import { buildStatement, buildPollContent, parsePoll } from 'stated-protocol-parser';

// Create poll content
const pollContent = buildPollContent({
  poll: 'Should we implement feature X?',
  options: ['Yes', 'No', 'Need more information'],
  deadline: new Date('2024-12-31'),
  scopeDescription: 'All registered users',
  judges: 'example.com',
  country: undefined,
  city: undefined,
  legalEntity: undefined,
  domainScope: undefined,
});

// Wrap in a statement
const pollStatement = buildStatement({
  domain: 'example.com',
  author: 'Example Corp',
  time: new Date(),
  content: pollContent
});

// Parse the poll
const parsed = parseStatement({ statement: pollStatement });
const poll = parsePoll(parsed.content);
console.log(poll.poll);      // 'Should we implement feature X?'
console.log(poll.options);   // ['Yes', 'No', 'Need more information']
```

### 3. Organisation Verification

```typescript
import { buildOrganisationVerificationContent } from 'stated-protocol-parser';

const verification = buildOrganisationVerificationContent({
  name: 'Acme Corporation',
  country: 'United States',
  city: 'New York',
  legalForm: 'corporation',
  domain: 'acme.com',
  province: 'New York',
  serialNumber: '12345678',
  confidence: 0.95,
  employeeCount: '1000-10,000'
});
```

### 4. Person Verification

```typescript
import { buildPersonVerificationContent } from 'stated-protocol-parser';

const verification = buildPersonVerificationContent({
  name: 'John Doe',
  dateOfBirth: new Date('1990-01-01'),
  cityOfBirth: 'New York',
  countryOfBirth: 'United States',
  ownDomain: 'johndoe.com',
  jobTitle: 'CEO',
  employer: 'Acme Corp',
  confidence: 0.9
});
```

### 5. Ratings

```typescript
import { buildRating, parseRating } from 'stated-protocol-parser';

const rating = buildRating({
  subjectName: 'Product XYZ',
  subjectType: 'Product',
  subjectReference: 'https://example.com/product-xyz',
  rating: 5,
  quality: 'Overall quality',
  comment: 'Excellent product with great features'
});

const parsed = parseRating(rating);
console.log(parsed.rating);  // 5
```

### 6. Disputes

```typescript
import { 
  buildDisputeAuthenticityContent,
  buildDisputeContentContent 
} from 'stated-protocol-parser';

// Dispute authenticity (statement is fake)
const authenticityDispute = buildDisputeAuthenticityContent({
  hash: 'abc123...',
  confidence: 0.95,
  reliabilityPolicy: 'https://example.com/policy'
});

// Dispute content (statement is false)
const contentDispute = buildDisputeContentContent({
  hash: 'abc123...',
  confidence: 0.9,
  reliabilityPolicy: 'https://example.com/policy'
});
```

### 7. Observations

```typescript
import { buildObservation } from 'stated-protocol-parser';

const observation = buildObservation({
  subject: 'Acme Corporation',
  subjectReference: 'https://acme.com',
  property: 'Employee count',
  value: '5000',
  approach: 'LinkedIn data analysis',
  confidence: 0.85,
  reliabilityPolicy: 'https://example.com/methodology'
});
```

## Advanced Features

### Version Support

The library supports multiple format versions:

```typescript
import { parsePoll } from 'stated-protocol-parser';

// Parse version 3 poll
const pollV3 = parsePoll(content, '3');

// Parse version 4 poll (default)
const pollV4 = parsePoll(content, '4');
// or simply
const poll = parsePoll(content);
```

### Error Handling

All parse functions throw descriptive errors:

```typescript
try {
  const parsed = parseStatement({ statement: invalidStatement });
} catch (error) {
  if (error instanceof Error) {
    console.error('Parse error:', error.message);
    // Handle specific error cases
  }
}
```

### Constants and Utilities

```typescript
import { 
  statementTypes,
  legalForms,
  peopleCountBuckets,
  minPeopleCountToRange 
} from 'stated-protocol-parser';

// Use predefined constants
console.log(statementTypes.poll);           // 'poll'
console.log(legalForms.corporation);        // 'corporation'

// Convert employee count to range
const range = minPeopleCountToRange(5000);  // '1000-10,000'
```

## Best Practices

1. **Always validate input**: Use try-catch blocks when parsing untrusted input
2. **Use TypeScript types**: Import and use the provided types for better type safety
3. **Check format versions**: When parsing statements, check the format version if needed
4. **Handle dates properly**: Always use Date objects for time fields
5. **Validate domains**: Ensure domains are properly formatted before building statements

## Complete Example

```typescript
import {
  buildStatement,
  parseStatement,
  buildPollContent,
  parsePoll,
  buildVoteContent,
  parseVote
} from 'stated-protocol-parser';
import type { Statement, Poll, Vote } from 'stated-protocol-parser';

// 1. Create a poll
const pollContent = buildPollContent({
  poll: 'Should we adopt this new policy?',
  options: ['Yes', 'No', 'Abstain'],
  deadline: new Date('2024-12-31'),
  scopeDescription: 'All members',
  judges: 'governance.example.com',
  country: undefined,
  city: undefined,
  legalEntity: undefined,
  domainScope: ['example.com']
});

const pollStatement = buildStatement({
  domain: 'governance.example.com',
  author: 'Governance Committee',
  time: new Date(),
  content: pollContent,
  tags: ['governance', 'policy']
});

// 2. Parse the poll
const parsedPollStatement = parseStatement({ statement: pollStatement });
const poll = parsePoll(parsedPollStatement.content);

// 3. Create a vote
const voteContent = buildVoteContent({
  pollHash: 'hash-of-poll-statement',
  poll: poll.poll,
  vote: 'Yes'
});

const voteStatement = buildStatement({
  domain: 'member.example.com',
  author: 'Member Organization',
  time: new Date(),
  content: voteContent
});

// 4. Parse the vote
const parsedVoteStatement = parseStatement({ statement: voteStatement });
const vote = parseVote(parsedVoteStatement.content);

console.log('Vote cast:', vote.vote);  // 'Yes'
```

## Troubleshooting

### Common Issues

1. **"Statement must not be longer than 3,000 characters"**
   - Solution: Keep statements concise or split into multiple statements

2. **"Invalid statement format: time must be in UTC"**
   - Solution: Ensure you're using Date objects and they're in UTC format

3. **"Invalid legal form"**
   - Solution: Use one of the predefined legal forms from the `legalForms` constant

4. **"Missing required fields"**
   - Solution: Check that all required fields are provided for the specific statement type

## Support

For issues, questions, or contributions, visit the [Stated GitHub repository](https://github.com/c-riq/stated).