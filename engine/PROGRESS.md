# Feral Research - Engine Progress & Requirements

## Current Status
- The `feral_sidecar` currently receives disaster payloads from n8n and generates prompt packets (run records) containing a `positive_prompt` and `score`.

## Required Updates (Pending)

Due to the Phase 1 & 2 frontend updates, the engine and n8n workflow must be updated to support the new "Research Log" structure. The frontend now expects the following data model instead of just raw prompt runs:

### Data Model Shift
The API must return `logs` that contain:
- `entry_type`: "short" or "long"
- `what_happened`: A factual description of the disaster event and habitat context.
- `source_context`: The origin of the data (e.g., "USGS Seismic Event + Overpass OSM").
- `my_reading`: (For long entries) The editorial interpretation or essay fragment.
- `visual_response`: The generated image prompt or visual notes.

### n8n Workflow Updates
The `feral-disaster-habitat-browser-sidecar.json` workflow will need to be updated:
1. The sidecar ingest node (`POST /ingest`) should trigger the generation of these new text fields (`what_happened`, `my_reading`, etc.).
2. The "Prepare Human Review Packet" node will need to handle the new log structure to pass it along for human review or storage.

### Database Updates
The local SQLite schema will need to be expanded to store these new `log` fields, or a new `logs` table must be created that links to the existing `prompt_runs` table via `run_id`.
