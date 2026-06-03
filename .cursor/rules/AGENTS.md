# Express Server Template — Agent Rules

BEFORE implementing ANY feature, you MUST:
1. Read `.cursor/architecture/README.md`.
2. Search `.cursor/architecture/` for relevant Express ADRs.
3. Follow documented patterns EXACTLY.

## Layout (no `src/domains/`)

| Path | Purpose |
|------|---------|
| **`src/data/{table}/`** | **CRUD only** — one folder per database table, one function per file |
| **`src/services/{feature}/`** | Routers, handlers, `processX()` action/business logic |
| **`src/services/middleware`**, **`health`**, **`server`** | Cross-cutting (shipped in starter) |
| **`src/utils/{feature}/`** | Pure helpers used 2+ times |

**Never** add `src/domains/`. Business logic that uses CRUD belongs in **`src/services`**, not in `src/data`.

## Services (HTTP + business logic)

- ALWAYS organize API features in `src/services/{feature}/` with `router.ts`, `routes/`, optional `config.ts` and `types.ts`.
- MUST use router factory pattern: `createXRouter(): Router`; NEVER export a router instance directly.
- ALWAYS keep routers thin: route definitions only, no business logic.
- ALWAYS keep handlers in `src/services/{feature}/routes/` with one handler per file.
- ALWAYS put action/business logic in `processX()` files in the same `src/services/{feature}/` folder.
- MUST use `type` and NEVER use `interface`.

## Handlers

- MUST follow: (1) get managed client, (2) validate request, (3) call `processX()`, (4) try/catch, (5) return response.
- NEVER inline business logic or database queries in handlers.
- MUST add JSDoc on router factories, handlers, and `processX()` functions.
- MUST return `{ success: false, error }` with `500` on server errors; `200` / `400` per ADR 006.

## Data layer (`src/data/{table}/`)

- MUST place **only** database CRUD in `src/data/{table}/` — **one folder per table**.
- MUST keep **one CRUD function per file** with JSDoc.
- MUST NOT put business rules, HTTP, or orchestration in `src/data/`.
- NEVER inline queries in handlers or `processX()` — call data functions instead.

## Managed clients & edge

- MUST use `getManagedSupabaseClient()` / `getManagedAnthropicClient()` when added; NEVER `createClient()` in handlers, services, or data code.
- MUST initialize managed clients once at startup; null-check before use → `500`.
- Supabase edge functions MUST ONLY call Railway endpoints.

## Logging

Use emoji prefixes: `🚀` `✅` `❌` `📥` `📤` `🤖` `💾`

## Quick reference

- [001 – File & service organization](./architecture/001-file-and-service-organization.md)
- [002 – Router factory & handler pattern](./architecture/002-router-factory-and-handler-pattern.md)
- [003 – Data layer CRUD boundaries](./architecture/003-data-layer-crud-boundaries.md)
- [004 – Managed clients & startup init](./architecture/004-managed-clients-and-startup-init.md)
- [005 – Edge functions Railway-only](./architecture/005-edge-functions-railway-only.md)
- [006 – Logging & error response standards](./architecture/006-logging-and-error-response-standards.md)
- [007 – Starter template layout](./architecture/007-starter-template-layout.md)
