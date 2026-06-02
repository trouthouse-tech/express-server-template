# 007 - Starter Template Layout (`src/services/`)

## Status

Accepted

## Context

New repos cloned from **express-server-template** start with a minimal tree under `src/services/` (middleware, health, server startup). Full TroutHouseTech Express apps use `src/domains/` and `src/data/` per [001 – File & domain organization](./001-file-and-domain-organization.md). Agents and contributors need an explicit bridge so early routes do not stay in `services/` forever.

## Decision

### 1) Shipped layout (day one)

```text
index.ts
src/services/
  middleware/     # CORS, JSON, error handling
  health/         # createHealthRouter()
  server/         # startServer()
```

- Routers use the **factory pattern** (`createXRouter(): Router`) even in `services/`.
- **One function per file**; barrel `index.ts` per folder.
- `index.ts` mounts routers and calls `setupEarlyMiddleware` / `setupErrorHandling`.

### 2) When to add `src/domains/`

Add a domain folder when a feature has **handlers + business logic** (not just a single health-style route):

```text
src/domains/my-feature/
  router.ts
  routes/
    list-handler.ts
  process-list.ts
  types.ts
  index.ts
```

Mount in `index.ts`:

```ts
import { createMyFeatureRouter } from './src/domains/my-feature';
app.use('/api/my-feature', createMyFeatureRouter());
```

### 3) When to add `src/data/` and managed clients

- Add `src/data/{entity}/` when you introduce a database.
- Add `src/services/managed/` (or equivalent) and follow [004 – Managed clients & startup init](./004-managed-clients-and-startup-init.md).

### 4) Keep `src/services/` for cross-cutting concerns

Middleware, health checks, and server bootstrap stay in `src/services/` even after domains exist. Do not put domain business logic in `services/`.

## Consequences

- README “Adding New Routes” examples under `src/services/` are valid for the **first** simple router; migrate to `src/domains/` before the feature grows.
- [002 – Router factory & handler pattern](./002-router-factory-and-handler-pattern.md) applies to both `services/` routers and domain routers.

## References

- Repository root `README.md` — project structure and quick start.
