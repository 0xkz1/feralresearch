# Web Frontend

Public-facing website for Feral Research observation system.

## Pages

| Page | File | Description |
|------|------|-------------|
| Launcher | `index.html` | Prototype index / entry point |
| Home | `landing.html` | Public landing page |
| Dashboard | `dashboard.html` | System metrics, pipeline state |
| Research Log | `research-log.html` | Chronological research entries |
| Gallery | `gallery.html` | Visual archive + prompt packets |

## Navigation

All pages share: Home · Data Dashboard · Research Log · Gallery

## API

`feral-api.js` connects to sidecar at `http://127.0.0.1:8765`:
- `/health` — System status
- `/logs` — Research log entries
- `/rag-search?q=` — Keyword search
- `/rag-index` — Indexed run count

Falls back to mock data when sidecar is offline.

## Design

`feral-system.css` — Design system with dark/light theme, CSS custom properties.
