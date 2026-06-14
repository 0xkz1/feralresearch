#!/usr/bin/env python3
"""Local HTTP sidecar for the feral n8n workflow.

The service receives a disaster seed from n8n, enriches it with nearby
OpenStreetMap habitat features, stores a local record, and emits a prompt
packet for later OpenCode/ComfyUI steps.
"""

from __future__ import annotations

import hashlib
import json
import os
import random
import sqlite3
import sys
import textwrap
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = PROJECT_ROOT / "configs" / "sources.json"
DB_PATH = PROJECT_ROOT / "database" / "feral.sqlite"
SCHEMA_PATH = PROJECT_ROOT / "database" / "schema.sql"
RUNS_DIR = PROJECT_ROOT / "outputs" / "runs"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_config() -> dict[str, Any]:
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def stable_id(prefix: str, payload: Any) -> str:
    data = json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")
    return f"{prefix}_{hashlib.sha256(data).hexdigest()[:16]}"


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    schema = SCHEMA_PATH.read_text(encoding="utf-8")
    with sqlite3.connect(DB_PATH) as conn:
        conn.executescript(schema)


def overpass_query(lat: float, lon: float, radius: int) -> str:
    return textwrap.dedent(
        f"""
        [out:json][timeout:30];
        (
          node["amenity"~"animal_shelter|veterinary"](around:{radius},{lat},{lon});
          way["amenity"~"animal_shelter|veterinary"](around:{radius},{lat},{lon});
          relation["amenity"~"animal_shelter|veterinary"](around:{radius},{lat},{lon});
          node["landuse"~"farmyard|farmland|meadow|orchard|pasture"](around:{radius},{lat},{lon});
          way["landuse"~"farmyard|farmland|meadow|orchard|pasture"](around:{radius},{lat},{lon});
          relation["landuse"~"farmyard|farmland|meadow|orchard|pasture"](around:{radius},{lat},{lon});
          node["building"~"farm|barn|stable|cowshed|sty|shed"](around:{radius},{lat},{lon});
          way["building"~"farm|barn|stable|cowshed|sty|shed"](around:{radius},{lat},{lon});
          node["natural"~"wood|scrub|wetland|water|grassland|heath"](around:{radius},{lat},{lon});
          way["natural"~"wood|scrub|wetland|water|grassland|heath"](around:{radius},{lat},{lon});
        );
        out center tags 80;
        """
    ).strip()


