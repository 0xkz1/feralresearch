# Sanity CMS

Editorial control layer for Feral Research content.

## Schema Types

| Type | Description |
|------|-------------|
| `feralResearch` | Research entries (pipeline/field/visual/ecosystem) |
| `feralGallery` | Gallery items |
| `feralSiteSettings` | Site-wide configuration |
| `feralLanding` | Landing page content |
| `feralDashboard` | Dashboard configuration |

## Stack

- **Sanity v3** with structure tool, vision tool
- **`@sanity/orderable-document-list`** for drag-and-drop ordering
- **Project ID**: `5ha2hgsc`, Dataset: `production`

## Key Files

- `sanity.config.ts` — Studio configuration
- `schemaTypes/` — All schema definitions
- `node_modules/` — Installed dependencies (pnpm)

## Status

Scaffolded. Not yet connected to engine data source.
