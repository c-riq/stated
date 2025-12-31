# Statement Viewer

A static web application for rendering and displaying statements published using the Stated protocol v5.

## Overview

This viewer allows organizations to host a simple, static web interface that pulls statement text files from their domain and generates a user-friendly UI for displaying the content. It's designed to work with the standardized file structure defined in the Stated protocol.

## Features

- **Uses Official Parser**: Integrates `stated-protocol-parser` library for accurate parsing
- **Protocol v5 Compatible**: Supports the latest protocol format with 4-space indentation
- **Signature Verification Display**: Shows cryptographic signature information when present
- **Responsive Design**: Works on desktop and mobile devices
- **Multiple Loading Methods**: Can load from `statements.txt` or individual statement files via `index.txt`
- **Type Detection**: Automatically detects and displays statement types (polls, verifications, etc.)
- **Tag Support**: Displays statement tags for easy categorization
- **Translation Support**: Handles multi-language statements
- **Sample Data Included**: Comes with a generator for sample statements with attachments

## Quick Start (Local Development)

1. Install dependencies:
```bash
cd statement-viewer
npm install
```

2. Generate sample data:
```bash
npm run generate-samples
```

3. Start the local server:
```bash
npm start
```

4. Open your browser to:
```
http://localhost:3000/?baseUrl=http://localhost:3000/.well-known/statements/
```

## Usage

### For Production Deployment

1. Build the stated-protocol-parser library:
```bash
cd ../stated-protocol-parser
npm install
npm run build
```

2. Copy the `statement-viewer` directory to your web server
3. Ensure `node_modules/stated-protocol-parser` is accessible
4. Open `index.html` in a web browser
5. Enter the base URL for your statements (e.g., `https://example.com/.well-known/statements/`)
6. Click "Load Statements"

### URL Parameters

You can pre-configure the base URL using a query parameter:

```
https://example.com/statement-viewer/?baseUrl=https://example.com/.well-known/statements/
```

### Expected File Structure

The viewer expects statements to be published following the Stated protocol standard:

```
/.well-known/
├── statements.txt                           # All statements concatenated (preferred)
├── statements/
│   ├── index.txt                           # List of all statement files
│   ├── <urlsafe_b64_statement_hash>.txt    # Individual statement files
│   └── attachments/
│       ├── index.txt                       # List of all attachment files
│       └── <urlsafe_b64_contents_hash>.<ext>    # Attachment files
```

### Loading Behavior

1. The viewer first attempts to load `/.well-known/statements.txt` (all statements concatenated)
2. If that fails, it falls back to loading individual statements from `/.well-known/statements/index.txt`
3. Statements are parsed and displayed in reverse chronological order (newest first)

## Statement Format Support

The viewer supports all Stated protocol v5 statement types:

- Plain statements
- Polls and votes
- Organisation verifications
- Person verifications
- Disputes (authenticity and content)
- Ratings
- PDF signing
- Responses

### Protocol v5 Features

- **4-space indentation** for statement content (not tabs)
- **Cryptographic signatures** using Ed25519
- **Translations** in multiple languages
- **Attachments** (up to 5 files)
- **Tags** for categorization
- **Statement superseding** for updates

## Deployment

### Static Hosting

Simply upload the files to any static web host:

- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any traditional web server (Apache, Nginx, etc.)

### CORS Considerations

If your statements are hosted on a different domain than the viewer, ensure CORS headers are properly configured on the statements server:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
```

## Customization

### Styling

Edit `styles.css` to customize the appearance:

- Colors: Modify the gradient colors in `header` and `.btn-primary`
- Fonts: Change the `font-family` in the `body` selector
- Layout: Adjust spacing, padding, and margins as needed

### Functionality

Edit `app.js` to customize behavior:

- Modify `parseStatement()` to handle custom statement formats
- Adjust `renderStatements()` to change the display logic
- Add filtering or search functionality

## Sample Data

The included `generate-samples.js` script creates:
- 10 diverse sample statements including:
  - Plain statements with cryptographic signatures
  - Polls with voting options
  - Organisation verifications
  - Statements with translations (Spanish, French, German)
  - Statements with file attachments (PDF, PNG)
  - Vote statements
  - Statement superseding (corrections)
- 2 sample attachments (PDF document and PNG image)
- Proper file structure following the Stated protocol standard

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript support required
- Import maps support required (available in all modern browsers)
- No Internet Explorer support

## Security

- The viewer only reads public statement files
- No data is sent to external servers
- All processing happens client-side
- Uses the official `stated-protocol-parser` library for accurate parsing
- Signature information is displayed (cryptographic verification happens in the parser)

## License

This viewer is part of the Stated project. See the main project LICENSE file for details.

## Contributing

Contributions are welcome! Please ensure any changes maintain compatibility with the Stated protocol v5 specification.