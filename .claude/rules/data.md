---
paths:
  - "src/data/**"
---

# `src/data/` — CRUD only

Read before editing: [003 – Data layer CRUD boundaries](../../.cursor/architecture/003-data-layer-crud-boundaries.md), [008 – Domain models](../../.cursor/architecture/008-domain-models.md).

- One table folder, **one exported CRUD function per file**, JSDoc on each.
- **No `types.ts` here** — import row/input types from `src/model/{entity}`.
- No business rules, orchestration, or HTTP (`req`/`res`) in CRUD files.
- Barrel `index.ts` exports CRUD functions only.
