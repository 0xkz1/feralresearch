# feral Sidecar Knowledge Document

## Overview

The `feral sidecar` is an HTTP server that handles processing of disaster-related events, generating prompt packets for image generation workflows in collaboration with n8n, ComfyUI, and OpenCode.

It performs several key functions:
1. **Disaster Event Processing**: Receives a JSON payload containing disaster information (e.g., location).
2. **OSM Data Retrieval**: Fetches nearby OSM features from Overpass API using coordinates.
3. **Prompt Generation**: Creates positive/negative prompts for image AI models based on the disaster and surrounding environment.
4. **Logging & Storage**: Stores results into an SQLite database, supporting Research Logs.
5. **RAG Search**: Provides limited search capability across stored prompts and scenarios.

## Architecture

### Entry Points
- `/health` - Returns service health status
- `/logs` - Serves recent research log entries
- `/rag-search?q=<query>` - Performs a keyword match against stored prompt runs
- `/ingest` - Processes incoming disaster payloads (POST)
- `/rag-index` - Reports indexing information for RAG search

### Key Components

#### 1. Request Handler (`Handler`)
Serves HTTP requests using `BaseHTTPRequestHandler`. Supports:
- Health checks via GET `/health`
- Fetching recent logs from SQLite via GET `/logs`
- Keyword-based search using GET `/rag-search`
- Ingestion of new disasters via POST `/ingest`
- Index status retrieval for RAG features via POST `/rag-index`

#### 2. Processing Logic (`process_payload`)
- Loads configuration and initializes database
- Fetches OSM features around given coordinates
- Summarizes data into habitat feature list
- Builds a scenario using disaster + environmental context
- Generates positive and negative prompts based on logic in `build_prompts`
- Constructs research log narrative with details like what happened, source etc.
- Writes out structured files:
  - Browser-use instructions for local context gathering (TXT)
  - OpenCode review tasks (MD)
  - Final prompt packet JSON
- Stores everything into SQLite database

#### 3. Data Model Representations

##### Database Schema Overview (`init_db`)

**Disaster Events Table**
| Column            | Type         |
|------------------|--------------|
| id               | TEXT (PK)    |
| title            | TEXT         |
| latitude         | REAL         |
| longitude        | REAL         |
| location_text    | TEXT         |
| description      | TEXT         |

**Habitat Features Table**
| Column       | Type         |
|-------------|--------------|
| id          | TEXT (PK)    |
| event_id    | TEXT         |
| lat         | REAL         |
| lon         | REAL         |
| tags        | JSON         |
| category    | TEXT         |

**Prompt Runs Table**
| Column               | Type            |
|---------------------|-----------------|
| id                  | TEXT (PK)       |
| event_id            | TEXT            |
| scenario_json       | TEXT (JSON)     |
| positive_prompt     | TEXT            |
| negative_prompt     | TEXT            |
| browser_task_path   | TEXT            |
| prompt_packet_path  | TEXT            |
| status              | TEXT            |
| created_at          | TEXT (timestamp)|
| entry_type          | TEXT            |
| what_happened       | TEXT            |
| source_context      | TEXT            |
| my_reading          | TEXT            |
| visual_response     | TEXT            |

## Core Functions

### `process_payload(payload)`
Entrypoint for disaster data processing.

#### Inputs:
- A JSON payload with structure like:
  ```json
  {
    "disaster": {
        "title": <string>,
        "latitude": <float>,
        "longitude": <float>,
        "location_text": <string>,
        "description": <string>
    }
  }
  ```

#### Output:
- Returns structured JSON including:
  - Run identifiers and file paths
  - Feature count
  - Prompt text strings (positive/negative)
  - Research Log narrative fields

### `fetch_overpass(lat, lon, config)`
Queries Overpass API for nearby features within a defined distance.

#### Config Parameters:
```toml
[habitat_mapper]
max_features = <int>
radius_km = <float>
```

#### Features Searched For:
Uses common OpenStreetMap tags representing:
- Urban structures (buildings)
- Natural elements (waterways, forests)
- Infrastructure areas
- Land use types

### `summarize_features(elements)`
Transforms raw OSM JSON into simplified representation used in prompt generation.

Each element is processed to extract lat/lon and relevant tag info. Resulting list:
```python
[
    {
        'lat': float,
        'lon': float,
        'tags': {'key': 'value', ...},
        'category': <string>
    },
    ...
]
```

### `build_scenario(disaster, features)`
Creates structured scenario data suitable for prompt crafting.

#### Example:
```python
{
  "disaster_type": "earthquake",
  "location_name": "...",
  "surrounding_features": [
      {"type": "building", "tag": "..."},
      ...
  ]
}
```

### `build_prompts(scenario, features)`
Generates prompts for AI art generation models.

Uses logic such as:
- Combining elements from both scenario and habitat features
- Specifying style (e.g., photorealistic vs abstract)
- Mentioning specific conditions or effects related to disaster

## Files Structure & Persistence Logic

Each processed disaster event gets a unique run directory under `RUNS_DIR` with subfiles:

### File Types in Run Directory (`/runs/<run_id>`)
1. **browser-use-task.txt** — Instructions for manual context exploration
2. **opencode-prompt-review.md** — Markdown-formatted review request passed to OpenCode
3. **prompt-packet.json** — Complete output packet that includes:
   - All original inputs and generated content
   - Next steps for workflow automation

### SQLite Persistence (`DB_PATH`)
Tables defined during startup with initialization routine in `init_db()`.

This allows persistent storage of all past runs including prompt texts, feature data, log narratives for retrieval through `/logs` endpoint or search via `/rag-search`.

## RAG Index Implementation

Uses full-text matching over combined text fields:
- `positive_prompt`
- `scenario_json`

Keywords extracted from query string, then used to score each stored record by number of matches divided by total query size.

Returned with top 5 matches sorted by relevance (descending).

Used in UI for quick reference during prompt refinement or creative exploration.

## Configuration Handling

The application uses a config loaded via `load_config()` function which looks up TOML files under `${CWD}/src/fm/config.toml`.

Example minimal required section:
```toml
[sidecar]
host = "localhost"
port = 8080

[habitat_mapper]
radius_km = 2.0
max_features = 60

[services]
openapi_url = "<url>"
```

## Security Considerations

- No authentication is included; assumes internal-only or firewalled access.
- Does not sanitize inputs prior to being written into logs/databases (be cautious in production).
- Output formats include potentially sensitive prompt strings which may need redaction before public exposure.

## Future Considerations / Enhancements

### Improved Prompt Engines
Consider integrating more advanced template engines or large language models for prompt construction instead of purely rule-based logic.

### Enhanced Feature Categories
Allow richer categorization of OSM features to improve specificity when building prompts (like 'residential building', 'industrial area').

### Caching Strategy
For repeated queries at similar locations, implement memoized caches or precomputed datasets if performance becomes an issue due to network I/O latency to Overpass API.

### Extensible Data Sources
Support different backends beyond OSM for retrieving environmental data (e.g., Google Maps, local databases).

### UI Integration Points
Would benefit from additional endpoints tailored toward dashboard integration with n8n workflows and ComfyUI submissions, especially for batch processing scenarios.