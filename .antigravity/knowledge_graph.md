# Knowledge Graph

- workspace: /media/kz003/atelier/feral
- created_at_utc: 2026-06-14T13:51:05.373656+00:00
- nodes: 123
- edges: 135

## Summary
```json
{
  "file_count": 51,
  "walked_file_count": 51,
  "languages": {
    "Markdown": 13,
    "TypeScript": 8,
    "JSON": 8,
    "HTML": 5,
    "JavaScript": 2,
    "CSS": 1,
    "YAML": 1,
    "Python": 1,
    "SQL": 1
  },
  "frameworks": [],
  "type_distribution": {
    "code": 40,
    "other": 8,
    "data": 1,
    "documentation": 2
  },
  "semantic_files": 11,
  "semantic_edges": 70,
  "semantic_files_by_language": {
    "JavaScript": 2,
    "Python": 1,
    "TypeScript": 8
  },
  "semantic_edges_by_type": {
    "declares_package": 11,
    "defines": 24,
    "entrypoint": 1,
    "imports": 34
  },
  "semantic_adapters": {
    "python": 1,
    "typescript": 10
  },
  "generic_fallback_file_count": 0,
  "parse_error_file_count": 0
}
```

## Sample Nodes
- workspace: feral
- language: Markdown
- language: TypeScript
- language: JSON
- language: HTML
- language: JavaScript
- language: CSS
- language: YAML
- language: Python
- language: SQL
- directory: cms
- directory: engine
- directory: outputs
- directory: vault
- directory: web
- code: README.md
- other: .env
- code: web/landing.html
- code: web/gallery.html
- code: web/PROGRESS.md

## Sample Edges
- workspace:/media/kz003/atelier/feral --uses_language--> language:markdown
- workspace:/media/kz003/atelier/feral --uses_language--> language:typescript
- workspace:/media/kz003/atelier/feral --uses_language--> language:json
- workspace:/media/kz003/atelier/feral --uses_language--> language:html
- workspace:/media/kz003/atelier/feral --uses_language--> language:javascript
- workspace:/media/kz003/atelier/feral --uses_language--> language:css
- workspace:/media/kz003/atelier/feral --uses_language--> language:yaml
- workspace:/media/kz003/atelier/feral --uses_language--> language:python
- workspace:/media/kz003/atelier/feral --uses_language--> language:sql
- workspace:/media/kz003/atelier/feral --contains--> dir:cms
- workspace:/media/kz003/atelier/feral --contains--> dir:engine
- workspace:/media/kz003/atelier/feral --contains--> dir:outputs
- workspace:/media/kz003/atelier/feral --contains--> dir:vault
- workspace:/media/kz003/atelier/feral --contains--> dir:web
- workspace:/media/kz003/atelier/feral --contains--> file:README.md
- workspace:/media/kz003/atelier/feral --contains--> file:.env
- workspace:/media/kz003/atelier/feral --contains--> file:web/landing.html
- workspace:/media/kz003/atelier/feral --contains--> file:web/gallery.html
- workspace:/media/kz003/atelier/feral --contains--> file:web/PROGRESS.md
- workspace:/media/kz003/atelier/feral --contains--> file:web/feral-api.js
