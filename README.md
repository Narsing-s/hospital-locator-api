# Hospital Locator UI — Clean Web App (Mule API )
A clean, responsive Hospital Locator Web UI that communicates with a MuleSoft APIKit hospital backend.
Designed for simplicity, real‑world usability, and zero CORS issues — the browser calls /api/* on this Node.js server, and the server forwards requests to the CloudHub-hosted API.
Watermark: #CreatedByNarsing-s (clickable in the UI).

✨ Features

Search by Pincode: Users can instantly search hospitals by entering any valid pincode.
Hospital services viewer: Quickly fetch detailed services for any hospital ID.
Patient registration: Add new patient records through a clear form interface.
Live API preview: UI shows the exact request path the server sends to Mule (/api/pincode, /api/services/:id, /api/patients).
Inline UI: HTML/CSS/JS is embedded inside server.js for zero static-file issues.
Proxy to Mule: Node.js forwards API calls to your CloudHub MuleSoft endpoints:

/pincode
/hospitals/{id}/services
/patients (POST)


Health endpoint: GET /health provides simple server diagnostics.
Watermark: #CreatedByNarsing-s, proudly displayed at the bottom of the UI.


🧱 Architecture
┌────────────────────────────────┐
│         Hospital UI (Web)      │
│  Search • Services • Patients  │
│  Clean layout, responsive UI   │
│  ↓ Calls local /api/* routes   │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│       Node.js Proxy Server     │
│ Serves UI at `/`               │
│ Maps requests:                 │
│   /api/pincode                 │
│   /api/services/:id            │
│   /api/patients (POST)         │
│ Handles CORS, JSON, errors     │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│       MuleSoft APIKit API      │
│  CloudHub implementation:       │
│    GET /pincode                 │
│    GET /hospitals/{id}/services │
│    POST /patients               │
│ Returns structured JSON         │
└────────────────────────────────┘
