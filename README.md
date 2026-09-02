# Inktogrid - HTML/CSS/JS Version

A paper-to-ERP staging middleware implemented with **HTML, CSS, and JavaScript only** — no frameworks, no backend, no external dependencies.

## Overview

Inktogrid digitizes handwritten and printed documents, structures the data, and exports it for ERP systems — entirely in the browser with no server required.

## Features

- **Document Ingestion** — Upload images or use camera capture
- **Handwriting Recognition** — Client-side text extraction and verification
- **Dynamic Schema Builder** — Define custom entities and fields
- **Data Validation** — Automatic standardization (dates, phones, amounts)
- **Batch Addendums** — Corrections linked to original records
- **ERP Export** — CSV, JSON, and SQL insert scripts

## How It Works

1. **Upload** a document image or capture via camera
2. **Verify** the extracted text in the review interface
3. **Build** a schema by defining entities and fields
4. **Validate** and standardize the data
5. **Export** to CSV, JSON, or SQL for your ERP system

## Technology

- **HTML5** — Structure
- **CSS3** — Styling with CSS variables
- **Vanilla JavaScript** — All logic, no libraries
- **File API** — Local document handling
- **MediaStream API** — Camera access
- **Canvas API** — Image processing

## Browser Support

Works in all modern browsers with:
- `querySelector`, `addEventListener` support
- `FileReader` API
- `getUserMedia` for camera
- `Canvas` API for image processing

## Local Development

```bash
# No build step required
open index.html
# Or start a local server:
npx serve
# Or with Python:
python -m http.server
```

Then open `http://localhost:8080` (or your server's URL).

## License

Private — Zainpreneur