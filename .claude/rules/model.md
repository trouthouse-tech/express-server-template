---
paths:
  - "src/model/**"
---

# `src/model/` — row + write-input types

Read: [008 – Domain models](../../.cursor/architecture/008-domain-models.md).

- One folder per entity: `src/model/{entity}/index.ts` (singular kebab-case), re-exported from `src/model/index.ts`.
- Row type + create/update/upsert inputs + unions only. No functions with side effects.
- Field names must match the sibling repos' `src/model/{entity}` (storage ↔ express ↔ web).
