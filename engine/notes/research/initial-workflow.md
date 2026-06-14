# Initial n8n Workflow

Workflow:

```text
Manual Trigger
  -> Fetch USGS Significant Earthquakes
  -> Select Disaster Seed
  -> feral Sidecar Ingest
  -> Prepare Human Review Packet
```

The sidecar performs the Habitat Mapper step by querying Overpass around the
selected disaster coordinates. It writes:

- `feral/database/feral.sqlite`
- `feral/outputs/runs/<run_id>/prompt-packet.json`
- `feral/outputs/runs/<run_id>/browser-use-task.txt`
- `feral/outputs/runs/<run_id>/opencode-prompt-review.md`

The browser-use task is intentionally a sidecar artifact. It can be pasted into
the browser-use WebUI at `http://127.0.0.1:7788`, or later wrapped in an HTTP
automation endpoint.

The OpenCode task is a review prompt for turning the first generated packet into
a cleaner ComfyUI-ready prompt with explicit approval/revision status.