def fetch_overpass(lat: float, lon: float, config: dict[str, Any]) -> dict[str, Any]:
    habitat = config["habitat_mapper"]
    radius = int(habitat.get("radius_meters", 15000))
    query = overpass_query(lat, lon, radius)
    body = urllib.parse.urlencode({"data": query}).encode("utf-8")
    req = urllib.request.Request(
        habitat["overpass_url"],
        data=body,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "feral-sidecar/1.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=45) as res:
        return json.loads(res.read().decode("utf-8"))


def feature_position(element: dict[str, Any]) -> tuple[float | None, float | None]:
    if "lat" in element and "lon" in element:
        return element["lat"], element["lon"]
    center = element.get("center") or {}
    return center.get("lat"), center.get("lon")


def feature_label(tags: dict[str, Any]) -> str:
    if tags.get("name"):
        return tags["name"]
    for key in ("amenity", "landuse", "building", "natural"):
        if tags.get(key):
            return tags[key]
    return "unnamed feature"


def summarize_features(elements: list[dict[str, Any]]) -> list[dict[str, Any]]:
    features = []
    for element in elements:
        tags = element.get("tags") or {}
        if not tags:
            continue
        lat, lon = feature_position(element)
        features.append(
            {
                "osm_id": f"{element.get('type', 'unknown')}/{element.get('id')}",
                "name": feature_label(tags),
                "lat": lat,
                "lon": lon,
                "tags": tags,
            }
        )
    return features


def build_scenario(
    disaster: dict[str, Any], features: list[dict[str, Any]]
) -> dict[str, Any]:
    animals = [
        "farm dogs",
        "barn cats",
        "goats",
        "cattle",
        "horses",
        "backyard chickens",
        "working sheepdogs",
    ]
    survival_modes = [
        "following drainage ditches toward water",
        "using abandoned farm buildings as night shelter",
        "moving through scrubland at the edge of damaged roads",
        "forming an uneasy mixed-species group near ruined pasture",
        "avoiding emergency lights and human machinery",
    ]
    habitat_names = [f["name"] for f in features[:8]]
    return {
        "project": "feral",
        "animal_focus": random.choice(animals),
        "survival_mode": random.choice(survival_modes),
        "disaster_title": disaster.get("title", "unknown disaster"),
        "location": {
            "lat": disaster.get("latitude"),
            "lon": disaster.get("longitude"),
        },
        "habitat_cues": habitat_names,
        "tone": "hyperreal disaster ecology with restrained near-future science fiction",
    }


def build_prompts(
    scenario: dict[str, Any], features: list[dict[str, Any]]
) -> tuple[str, str]:
    habitat_text = (
        ", ".join(scenario["habitat_cues"][:6]) or "damaged rural edge habitat"
    )
    positive = (
        "A hyperreal near-future disaster ecology scene from an animal viewpoint, "
        f"{scenario['animal_focus']} forced into feral survival after {scenario['disaster_title']}, "
        f"{scenario['survival_mode']}, habitat cues: {habitat_text}, "
        "wet ground, damaged infrastructure, quiet tension, documentary realism, "
        "subtle speculative biology, cinematic natural light, detailed fur and debris, "
        "no heroic human framing, the animal perspective dominates the composition"
    )
    negative = (
        "cartoon, cute mascot, fantasy armor, clean utopia, human hero portrait, "
        "text, watermark, logo, low detail, plastic fur, oversaturated anime style"
    )
    return positive, negative


def build_log_narrative(
    disaster: dict[str, Any],
    scenario: dict[str, Any],
    features: list[dict[str, Any]],
    positive: str,
) -> dict[str, Any]:
    """Build Research-Log structured text fields from the processed run."""
    habitat_names = ", ".join(f["name"] for f in features[:6]) or "open terrain"
    place = disaster.get("place") or disaster.get("title", "unknown location")
    mag = disaster.get("magnitude")
    mag_str = f" (M{mag}" + ")" if mag else ""
    event_type = disaster.get("event_type", "disaster event")

    what_happened = (
        f"{scenario['animal_focus'].capitalize()} observed {scenario['survival_mode']} "
        f"in the aftermath of a {event_type}{mag_str} near {place}. "
        f"Nearby OSM habitat cues include: {habitat_names}."
    )

    source_context = (
        f"{disaster.get('source', 'unknown source').upper()} · "
        f"OpenStreetMap Overpass ({len(features)} features within radius)"
    )

    my_reading = (
        f"The {event_type} near {place} created a boundary rupture between managed "
        f"agricultural land and uncontrolled movement corridors. "
        f"{scenario['animal_focus'].capitalize()} — normally embedded in human care infrastructure — "
        f"are suddenly legible as wild actors. "
        f"The survival mode ({scenario['survival_mode']}) suggests a logic of provisional ecology: "
        f"habitats are not chosen but encountered. "
        f"This is the threshold between domesticated and feral — and feral is not a destination, "
        f"it is a condition imposed by collapse."
    )

    visual_response = positive

    return {
        "entry_type": "long",
        "what_happened": what_happened,
        "source_context": source_context,
        "my_reading": my_reading,
        "visual_response": visual_response,
    }


def browser_task(disaster: dict[str, Any], features: list[dict[str, Any]]) -> str:
    place = disaster.get("title", "the disaster location")
    cues = ", ".join(f["name"] for f in features[:10])
    return textwrap.dedent(
        f"""
        Research task for the feral project:

        Investigate the real-world location and aftermath context for: {place}

        Focus on:
        - local animal shelters, farms, livestock facilities, veterinary clinics, and rural edges
        - disaster impacts on pets, livestock, abandoned animals, and wildlife corridors
        - visual details: terrain, damaged infrastructure, vegetation, weather, emergency response traces
        - avoid sensationalism; collect grounded details that support animal-viewpoint image prompts

        Nearby OSM habitat cues already found:
        {cues}

        Return concise JSON with keys:
        location_notes, animal_risk_notes, visual_cues, source_urls, prompt_additions
        """
    ).strip()


def opencode_task(
    disaster: dict[str, Any],
    scenario: dict[str, Any],
    positive: str,
    negative: str,
    browser_task_path: Path,
) -> str:
    return textwrap.dedent(
        f"""
        # feral prompt review task

        You are reviewing a prompt packet for the `feral` art project.

        Project premise:
        Pets and livestock are forced into feral survival after human-made or
        natural disasters. The image should feel like an extension of the real
        world, with restrained near-future speculative realism. The animal's
        viewpoint must dominate the scene.

        Disaster seed:
        {json.dumps(disaster, ensure_ascii=False, indent=2)}

        Scenario:
        {json.dumps(scenario, ensure_ascii=False, indent=2)}

        Current positive prompt:
        {positive}

        Current negative prompt:
        {negative}

        Browser-use research task:
        {browser_task_path}

        Return JSON only:
        {{
          "decision": "approve | revise | needs_research",
          "reasoning_summary": "short practical critique",
          "improved_positive_prompt": "...",
          "improved_negative_prompt": "...",
          "comfyui_notes": {{
            "composition": "...",
            "lighting": "...",
            "lens_or_camera": "...",
            "risk_to_avoid": "..."
          }},
          "browser_research_needed": true
        }}
        """
    ).strip()


def store_run(
    disaster: dict[str, Any],
    raw_overpass: dict[str, Any],
    features: list[dict[str, Any]],
    scenario: dict[str, Any],
    positive: str,
    negative: str,
    browser_task_path: Path,
    prompt_packet_path: Path,
    run_id: str,
    log_narrative: dict[str, Any] | None = None,
) -> None:
    event_id = stable_id("event", disaster)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            insert or replace into disaster_events
            (id, source, title, url, occurred_at, latitude, longitude, magnitude, raw_json, created_at)
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event_id,
                disaster.get("source", "unknown"),
                disaster.get("title", "unknown disaster"),
                disaster.get("url"),
                disaster.get("occurred_at"),
                disaster.get("latitude"),
                disaster.get("longitude"),
                disaster.get("magnitude"),
                json.dumps(disaster, ensure_ascii=False),
                utc_now(),
            ),
        )
        for feature in features:
            feature_id = stable_id("habitat", {"event": event_id, "feature": feature})
            conn.execute(
                """
                insert or replace into habitat_features
                (id, event_id, source, feature_type, name, latitude, longitude, tags_json, created_at)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    feature_id,
                    event_id,
                    "openstreetmap_overpass",
                    feature["tags"].get("amenity")
                    or feature["tags"].get("landuse")
                    or feature["tags"].get("building")
                    or feature["tags"].get("natural"),
                    feature["name"],
                    feature.get("lat"),
                    feature.get("lon"),
                    json.dumps(feature["tags"], ensure_ascii=False),
                    utc_now(),
                ),
            )
        narrative = log_narrative or {}
        conn.execute(
            """
            insert or replace into prompt_runs
            (id, event_id, scenario_json, positive_prompt, negative_prompt, browser_task_path,
             prompt_packet_path, status, created_at,
             entry_type, what_happened, source_context, my_reading, visual_response)
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                run_id,
                event_id,
                json.dumps(scenario, ensure_ascii=False),
                positive,
                negative,
                str(browser_task_path),
                str(prompt_packet_path),
                "prompt_packet_created",
                utc_now(),
                narrative.get("entry_type", "long"),
                narrative.get("what_happened"),
                narrative.get("source_context"),
                narrative.get("my_reading"),
                narrative.get("visual_response"),
            ),
        )


