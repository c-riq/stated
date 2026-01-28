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
- **Tags and translations**: Add multiple tags and translations in different languages
- **File attachments**: Upload files that are automatically published with your statement
- **Statement superseding**: Mark statements as superseding previous ones
- **Automatic API submission**: Publishes directly to api.country-a.com
- **Export options**: Copy to clipboard or download as `.txt` file

### Automatic Publishing

The editor automatically handles all publishing steps when you click "Submit to API":

1. **Fetches** `/.well-known/statements.txt` and appends your new statement
2. **Creates** `/.well-known/statements/<hash>.txt` with your statement
3. **Updates** `/.well-known/statements/index.txt` with the new filename
4. **Uploads** any attachments to `/.well-known/statements/attachments/`
5. **Updates** `/.well-known/statements/attachments/index.txt`
6. **Invalidates** CloudFront cache for immediate visibility

### Usage

1. Fill in the required fields (domain, author, content)
2. Optionally select a statement type and add tags, translations, or file attachments
3. If signing, generate or enter a key pair
4. Click "Generate Statement" to create the statement
5. Enter your API key for api.country-a.com
6. Click "Submit to API" to automatically publish

### API Configuration

The editor submits to `https://api.country-a.com/update` by default. You need an API key to publish statements. The API key should be configured in your deployment's Terraform infrastructure.

## Configuration

Runtime configuration via [`config.json`](config.json) - no rebuild required:
- `branding`: logo path, title, subtitle
- `editor.defaults`: pre-filled domain and author
- `editor.api`: API endpoints

## Deployment

Build once, deploy anywhere. Copy `dist/` and customize [`config.json`](config.json) per deployment. Works with any static host.

