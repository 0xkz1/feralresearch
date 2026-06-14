/* ─────────────────────────────────────────────────────────────
 * feral-api.js — shared sidecar API communication module
 *
 * Connects the Open Design frontend to the Feral backend sidecar
 * at http://127.0.0.1:8765. All pages import this to query system
 * health, run history, and search the research archive.
 *
 * Graceful fallback: when the sidecar is down, every method
 * returns null or empty arrays so the UI can show "offline"
 * states instead of crashing.
 * ──────────────────────────────────────────────────────────── */

const FeralAPI = (() => {
  const DEFAULT_URL = "http://127.0.0.1:8765";
  const POLL_INTERVAL_MS = 15000;

  let _baseUrl = DEFAULT_URL;
  let _connected = false;
  let _lastHealth = null;
  let _lastError = null;
  let _pollTimer = null;
  let _listeners = [];

  /* ── internal ───────────────────────────────────────────── */

  async function _fetch(path, opts = {}) {
    const url = `${_baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeout || 8000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "Accept": "application/json" },
        ...opts,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      _lastError = err;
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  function _notifyListeners() {
    _listeners.forEach((fn) => {
      try { fn(_connected, _lastHealth); } catch {}
    });
  }

  /* ── public API ─────────────────────────────────────────── */

  /** Set custom sidecar URL before first poll. */
  function config(opts = {}) {
    if (opts.url) _baseUrl = opts.url;
    if (opts.pollIntervalMs) return; // reserved
  }

  /** Check if the sidecar is reachable. Returns health object or null. */
  async function checkHealth() {
    const data = await _fetch("/health");
    const wasConnected = _connected;
    _connected = !!(data && data.ok);
    _lastHealth = data;
    if (wasConnected !== _connected) _notifyListeners();
    return data;
  }

  /** Start periodic health polling. Call once on page load. */
  function startPolling() {
    stopPolling();
    checkHealth();
    _pollTimer = setInterval(checkHealth, POLL_INTERVAL_MS);
  }

  /** Stop periodic health polling. Call on page unload. */
  function stopPolling() {
    if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
  }

  /** Get system statistics: indexed run count, RAG status. */
  async function getSystemStats() {
    const data = await _fetch("/rag-index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!data || !data.ok) return null;
    return {
      indexedCount: data.indexed_count || 0,
      ragReady: data.indexed_count > 0,
      message: data.message || "",
    };
  }

  /** Search prompt runs by keyword. Returns array of result objects. */
  async function searchRuns(query) {
    if (!query || !query.trim()) return [];
    const q = encodeURIComponent(query.trim());
    const data = await _fetch(`/rag-search?q=${q}`);
    if (!data || !data.ok) return [];
    return data.results || [];
  }

  /** Get all indexed runs (searches with a broad term). */
  async function getAllRuns() {
    return await searchRuns("feral disaster habitat");
  }

  /** Subscribe to connection state changes. Returns unsubscribe fn. */
  function onConnectionChange(fn) {
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter((f) => f !== fn); };
  }

  /** Get research logs (short and long observations). */
  async function getLogs() {
    const data = await _fetch("/logs");
    if (!data || !data.ok) return [];
    return data.logs || [];
  }

  /** Current connection state. */
  function isConnected() { return _connected; }
  function getLastHealth() { return _lastHealth; }
  function getLastError() { return _lastError ? _lastError.message : null; }

  /* ── mock data — used when sidecar is offline ───────────── */

  const MOCK_RUNS = [
    {
      run_id: "run_mock_001",
      score: 0.95,
      positive_prompt: "A hyperreal near-future disaster ecology scene from an animal viewpoint, farm dogs forced into feral survival after M6.2 earthquake near farm region, following drainage ditches toward water, habitat cues: Meadow Farm, Oak Woodland, River Drainage Channel, Veterinary Clinic, wet ground, damaged infrastructure, quiet tension, documentary realism, subtle speculative biology, cinematic natural light",
      created_at: "2026-05-29T14:22:00Z",
      _mock: true,
    },
    {
      run_id: "run_mock_002",
      score: 0.88,
      positive_prompt: "A hyperreal near-future disaster ecology scene from an animal viewpoint, cattle forced into feral survival after flood event in agricultural valley, using abandoned farm buildings as night shelter, habitat cues: Old Barn, Pasture West, Wetland Reserve, County Road Bridge, wet ground, damaged infrastructure, quiet tension, documentary realism",
      created_at: "2026-05-28T09:15:00Z",
      _mock: true,
    },
    {
      run_id: "run_mock_003",
      score: 0.82,
      positive_prompt: "A hyperreal near-future disaster ecology scene from an animal viewpoint, barn cats forced into feral survival after landslide blocked mountain road, moving through scrubland at the edge of damaged roads, habitat cues: Pine Scrub, Abandoned Farmhouse, Mountain Stream, Grazing Pasture, wet ground, damaged infrastructure, quiet tension",
      created_at: "2026-05-27T16:48:00Z",
      _mock: true,
    },
  ];

  const MOCK_LOGS = [
    {
      log_id: "log_mock_001",
      entry_type: "long",
      title: "The Pack at the Edge of the Evacuation Zone",
      created_at: "2026-05-30T10:15:00Z",
      what_happened: "A magnitude 6.2 earthquake struck an agricultural sector. Human evacuation was complete within 48 hours, leaving behind working dogs and strays.",
      source_context: "USGS Seismic Event + Overpass OSM (Farms & Drainage)",
      my_reading: "The immediate collapse of the human boundary forces domestic animals to rapidly reorganize. Farm dogs, previously separated by fences and roles, are now converging along drainage ditches—the only reliable water source that isn't contaminated by ruptured agricultural tanks. This shift from domestic isolation to feral pack structure happens in a matter of days. It raises questions about how much of 'domesticity' is just architecture.",
      visual_response: "A hyperreal near-future disaster ecology scene from an animal viewpoint, farm dogs forced into feral survival after M6.2 earthquake near farm region...",
      run_id: "run_mock_001",
      _mock: true
    },
    {
      log_id: "log_mock_002",
      entry_type: "short",
      title: "Abandoned Cattle Seeking High Ground",
      created_at: "2026-05-28T14:20:00Z",
      what_happened: "Following a severe flood in the valley, a small herd of abandoned dairy cattle has occupied the second floor of a ruined barn, turning human architecture into a survival refuge.",
      source_context: "GDACS Flood Alert + Overpass OSM",
      my_reading: null,
      visual_response: null,
      run_id: "run_mock_002",
      _mock: true
    },
    {
      log_id: "log_mock_003",
      entry_type: "long",
      title: "Chemical Spill and the Poultry Flight",
      created_at: "2026-05-25T09:00:00Z",
      what_happened: "An industrial chemical spill triggered a 15km exclusion zone. Backyard chickens, usually confined, have escaped and are navigating scrubland adjacent to the highway.",
      source_context: "Local News + Industrial Zoning Maps",
      my_reading: "Here the boundary between the 'natural' disaster and the 'human' disaster blurs. The chickens are avoiding the emergency lights, perceiving human intervention as a predator. They are retreating into the scrubland, a marginal space that suddenly holds more ecological value than the designed pastures. This observation forces us to rethink what spaces provide actual safety for modified species.",
      visual_response: "A hyperreal near-future disaster ecology scene from an animal viewpoint, backyard chickens forced into feral survival after chemical spill evacuation zone...",
      run_id: "run_mock_005",
      _mock: true
    },
    {
      log_id: "log_mock_004",
      entry_type: "short",
      title: "Barn Cats Claiming the Landslide Scrub",
      created_at: "2026-05-27T18:30:00Z",
      what_happened: "A landslide severed the mountain road. Barn cats are expanding their hunting territory into the newly exposed scrubland along the damaged asphalt.",
      source_context: "USGS Landslide Database",
      my_reading: null,
      visual_response: null,
      run_id: "run_mock_003",
      _mock: true
    }
  ];

  function getMockRuns() { return MOCK_RUNS; }
  function getMockLogs() { return MOCK_LOGS; }

  /* ── module export ─────────────────────────────────────── */

  return {
    config,
    checkHealth,
    startPolling,
    stopPolling,
    getSystemStats,
    searchRuns,
    getAllRuns,
    getLogs,
    isConnected,
    getLastHealth,
    getLastError,
    onConnectionChange,
    getMockRuns,
    getMockLogs,
  };
})();

/* Expose to window for inline script access across all pages. */
window.FeralAPI = FeralAPI;
