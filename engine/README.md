# feral

`feral` is an art automation project for generating disaster-driven animal
viewpoint image prompts.

The first workflow combines:

- Disaster-to-Feral: live disaster/event data becomes a survival scenario.
- Habitat Mapper: nearby farms, shelters, water, woods, wetlands, roads, and
  human infrastructure become the animal's plausible escape ecology.
- browser-use sidecar: each run produces a browser research task for deeper
  site-specific investigation when API data is not enough.

## Layout

```text
feral/
  agents/              Local sidecars called by n8n
  configs/             Source and runtime config
  database/            Local SQLite fallback and schema notes
  workflows/n8n/       Importable n8n workflow JSON
  outputs/runs/        Per-run prompt packets and browser tasks
```

## Start The Sidecar

Run this before executing the n8n workflow:

```bash
python3 /media/kz003/atelier/feral/agents/feral_sidecar.py
```

The sidecar listens on:

```text
http://127.0.0.1:8765
```

## Import The n8n Workflow

Import this file in n8n:

```text
/media/kz003/atelier/feral/workflows/n8n/feral-disaster-habitat-browser-sidecar.json
```

The workflow currently:

1. Fetches recent USGS earthquake data.
2. Picks a usable disaster seed.
3. Sends it to the feral sidecar.
4. The sidecar queries OpenStreetMap Overpass for nearby habitat and human
   infrastructure.
5. The sidecar writes a prompt packet, SQLite record, and browser-use task.

