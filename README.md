# Stated protocol
A decentralised protocol and tools for interorganisational coordination.

## Use Case: Digital Diplomacy

The Stated Protocol enables efficient international coordination by allowing organizations to publish standardized statements on their domains. This reduces coordination friction in diplomacy, enabling rapid consensus discovery, transparent treaty negotiation, and collective decision-making without relying on centralized platforms.

**Key applications include:**
- Faster treaty negotiation through incremental micro-agreements
- Continuous operation of international institutions through asynchronous decision-making
- Coordinated signaling from local governments to national authorities
- Coalition formation among non-governmental organizations

For a detailed analysis of the protocol's applications in digital diplomacy, see the research paper: [The Stated Protocol: A Decentralized Framework for Digital Diplomacy](https://arxiv.org/abs/2507.13517)

## Supported statement publication methods

For publishing a statement, organisations or individuals can use the following options:
1. Publish it on their website domain in a text file under `/.well-known/statements/`:
    - `https://mofa.country-a.com/.well-known/statements.txt` (index file listing all statements)
    - `https://mofa.country-a.com/.well-known/statements/<hash>.txt` (individual statement files)
2. Ask another organisation to publish statements on their behalf. This would be appropriate for example if the author does not own a domain name.

## Statement format
### Plain statement example
```
Stated protocol version: 5
Publishing domain: rixdata.net
Author: Rix Data NL B.V.
Time: Thu, 15 Jun 2023 20:01:26 GMT
Statement content:
    hello world
```
Try the live demo at [https://mofa.country-a.com/](https://mofa.country-a.com/)

## Protocol Parser Library

The [stated-protocol](https://github.com/c-riq/stated/tree/master/stated-protocol) is an npm library for parsing and formatting statements in the Stated protocol. It provides TypeScript/JavaScript functions for building, parsing, and validating statements with full type safety.

[![npm](https://img.shields.io/badge/npm-stated--protocol-CB3837?logo=npm)](https://www.npmjs.com/package/stated-protocol)

Install via npm:
```bash
npm install stated-protocol
```

See the [stated-protocol README](https://github.com/c-riq/stated/blob/master/stated-protocol/README.md) for complete documentation and examples.

## Statement Viewer and Editor

The [statement-viewer](https://github.com/c-riq/stated/tree/master/statement-viewer) provides tools for viewing and creating statements:

- **Statement Viewer**: Browse and view statements from `/.well-known/statements/` with a built-in file browser
- **Statement Editor**: Create and sign new statements using a user-friendly form interface with support for all statement types, cryptographic signing, tags, translations, and file attachments
- Works with static hosting (no backend required)

See the [statement-viewer README](https://github.com/c-riq/stated/blob/master/statement-viewer/README.md) for more details.

## Design principles
#### Everyone should be able to inspect how the system works
- The statement format needs to be understandable by non-technical audience in simple english
- The verification steps should be described in non-technical language where possible
- The code should be easy to read (More common programming languages)
- The project should be easy to run (Small number of commands to set it up)
#### Simplicity
- Third party dependency count should be kept small
- Complex applications building on top of the stated system should be in a separate project