def process_payload(payload: dict[str, Any]) -> dict[str, Any]:
    init_db()
    config = load_config()
    disaster = payload["disaster"]
    lat = float(disaster["latitude"])
    lon = float(disaster["longitude"])

    raw_overpass = fetch_overpass(lat, lon, config)
    max_features = int(config["habitat_mapper"].get("max_features", 60))
    features = summarize_features(raw_overpass.get("elements", []))[:max_features]
    scenario = build_scenario(disaster, features)
    positive, negative = build_prompts(scenario, features)
    log_narrative = build_log_narrative(disaster, scenario, features, positive)

    run_id = stable_id(
        "run", {"disaster": disaster, "created_bucket": int(time.time() / 3600)}
    )
    run_dir = RUNS_DIR / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    browser_task_path = run_dir / "browser-use-task.txt"
    opencode_task_path = run_dir / "opencode-prompt-review.md"
    prompt_packet_path = run_dir / "prompt-packet.json"
    browser_task_path.write_text(browser_task(disaster, features), encoding="utf-8")
    opencode_task_path.write_text(
        opencode_task(disaster, scenario, positive, negative, browser_task_path),
        encoding="utf-8",
    )

    prompt_packet = {
        "run_id": run_id,
        "created_at": utc_now(),
        "disaster": disaster,
        "scenario": scenario,
        "habitat_features": features,
        "positive_prompt": positive,
        "negative_prompt": negative,
        "browser_use_task_path": str(browser_task_path),
        "opencode_task_path": str(opencode_task_path),
        # Research Log fields
        **log_narrative,
        "next_steps": [
            "Review the browser-use task if deeper local context is needed.",
            "Pass the prompt packet to OpenCode for critique/refinement.",
            "After human approval, submit positive_prompt and negative_prompt to ComfyUI.",
        ],
    }
    prompt_packet_path.write_text(
        json.dumps(prompt_packet, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    store_run(
        disaster,
        raw_overpass,
        features,
        scenario,
        positive,
        negative,
        browser_task_path,
        prompt_packet_path,
        run_id,
        log_narrative=log_narrative,
    )

    return {
        "ok": True,
        "run_id": run_id,
        "prompt_packet_path": str(prompt_packet_path),
        "browser_use_task_path": str(browser_task_path),
        "opencode_task_path": str(opencode_task_path),
        "habitat_feature_count": len(features),
        "positive_prompt": positive,
        "negative_prompt": negative,
        # Research Log fields — forwarded to n8n
        **log_narrative,
    }


class Handler(BaseHTTPRequestHandler):
    def _json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if self.path == "/health":
            self._json(200, {"ok": True, "project": "feral"})
        elif self.path == "/logs":
            # ── Research Log endpoint ──────────────────────────────────────
            # Returns prompt_runs formatted as the Research Log data model
            # expected by feral-api.js getLogs().
            try:
                with sqlite3.connect(DB_PATH) as conn:
                    conn.row_factory = sqlite3.Row
                    rows = conn.execute(
                        """
                        SELECT
                          pr.id,
                          pr.created_at,
                          pr.entry_type,
                          pr.what_happened,
                          pr.source_context,
                          pr.my_reading,
                          pr.visual_response,
                          de.title
                        FROM prompt_runs pr
                        LEFT JOIN disaster_events de ON de.id = pr.event_id
                        ORDER BY pr.created_at DESC
                        LIMIT 50
                        """
                    ).fetchall()
                    logs = [
                        {
                            "id": row["id"],
                            "title": row["title"] or "Unnamed run",
                            "created_at": row["created_at"],
                            "entry_type": row["entry_type"] or "long",
                            "what_happened": row["what_happened"],
                            "source_context": row["source_context"],
                            "my_reading": row["my_reading"],
                            "visual_response": row["visual_response"],
                            "_mock": False,
                        }
                        for row in rows
                    ]
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", "*")
                body = json.dumps({"ok": True, "logs": logs}, ensure_ascii=False, indent=2).encode("utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except Exception as exc:
                self._json(500, {"ok": False, "error": str(exc)})
        elif self.path.startswith("/rag-search"):
            parsed = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed.query)
            q = params.get("q", [""])[0].strip()
            if not q:
                self._json(200, {"ok": True, "query": q, "results": []})
                return
            try:
                keywords = [k.strip().lower() for k in q.split() if k.strip()]
                with sqlite3.connect(DB_PATH) as conn:
                    conn.row_factory = sqlite3.Row
                    rows = conn.execute(
                        "SELECT id, positive_prompt, scenario_json, created_at FROM prompt_runs"
                    ).fetchall()
                    results = []
                    for row in rows:
                        text = (row["positive_prompt"] + " " + row["scenario_json"]).lower()
                        matches = sum(1 for k in keywords if k in text)
                        if matches > 0:
                            score = matches / len(keywords)
                            results.append(
                                {
                                    "run_id": row["id"],
                                    "score": round(score, 4),
                                    "positive_prompt": row["positive_prompt"],
                                    "created_at": row["created_at"],
                                }
                            )
                    results.sort(key=lambda x: x["score"], reverse=True)
                    self._json(
                        200, {"ok": True, "query": q, "results": results[:5]}
                    )
            except Exception as exc:
                self._json(500, {"ok": False, "error": str(exc)})
        else:
            self._json(404, {"ok": False, "error": "not found"})

    def do_POST(self) -> None:
        if self.path == "/ingest":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
                result = process_payload(payload)
                self._json(200, result)
            except Exception as exc:
                self._json(500, {"ok": False, "error": str(exc)})
        elif self.path == "/rag-index":
            try:
                with sqlite3.connect(DB_PATH) as conn:
                    count = conn.execute(
                        "SELECT COUNT(*) FROM prompt_runs"
                    ).fetchone()[0]
                self._json(
                    200,
                    {
                        "ok": True,
                        "indexed_count": count,
                        "message": "RAG index ready",
                    },
                )
            except Exception as exc:
                self._json(500, {"ok": False, "error": str(exc)})
        else:
            self._json(404, {"ok": False, "error": "not found"})


def main() -> int:
    config = load_config()
    sidecar = config["sidecar"]
    server = HTTPServer((sidecar["host"], int(sidecar["port"])), Handler)
    print(
        f"feral sidecar listening on http://{sidecar['host']}:{sidecar['port']}",
        flush=True,
    )
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
