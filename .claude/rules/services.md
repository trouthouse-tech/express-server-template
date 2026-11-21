---
paths:
  - "src/services/**"
  - "index.ts"
---

# `src/services/` — routers, handlers, business logic

Read before editing: [001](../../.cursor/architecture/001-file-and-service-organization.md), [002 – Router factory & handler](../../.cursor/architecture/002-router-factory-and-handler-pattern.md), [004 – Managed clients](../../.cursor/architecture/004-managed-clients-and-startup-init.md), [006 – Logging & errors](../../.cursor/architecture/006-logging-and-error-response-standards.md).

- Routers: `export const createXRouter = (): Router => ...`; never export a router instance; no logic in routers.
- One handler per file in `routes/`. Order: log `📥` → get managed client (null → `500`) → validate (bad → `400`) → call the `src/data` function for plain CRUD, or `processX()` only when one exists for real business logic → respond `200` (`404` when get/update/delete finds no row). One try/catch around the whole body.
- `process-*.ts` only for logic beyond plain CRUD (multi-step writes, cross-table rules, derived values, external/AI calls). Never pass-through process functions.
- Managed clients only via `getManaged*Client()`; null → `500`. Never construct clients in handlers/services/data.
- Responses: `{ success: true, data }` / `{ success: false, error }` with `200`/`400`/`404`/`500`.
- Emoji log prefixes `🚀 ✅ ❌ 📥 📤 🤖 💾`. `type`, never `interface`. JSDoc on factories, handlers, `processX()`.
- Never add `src/domains/`.
