# Statement Viewer

Static web application for viewing and creating Stated protocol statements.

## Quick Start

```bash
npm install
npm run gen      # Generate sample data
npm run dev      # Start dev server on port 3033
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

Access at `http://localhost:3033/editor.html`

### Features

- Form-based statement creation for all statement types
- Ed25519 key pair generation and signing
- Tags, translations, and file attachments
- Statement superseding
- Automatic API submission
- Export options (copy/download)

### Automatic Publishing

When you click "Submit to API", the editor:

1. Fetches `/.well-known/statements.txt` and appends your statement
2. Creates `/.well-known/statements/<hash>.txt`
3. Updates `/.well-known/statements/index.txt`
4. Uploads attachments to `/.well-known/statements/attachments/`
5. Updates `/.well-known/statements/attachments/index.txt`
6. Invalidates CloudFront cache

### Usage

1. Fill required fields (domain, author, content)
2. Optionally select statement type, add tags/translations/attachments
3. Generate or enter key pair for signing
4. Click "Generate Statement"
5. Enter API key for api.country-a.com
6. Click "Submit to API"

### API Configuration

Default endpoint: `https://api.country-a.com/update`

Requires API key configured in deployment's Terraform infrastructure.

## Configuration

Runtime configuration via [`config.json`](config.json) - no rebuild required:
- `branding`: logo, title, subtitle
- `editor.defaults`: pre-filled domain and author
- `editor.api`: API endpoints

## Deployment

Build once, deploy anywhere. Copy `dist/` and customize [`config.json`](config.json) per deployment. Works with any static host.
