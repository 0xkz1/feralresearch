# Feral CMS System Documentation

## Overview

This system is a **Content Management System (CMS)** built using Sanity.io for managing content related to research projects, visual outputs, site settings, and gallery entries within a multilingual context.

---

## Technical Architecture & Key Components

### 1. Project Structure Overview

The code defines various schemas in `cms/schemaTypes/index.ts`, which are imported into the main configuration file (`sanity.config.ts` - assumed but not included here). These include:

- **Schema Definitions:** Typed content structures (types) to define data models.
- **Localization Support:** Uses nested objects containing English and Japanese fields for internationalization.
- **Ordering Logic:** Implements custom ordering using `@sanity/orderable-document-list`.

Each schema defines core fields, validation rules, previews, and relationships.

---

## Detailed Schema Breakdown

### 1. Feral Landing Page (`feralLanding.ts`)

#### Purpose
Represents the main landing page content including:
- Site tagline
- CTA text
- About section

#### Fields
| Field Name        | Type       | Description                     |
|-------------------|------------|----------------------------------|
| `title`           | Object     | Title of the page                |
| `heroText`        | Object     | Hero text or site tagline       |
| `aboutText`       | Object     | Brief about section             |
| `ctaLabel`        | Object     | Call-to-action button label     |

#### Preview Strategy
Uses only title field in preview.

```ts
preview: {
  select: { title: 'title' },
}
```

---

### 2. Feral Research Entry (`feralResearch.ts`)

#### Purpose
Manages structured data about research entries, including:
- Prompts used for generation
- Run types and statuses
- Content responses per language
- Labels/tags for categorization

#### Fields
| Field Name        | Type       | Description                                  |
|-------------------|------------|-----------------------------------------------|
| `title`           | Object     | Entry title (multi-lang)                     |
| `slug`            | Slug       | URI-friendly identifier                      |
| `prompt`          | Text       | Input prompt used during generation          |
| `runType`         | String Enum| Pipeline/Field/etc.                          |
| `date`            | DateTime   | Creation/modification date                   |
| `status`          | String Enum| Completion status                            |
| `content`         | Object     | Output content text (multi-lang)             |
| `source`          | String Enum| Origin of data (`pipeline` or `cms`)         |
| `labels`          | Array      | Tags associated with the entry              |
| `featured`        | Boolean    | Featured flag for landing page display       |

#### Ordering
Incorporates orderable document list functionality via:
```ts
orderRankField({ type: 'feralResearch' })
```

Previews are based on title and run-type.

---

### 3. Feral Gallery Entry (`feralGallery.ts`)

#### Purpose
Manages entries in an image gallery, potentially showing visual outputs from research activities or other media assets produced through pipeline stages.

#### Fields
| Field Name        | Type       | Description                                  |
|-------------------|------------|-----------------------------------------------|
| `title`           | Object     | Gallery item title (multi-lang)              |
| `slug`            | Slug       | URI-friendly identifier                      |
| `runType`         | String Enum| Associated pipeline stage                    |
| `date`            | DateTime   | Publication date                             |
| `content`         | Text       | Optional description or caption              |
| `source`          | String     | Origin of content (e.g., CMS-managed)        |
| `featured`        | Boolean    | Featured for prominent visibility            |

> *Note:* This schema doesn't yet define an image field, but could be extended accordingly.

---

### 4. Feral Dashboard (`feralDashboard.ts`)

#### Purpose
Provides structured configuration or overview for dashboards used in managing backend systems (e.g., pipeline monitoring).

#### Fields
| Field Name           | Type        | Description                                |
|----------------------|-------------|--------------------------------------------|
| `siteUrl`            | String      | Main website URL                           |
| `pipelines`          | Array       | Configurable pipelines                     |

> *Note:* This schema appears to be under development and currently does not include fully fleshed-out details like actual pipeline definitions.

---

### 5. Feral Site Settings (`feralSiteSettings.ts`)

#### Purpose
Manages global site-wide settings such as:
- Site name
- Hero text and about mission statement
- How it works steps with labels/descriptions
- Call-To-Action (CTA) text
- Footer message

#### Fields
| Field Name        | Type       | Description                                  |
|-------------------|------------|-----------------------------------------------|
| `siteName`        | Object     | Brand name                                   |
| `heroText`        | Object     | Tagline / headline                           |
| `aboutText`       | Object     | Mission/brief description                    |
| `howItWorks`      | Array of Objects | Steps explaining workflow              |
| `ctaText`         | Object     | CTA button text                              |
| `footerText`      | Object     | Footer copyright/credits                     |
| `pipelineStages`  | Array of Objects | Stages within the research pipeline    |

Each array item supports localized fields.

Preview:
```ts
preview: {
  select: { title: 'siteName.en', subtitle: 'Site-wide settings' },
}
```

---

## Localization Strategy

All schemas supporting multi-language content use nested object structures like:

```json
{
  "title": {
    "en": "Main Content",
    "ja": "メインコンテンツ"
  }
}
```

This allows for easy extension and maintenance of translations without needing to redefine structure.

- Uses standard ISO language codes (`en`, `ja`) consistently.
- Supports both string types and blocks (text fields) in translation-ready containers.

---

## Preview & Ordering

### Previews
Each schema implements a preview block:

```ts
preview: {
  select: { ... },
  prepare: ({ field1, field2 }) => ({ title: ..., subtitle: ... })
}
```

These ensure intuitive visual representation inside the Sanity Studio UI without loading full documents.

### Orderable Document Lists
- Implemented via:
  ```ts
  import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
  ```
- Applied to `feralResearch` and `feralGallery`
- Allows reordering entries directly in the Studio UI by dragging

Example usage in schema definition:

```ts
orderRankField({ type: 'feralResearch' }),
``` 

---

## Module Organization (`schemaTypes/index.ts`)

Aggregates all defined schemas from individual files into one array for central registration.

```ts
import { feralLanding } from './feralLanding'
import { feralResearch } from './feralResearch'
...
export const schemaTypes = [feralLanding, feralResearch, feralGallery, feralDashboard, feralSiteSettings]
```

This follows common practices for modularizing Sanity schemas.

---

## Validation Strategy

- Required fields like `title.en`, `label.en` in localized forms are explicitly validated using `.validation().required()`.
- Enum-based select options (`runType`, `status`) restrict input values.
- Slugs auto-populate from related fields, reducing manual errors.

Example:
```ts
defineField({
  name: 'runType',
  title: 'Run Type',
  type: 'string',
  options: { list: [...] },
  validation: (Rule) => Rule.required()
})
```

---

## Extensibility Notes

The system is designed with extensibility in mind:

1. **Multilingual Support:** Easily adaptable to support additional languages by adding new nested locale fields.
2. **New Schema Types:** New content types can be added following the pattern established for existing schemas.
3. **Ordering Controls:** The orderable plugin allows users to define priorities, making timelines or featured lists more dynamic.
4. **UI Integrations:** Can be extended with custom views or dashboards in Studio via plugins.

---

## Potential Improvements

1. Define a dedicated image field across applicable schemas (e.g., `feralGallery`) for visual content display.
2. Implement consistent date format handling and timezone awareness where necessary.
3. Add dynamic preview rendering based on selected fields beyond simple fallbacks.
4. Consider separating locale-related config into reusable modules if scale increases.

--- 

### Summary

This CMS provides a robust foundation for managing diverse research-oriented web content with multilingual flexibility, ordered display options (for recent/featured items), and well-structured schemas that align closely with Sanity best practices while remaining highly adaptable to future enhancements or feature additions.