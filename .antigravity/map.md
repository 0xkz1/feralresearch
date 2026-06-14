# Feral System Overview

## Core Components

### Sidecar Service (main group)
The sidecar component handles environmental data processing and prompt generation:
- **Primary Function**: Communicates with OpenStreetMap (OSM) to gather geographic context around locations
- **Data Integration**: Maps location data from external sources like GeoJSON, Shapefiles, OpenStreetMap API responses, GPS coordinates, elevation data, etc.
- **Prompt Construction Engine** ("fm"): Uses rule-based logic along with a TOML configuration file for template-driven prompt generation based on environmental categories

### Web Module (main group)
The web module serves as the user interface:
- **Main Files**: feral-api.js and feral.js 
- **API Layer**: Communicates with local sidecar server at http://127.0.0.1:8765
- **Client-Side Logic**: Handles hamburger menus, theme switching, language toggling, copy functionality, filtering tabs, forms validation

## Key Features by Component

### Environmental Data Processing
In the sidecar:
- Uses `habitat_mapper` with configurable radius (km) and feature limits (max_features)
- Maps to environmental categories such as:
  - Land use types: residential/commercial/industrial areas
  - Natural features: parks, water bodies, forests 
  - Transportation networks: roads, highways, railways
  - Infrastructure points of interest

### Prompt Generation Engine
The "fm" template-based system allows for sophisticated prompt construction using multiple input parameters. The approach enables generating:
- Location-specific prompts that consider nearby geographical elements
- Contextual information from various categories (urban/rural, natural/developed)
- Customizable text templates with placeholders mapped to actual data

### Frontend Functionality 
Web module provides comprehensive interaction capabilities including:
- Real-time service health monitoring
- Archive search functionality for prompt runs  
- Research log browsing and analysis tools
- Responsive design support across devices and themes
- Language switching between English/Japanese

## Integration Points

The communication flow works as follows:
1. **Frontend Request** → Web module (`feral.js`) triggers `FeralAPI` methods
2. **Backend Interaction** → FeralAPI sends HTTP requests to sidecar service endpoints 
3. **Data Retrieval/Processing** → Sidecar processes queries and returns structured results  
4. **UI Update** → Frontend receives responses and dynamically updates page elements

This architecture maintains clear separation between business logic (sidecar) and presentation layer (web), allowing each to evolve independently while sustaining tight integration.

[Response interrupted by a system error - please try again]