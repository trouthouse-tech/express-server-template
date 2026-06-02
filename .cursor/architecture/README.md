# Architecture Documentation

Architecture Decision Records (ADRs) for the **express-server-template** and projects created from it.

## Why ADRs?

ADRs document:
- **What** standards we follow
- **Why** we chose them
- **How** to apply them consistently

## ADR index (on-disk)

### Shared conventions (001–006, 007)

1. [001 – File & domain organization](./001-file-and-domain-organization.md) — Domain-based structure, one focused function per file.
2. [002 – Router factory & handler pattern](./002-router-factory-and-handler-pattern.md) — Thin routers, handlers own request flow.
3. [003 – Data layer & CRUD boundaries](./003-data-layer-crud-boundaries.md) — Isolate database CRUD in `src/data/`.
4. [004 – Managed clients & startup init](./004-managed-clients-and-startup-init.md) — Initialize shared clients at startup.
5. [005 – Edge functions & Railway boundaries](./005-edge-functions-railway-only.md) — Edge functions call Railway only.
6. [006 – Logging & error response standards](./006-logging-and-error-response-standards.md) — Emoji logging and `{ success, error }` responses.
7. [007 – Starter template layout](./007-starter-template-layout.md) — Shipped `src/services/` layout and migration to domains.

## How to use

1. Open the ADR most relevant to your feature.
2. Follow the approved patterns in implementation.
3. Add new ADRs here whenever architectural decisions change—and **update this index** when you do.
