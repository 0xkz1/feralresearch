# Knowledge Document: Web Module (main group)

This document covers the **web** module within the **main** group, providing an in-depth analysis of its functionality, structure, dependencies, data flow, design patterns, public API, and configuration. This is a frontend-facing web application component responsible for user interaction, interface behaviors, and communication with a backend sidecar service.

---

## Overview

The `web` module consists of two files:
- **feral-api.js**: Implements an API client to communicate with a local Feral backend (sidecar) at `http://127.0.0.1:8765`. It provides graceful fallback mechanisms and is used across all pages for interacting with system health, research archives, run histories, logs, etc.
- **feral.js**: Contains client-side interaction logic including UI components such as hamburger menus, theme switching, language toggles, copy functionality, filtering tabs, and form submissions. This module is responsible for dynamic behavior within the user interface.

The module primarily handles web interactions using browser APIs (`fetch`, `localStorage`, DOM manipulation), ensuring a responsive and stateful frontend experience while maintaining connection states to an internal backend service via `FeralAPI`.

---

## File: feral-api.js

### What It Does
This file exports a singleton module named `FeralAPI` which acts as a shared communication layer between the Open Design web frontend and the local Feral sidecar server. The primary responsibilities include:
- Fetching system health information,
- Polling for connection status,
- Searching prompt runs in an indexed archive,
- Retrieving research logs,
- Providing mock data to maintain UI functionality when offline.

It also includes internal helper methods and mocks for testing or fallback scenarios.

### Key Dependencies
None (pure JavaScript using standard browser APIs)

### Data Flow Overview

1. **Polling Connection Status**
   - `startPolling()` initiates periodic polling via `checkHealth()`
2. **Data Requests**
   - Methods like `searchRuns()` and `getLogs()` perform HTTP requests through `fetch` to `/api/...`
3. **User Interface Updates**
   - UI components rely on `isConnected`, `getLastHealth`, and `getLastError` to reflect current service availability.
4. **Fallback Mechanism**
   - When connection fails, `getMockRuns()` and `getMockLogs()` provide stubbed content.

### Design Patterns
- **Module Pattern**: Encapsulated within an IIFE (`(function () { ... })();`) for encapsulation and singleton behavior.
- **Singleton**: Only one instance of `FeralAPI` exists, exposed via `window.FeralAPI`.

### Public API Functions

| Function Name       | Description                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| `config()`          | Configures internal settings (currently unused).                            |
| `checkHealth()`     | Checks if the local sidecar service is responsive.                          |
| `startPolling()`    | Begins periodic polling for service health status.                          |
| `stopPolling()`     | Halts ongoing polling operations.                                           |
| `getSystemStats()`  | Retrieves general system information from the backend.                      |
| `searchRuns(query)` | Searches prompt runs based on a given query string.                         |
| `getAllRuns()`      | Fetches all known run items from index.                                     |
| `getLogs()`         | Returns research logs stored in the service database.                       |
| `isConnected()`     | Indicates whether there was a successful response to last health check.     |
| `getLastHealth()`   | Returns result of the most recent call to `checkHealth()`.                  |
| `getLastError()`    | Holds error from latest failed API interaction.                             |
| `onConnectionChange(callback)`  | Event registration mechanism for service state changes.        |
| `getMockRuns()`     | Provides sample prompt run objects (used during offline simulation).       |
| `getMockLogs()`     | Returns example log entries to simulate data presence when offline.        |

### Data Exposure

- `window.FeralAPI`: Exposed globally so inline scripts can access the module.

---

## File: feral.js

### What It Does
This file encapsulates all interactive UI behaviors in a front-end client environment:
- Handles collapsible hamburger menu navigation,
- Manages theme (dark/light) switching via local storage and system preference,
- Supports language toggle between English (`EN`) and Japanese (`JP`),
- Implements copy functionality with visual feedback on clipboard success/failure,
- Adds filtering and tab-switching behaviors for category content lists,
- Processes form submission validation for signal requests.

### Key Dependencies
No external frameworks required; uses vanilla JS DOM APIs, `localStorage`, event handling.

### Data Flow Overview

1. **Hamburger Menu**
   - Listens to click/touch events on menu controls (`#hamburger-btn`, `#menu-close`) and overlay (`#menu-overlay`).
2. **Theme Toggle**
   - Applies theme class based on stored or preferred settings.
3. **Language Switcher**
   - Changes page language attribute and text content of toggle button.
4. **Copy Button Behavior**
   - Utilizes clipboard API to copy data from `data-copy` attributes, updating UI temporarily after action.
5. **Filtering/Tabs Interaction**
   - Listens for clicks on filters or tab panels using custom dataset properties (`[data-filter]`, `[data-tab]`) and toggles item visibility or panel openness accordingly.
6. **Form Handling (Signal Request)**
   - Validates email input in a form with `data-form="signal"` before submission.

### Design Patterns
- **Self-Executing Anonymous Functions**: Each major block runs as an IIFE for isolation and global cleanup.
- **Delegated Event Listening**: Used for filter buttons, tabs, copy elements to avoid direct binding per element.
- **Dataset-based Interaction Logic**: Custom data attributes define behavior (e.g., `data-filter`, `data-copy`).

### Public API Functions
None directly exposed – but all functionality is available through DOM interaction logic.

---

## Cross-Module Integration

The two modules interoperate as such:
- `feral-api.js` provides core backend interaction and state management.
- `feral.js` depends on `FeralAPI` to update UI elements dynamically based on service availability or data responses, especially during real-time interactions like searching or copying text.

### Communication Flow Example

1. A user clicks "Copy" button with `data-copy="prompt_text_here"`
2. In `feral.js`, a script listens for click events and calls:
   ```js
   await navigator.clipboard.writeText("prompt_text_here");
   markCopied(button, "Copied");
   ```
3. If this were extended to use API responses (i.e., fetching dynamic prompts), it would integrate with `FeralAPI` functions like:
   - `searchRuns()` to pull prompt content,
   - `getSystemStats()` for contextual metadata.

---

## Configuration & Settings

- **Theme Storage Key**: `'feral-theme'`
- **Language Toggle Behavior**: Toggles the language attribute of `<html>` and changes displayed text on toggle button.
- **Default Language Preference**: Falls back to browser settings via `(prefers-color-scheme: dark)`.
- **Service Communication Endpoint**: `http://127.0.0.1:8765` (assumed from context; not explicitly hardcoded in code).

These variables are defined clearly within respective sections of both files.

---

## Summary

The `web/main` module represents a fully client-side frontend interface for interacting with an internal Feral backend through RESTful communications. It is designed to be modular yet cohesive, separating concerns cleanly between data acquisition (`feral-api`) and dynamic UI behavior (`feral.js`). Its flexibility allows extension through additional custom logic or enhanced communication layers while maintaining backward compatibility.

It includes robust fallback support for offline capabilities by integrating mock datasets provided by `FeralAPI` when network access is unavailable. Overall, the structure supports scalable growth with minimal coupling across different concerns of the interface and backend pipeline.

---