# Architecture Documentation

ADRs for **express-server-template** and apps created from it.

## ADR index

1. [001 – File & service organization](./001-file-and-service-organization.md) — `src/data/{table}/` CRUD only; `src/services/{feature}/` for HTTP and business logic. **No `src/domains/`.**
2. [002 – Router factory & handler pattern](./002-router-factory-and-handler-pattern.md) — Thin routers, handlers, `processX()`.
3. [003 – Data layer CRUD boundaries](./003-data-layer-crud-boundaries.md) — One table folder, one function per file.
4. [004 – Managed clients & startup init](./004-managed-clients-and-startup-init.md) — Startup init, accessors.
5. [005 – Edge functions & Railway boundaries](./005-edge-functions-railway-only.md) — Edge → Railway only.
6. [006 – Logging & error response standards](./006-logging-and-error-response-standards.md) — Emoji logging, response shape.
7. [007 – Starter template layout](./007-starter-template-layout.md) — Shipped `src/services/` tree.
8. [008 – Domain models (`src/model`)](./008-domain-models.md) — table row + write-input types in `src/model/{entity}/`; never `src/data/{table}/types.ts`.
9. [009 – Stripe Checkout one-time payment](./009-stripe-checkout-one-time-payment.md) — hosted `mode: "payment"`, webhook + complete, grant once when paid.
10. [010 – No SQL functions](./010-no-sql-functions.md) — tables, indexes, grants, RLS only; `updated_at` in CRUD.
11. [011 – Project dispatcher role](./011-project-dispatcher-role.md) — `dispatcher` repos: loopback dispatcher that spawns and proxies storage + API for the main gateway; generic code plus `src/config/project.ts`.
12. [012 – Dispatcher registry and catalog](./012-dispatcher-registry-and-catalog.md) — `dispatcher.services.json` services; exposed paths are storage rows, validated against registry prefixes.
13. [013 – Dispatcher secrets per hop](./013-dispatcher-secrets-per-hop.md) — gate, admin and storage secrets per hop; env var names only.
14. [014 – Dispatcher naming and ports](./014-dispatcher-naming-and-ports.md) — `{project}-storage` / `-api` / `-dispatcher` ids, four loopback ports from Code Control, spawn folders under `STUDIO_REPOS_ROOT`.

## How to use

1. Open the ADR for your feature.
2. Follow the patterns exactly.
3. Add ADRs when decisions change and update this index.
