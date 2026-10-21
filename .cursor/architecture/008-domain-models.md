# 008 – Domain models (`src/model`)

## Status

Accepted

## Context

ADRs 001 and 003 previously allowed optional row types in `src/data/{table}/types.ts`. That mixed **CRUD** with the **domain contract**.

`src/data/` is CRUD only: one table folder, one function per file. Table row shapes and write inputs are shared by data functions, `processX()`, handlers, and utils. Those types belong in `src/model/`, not beside SQL.

Managed clients remain **Supabase** (`getManagedSupabaseClient()`). This ADR does not change that.

## Decision

### 1) Canonical location

Every persisted table entity lives in **`src/model/{entity}/`** (singular kebab-case, matching the Next.js web app). The folder’s **`index.ts`** exports the row type plus create/update/upsert input types and colocated unions.

```text
src/model/
  index.ts
  order/
    index.ts
  user/
    index.ts
```

✅ Correct:

```ts
// src/model/order/index.ts
export type Order = {
  id: string;
  status: string;
  // ...
};

export type CreateOrderInput = {
  status: string;
  // ...
};
```

❌ Incorrect:

```text
src/data/orders/types.ts   # ❌ no model types in the data layer
```

Tiny greenfield entities may use flat `src/model/{entity}.ts`; prefer folders when the entity has multiple related types.

### 2) One entity folder

- One **table entity** per folder (plus that entity’s status unions and create/update/upsert input types in `index.ts`).
- Do not dump unrelated tables into one `types.ts`.
- Re-export from `src/model/index.ts`.
- **Table folders** in `src/data/` use the SQL table name (often plural): `src/data/orders/` vs `src/model/order/`.

### 3) What stays out of `src/model`

| Location | Allowed types |
|----------|----------------|
| `src/services/{feature}/types.ts` | HTTP/feature DTOs that are **not** table rows |
| `src/data/{table}/` | **No types files.** Import from `../../model/{entity}` |

### 4) Import rules

```ts
import type { Order, CreateOrderInput } from '../../model/order';
import { createOrder } from '../../data/orders';
```

Data barrels export **CRUD functions only**. They must not re-export model types.

### 5) Pairing with the web app

Keep field names and entity folder names aligned with the Next.js app `src/model/`. Create/update **payloads** on the web stay in `src/api/{domain}/client.ts`; Express write inputs live in `src/model/{entity}/`.

## Consequences

- `src/data/` stays SQL/CRUD.
- Agents add `src/model/{entity}/index.ts` before the first data function for a new table.
- ADRs 001 and 003 no longer allow `src/data/{table}/types.ts`.

## Related

- [001 – File & service organization](./001-file-and-service-organization.md)
- [003 – Data layer CRUD boundaries](./003-data-layer-crud-boundaries.md)
