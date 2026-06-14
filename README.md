# Feral Research

Public observation system focused on feral animals, displaced pets, abandoned livestock, disaster ecology, and animal migration caused by war, disaster, or human activity.

## Architecture

feral/
├── web/       # Public website (HTML/CSS/JS)
├── cms/       # Sanity CMS
├── engine/    # Scraping, SQLite, sidecar API, RAG, n8n workflows
└── vault/     # Facts, ideas, canvas, assets (Obsidian-compatible)

## Pipeline

World → Engine → Database/RAG → Vault → CMS → Public Website → Readers → Next Observation

## Infrastructure

| Service | URL | Status |
|---------|-----|--------|
| n8n | http://100.123.190.33:5678 | Running |
| Sidecar | http://127.0.0.1:8765 | Running |
| Hermes Dashboard | http://100.123.190.33:9119 | Running |
