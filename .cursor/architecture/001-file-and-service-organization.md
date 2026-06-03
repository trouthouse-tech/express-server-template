# 001 - File & Service Organization

## Status

Accepted

## Context

Express servers in this template organize **HTTP and business logic** under `src/services/` and **database CRUD only** under `src/data/`. There is **no `src/domains/` folder** — do not introduce one.

## Decision

### Canonical folder structure

✅ Correct:

```text
src/
  data/                          # CRUD only — one folder per database table
    users/
      get-user-by-id.ts
      create-user.ts
      update-user-by-id.ts
      delete-user-by-id.ts
      types.ts                   # optional row/DTO types for this table
      index.ts
    orders/
      insert-order.ts
      select-order-by-id.ts
      index.ts
  services/                      # routes, handlers, action/business logic
    middleware/
    health/
    server/
    managed/                     # startup client init (when added)
    users/
      router.ts
      routes/
        get-user-handler.ts
      process-get-user.ts
      types.ts
      index.ts
  utils/
    users/
      normalize-user-name.ts
      index.ts
index.ts
```

❌ Incorrect:

```text
src/
  domains/                       # ❌ not used in this template
  data/
    crud.ts                      # ❌ multiple tables or functions in one file
  services/
    users/
      get-user-handler.ts        # ❌ handler with inline .from('users') query
  routes/
    users.ts                     # ❌ global routes folder with mixed concerns
```

**Reasoning:** `src/data/{table}/` owns every Supabase/table call. `src/services/{feature}/` owns routers, handlers, and `processX()` orchestration that **calls** data functions.

---

### `src/data/{table}/` — CRUD only

| Rule | Detail |
|------|--------|
| One folder per **table** | `src/data/users/`, `src/data/orders/` — folder name matches the table |
| One function per file | `get-user-by-id.ts`, `create-user.ts`, etc. |
| CRUD only | `select`, `insert`, `update`, `delete` — no business rules, no HTTP, no AI |
| JSDoc | Required on every exported function |
| Client param | `SupabaseClient` (or DB client) as first argument |
| No `createClient()` | Data layer never constructs clients |

✅ Correct:

```typescript
// src/data/users/get-user-by-id.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRow } from './types';

/**
 * Fetches one user row by id.
 */
export const getUserById = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<UserRow | null> => {
  console.log('💾 getUserById', { userId });
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
};
```

❌ Incorrect:

```typescript
// src/data/users/get-user-by-id.ts
export const getUserById = async (supabase, userId: string) => {
  if (!userId.startsWith('usr_')) throw new Error('invalid'); // ❌ business rule in data layer
  // ...
};
```

---

### `src/services/{feature}/` — HTTP + business logic

Feature folders hold everything that is **not** raw CRUD:

| File / folder | Purpose |
|---------------|---------|
| `router.ts` | `createXRouter(): Router` — route wiring only |
| `routes/` | One handler per file |
| `process-*.ts` | Action/business logic; may call `src/data/` and `src/utils/` |
| `types.ts` | Request/response and feature types (`type`, not `interface`) |
| `config.ts` | Optional feature config |

✅ Correct:

```typescript
// src/services/users/process-get-user.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { getUserById } from '../../data/users/get-user-by-id';

/**
 * Loads a user for GET /users/:id.
 */
export const processGetUser = async (
  supabase: SupabaseClient,
  userId: string,
) => {
  const user = await getUserById(supabase, userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};
```

❌ Incorrect:

```typescript
// src/services/users/process-get-user.ts
export const processGetUser = async (supabase, userId: string) => {
  // ❌ inline query — belongs in src/data/users/
  const { data } = await supabase.from('users').select('*').eq('id', userId).single();
  return data;
};
```

---

### Handlers and routers

- Handlers live in `src/services/{feature}/routes/`.
- Handlers delegate to `processX()` in the same service folder.
- Routers stay thin; see [002 – Router factory & handler pattern](./002-router-factory-and-handler-pattern.md).

---

### Cross-cutting `src/services/`

These folders are not table-backed features:

- `middleware/` — CORS, body parsing, error handling
- `health/` — health routers
- `server/` — `startServer()`
- `managed/` — `initializeManagedClients()`, `getManagedSupabaseClient()`, etc.

---

### Utilities

- Pure helpers used **2+ times** → `src/utils/{feature}/`.
- Must have no side effects.

---

### Edge functions

- Supabase edge functions call Railway only — no CRUD, no business logic. See [005](./005-edge-functions-railway-only.md).

---

## Related

- [002 – Router factory & handler pattern](./002-router-factory-and-handler-pattern.md)
- [003 – Data layer CRUD boundaries](./003-data-layer-crud-boundaries.md)
- [007 – Starter template layout](./007-starter-template-layout.md)
