# Feral Research

Public observation system focused on feral animals, displaced pets, abandoned livestock, disaster ecology, and animal migration caused by war, disaster, or human activity.

## Architecture

```
feral/
├── web/       # Public website (HTML/CSS/JS)
├── cms/       # Sanity CMS (Under development)
├── engine/    # Scraping, SQLite, sidecar API, RAG, n8n workflows
└── vault/     # Facts, ideas, canvas, assets (Obsidian-compatible)
```

## Pipeline

```
World → Engine → Database/RAG → Vault → CMS → Public Website → Readers → Next Observation
```

### システムフロー図 (Mermaid)

```mermaid
flowchart LR
    A[World / 外部情報<br/>Reuters・Web・Reddit・その他]:::world

    subgraph U[Ubuntu / feral-engine]
        B[Ingestion<br/>scraping / parsing / classification]:::engine
        C[(SQL DB)]:::db
        D[RAG Index]:::rag
        E[RAG Retrieval<br/>検索・要約・関連付け]:::rag
        F[Hermes Agent<br/>観測→判断→タスク分配]:::agent
        G[Image Generation<br/>画像生成フェーズ]:::image
        H[Artifacts Output<br/>images / logs / packets]:::artifact
    end

    subgraph M[Mac / Obsidian + feral/vault]
        I[obsidian-vault<br/>個人メモ・草稿]:::vault
        J[feral/vault<br/>fact / idea / canvas / assets]:::vault
        K[Sanity / feral-cms<br/>公開用の編集・注釈・順序調整]:::cms
    end

    subgraph W[Public Web / feral-web]
        direction TB
        M1[Data dashboard]:::web
        N[Research log]:::web
        P[Article]:::web
        Q[Note]:::web
        O[Gallery]:::web
    end

    subgraph D1[External discussion]
        R[読者・参加者]:::discussion
        S[Reddit / Discussion]:::discussion
    end

    T[OpenCode<br/>開発・修正の支援]:::dev

    A --> B
    B --> C
    B --> D
    C --> E
    D --> E
    E --> F
    F --> G
    G --> H
    H --> J

    I --> J
    J --> K

    K --> M1
    K --> N
    K --> P
    K --> Q
    K --> O

    M1 --> R
    N --> R
    P --> R
    Q --> R
    O --> R
    R --> S
    S --> A

    R --> J
    R --> B

    T --> K
    T --> J
    T --> B

    classDef world fill:#e5e7eb,stroke:#6b7280,color:#111827,stroke-width:1px;
    classDef engine fill:#dbeafe,stroke:#2563eb,color:#0f172a,stroke-width:1px;
    classDef db fill:#bfdbfe,stroke:#1d4ed8,color:#0f172a,stroke-width:1px;
    classDef rag fill:#ede9fe,stroke:#7c3aed,color:#111827,stroke-width:1px;
    classDef agent fill:#fef3c7,stroke:#d97706,color:#111827,stroke-width:1px;
    classDef image fill:#fce7f3,stroke:#db2777,color:#111827,stroke-width:1px;
    classDef artifact fill:#ffe4e6,stroke:#e11d48,color:#111827,stroke-width:1px;
    classDef vault fill:#dcfce7,stroke:#16a34a,color:#111827,stroke-width:1px;
    classDef cms fill:#cffafe,stroke:#0891b2,color:#111827,stroke-width:1px;
    classDef web fill:#fae8ff,stroke:#a855f7,color:#111827,stroke-width:1px;
    classDef discussion fill:#f3f4f6,stroke:#4b5563,color:#111827,stroke-width:1px;
    classDef dev fill:#fed7aa,stroke:#ea580c,color:#111827,stroke-width:1px;
```

## Features

### Research Log UI (`web/`)
- **Dual Observation Densities**: Displays short telemetry logs alongside expandable, in-depth editorial readings and generated visual prompts.
- **Unified Navigation**: Structured across Home, Data Dashboard, Research Log, and Gallery.

### Sidecar Engine & API (`engine/`)
- **Dynamic Narrative Building**: Enriches raw disaster data with OpenStreetMap local habitat tags to generate descriptive animal-viewpoint prompts.
- **Structured Database**: Fully tracks disaster occurrences, OSM features, and generated prompts in a unified SQLite repository.
- **GET `/logs` Endpoint**: Serves the 50 most recent log runs formatted for the frontend Research Log view.
- **RAG & Search Support**: Includes API endpoints for retrieving log histories and executing semantic searches on prompt runs.

## Project Status

- **Phases 1-3 (Completed)**: Core UI navigation structure, Research Log frontend rendering logic (supporting short/long logs), SQLite database schema expansion, and Sidecar API setup (ingestion pipeline & logs endpoint) are fully implemented and verified.
- **Next Steps**:
  - Implement and integrate with the Sanity CMS framework (`cms/`).
  - Deploy and test the n8n automation workflows with ComfyUI visual generation.

