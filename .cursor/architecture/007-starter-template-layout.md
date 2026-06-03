# 007 - Starter Template Layout

## Status

Accepted

## Context

**express-server-template** ships with cross-cutting code under `src/services/` only. There is no database and no `src/data/` yet. This ADR documents the starter tree and how to add table-backed features **without** introducing `src/domains/`.

## Decision

### 1) Shipped layout (day one)

```text
index.ts
src/services/
  middleware/
  health/
  server/
```

- Factory routers (`createHealthRouter(): Router`).
- One function per file; `index.ts` barrel per folder.

### 2) Adding a feature (HTTP + business logic)

Add a **service** folder — not `domains/`:

```text
src/services/users/
  router.ts
  routes/
    get-user-handler.ts
  process-get-user.ts
  types.ts
  index.ts
```

```ts
import { createUsersRouter } from './src/services/users';
app.use('/api/users', createUsersRouter());
```

### 3) Adding database access

When you add Supabase (or another DB), add **one folder per table** under `src/data/`:

```text
src/data/users/
  get-user-by-id.ts
  create-user.ts
  index.ts
```

`process-get-user.ts` in `src/services/users/` calls `getUserById` from `src/data/users/` — never the other way around.

### 4) Managed clients

Add `src/services/managed/` per [004](./004-managed-clients-and-startup-init.md).

### 5) What stays in `src/services/`

| Folder | Role |
|--------|------|
| `middleware/`, `health/`, `server/` | Cross-cutting |
| `{feature}/` | Feature routers, handlers, `processX()` |
| `managed/` | Shared client init |

## Anti-patterns

- ❌ `src/domains/` — not part of this template
- ❌ CRUD or `.from('table')` inside handlers or `processX()`
- ❌ Business rules inside `src/data/{table}/`

## References

- Root `README.md` — quick start and “Adding New Routes”
