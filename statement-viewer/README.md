# Statement Viewer

A static web application for viewing Stated protocol statements.

## Quick Start

```bash
npm install
npm run gen      # Generate sample data
npm start        # Start server on port 3033
```

Open: `http://localhost:3033/`

## Features

- **Statement Viewer**: View statements from `/.well-known/statements/`
- **Statement Editor**: Create and sign new statements with a user-friendly form
- **File Browser**: Browse files with built-in file browser
- Supports all Stated protocol v5 statement types
- Keyword highlighting for typed statements
- Cryptographic signing with Ed25519
- Works with static hosting (no backend required)

## File Structure

```
/.well-known/
├── statements.txt
└── statements/
    ├── index.txt
    ├── <hash>.txt
    ├── attachments/
    │   ├── index.txt
    │   └── <hash>.<ext>
    └── peers/
        ├── index.txt
        └── <domain>/
            ├── index.txt
            ├── statements.txt
            └── statements/
```

## Statement Editor

Access the statement editor at `http://localhost:3033/editor.html`

### Features

- **Form-based statement creation**: Easy-to-use interface for creating statements
- **All statement types supported**: Basic statements, polls, votes, verifications, responses, ratings, PDF signing, and disputes
- **Cryptographic signing**: Generate Ed25519 key pairs and sign statements
- **Real-time preview**: See your statement as you create it
- **Tags and translations**: Add multiple tags and translations in different languages
- **Attachments**: Reference attachment files by hash
- **Statement superseding**: Mark statements as superseding previous ones
- **Export options**: Copy to clipboard or download as `.txt` file
- **Hash calculation**: Automatic hash generation for file naming

### Usage

1. Fill in the required fields (domain, author, content)
2. Optionally select a statement type and add tags, translations, or attachments
3. If signing, generate or enter a key pair
4. Click "Generate Statement" to create the statement
5. Copy or download the generated statement
6. Save it to `/.well-known/statements/<hash>.txt`
7. Update `/.well-known/statements/index.txt` with the filename

## Deployment

Upload to any static host (GitHub Pages, Netlify, etc.). The file browser reads `index.txt` files for navigation.

