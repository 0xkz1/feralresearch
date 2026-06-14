# n8n Workflows For feral

## Workflow

Import this file from the n8n UI:

```text
/media/kz003/atelier/feral/workflows/n8n/feral-disaster-habitat-browser-sidecar.json
```

## Required Sidecar

Start the local feral sidecar before running the workflow:

```bash
python3 /media/kz003/atelier/feral/agents/feral_sidecar.py
```

Health check:

```bash
curl http://127.0.0.1:8765/health
```

## What The Workflow Does

```text
Manual Trigger
  -> Fetch USGS Significant Earthquakes
  -> Select strongest usable disaster seed
  -> POST the disaster seed to feral sidecar
  -> Sidecar queries OpenStreetMap Overpass nearby habitats/farms/shelters
  -> Sidecar writes prompt packet, browser-use task, OpenCode review task
  -> n8n returns a human review packet
```

## Generated Artifacts

Each run creates:

```text
feral/outputs/runs/<run_id>/prompt-packet.json
feral/outputs/runs/<run_id>/browser-use-task.txt
feral/outputs/runs/<run_id>/opencode-prompt-review.md
feral/database/feral.sqlite
```

