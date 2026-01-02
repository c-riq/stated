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

- View statements from `/.well-known/statements/`
- Browse files with built-in file browser
- Supports all Stated protocol v5 statement types
- Keyword highlighting for typed statements
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

## Deployment

Upload to any static host (GitHub Pages, Netlify, etc.). The file browser reads `index.txt` files for navigation.

