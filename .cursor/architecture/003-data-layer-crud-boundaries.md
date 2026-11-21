# 003 - Data Layer CRUD Boundaries

## Status

Accepted

## Applies to

**express-server-template** and Express apps created from it.

## Context

Database access must stay isolated from HTTP handlers and business logic. **`src/data/{table}/` is CRUD only.** Business logic that **uses** CRUD lives in **`src/services/{feature}/`** (`processX()`), never in `src/data/` and never in `src/domains/` (which this template does not use). Process functions exist only when there is real business logic. Pass-through files double the file count without adding behaviour, so logic gets a home when it exists, not before.

## Decision

### 1) CRUD location

1. All database CRUD lives in `src/data/{table}/` — **one folder per database table**.
2. Never inline SQL or query-builder calls in handlers, routers, or `processX()`.
3. Only the data layer talks directly to tables.

### 2) One function per file

1. Each file in `src/data/{table}/` exports exactly one CRUD function.
2. File names describe the action (`get-user-by-id.ts`, `create-user.ts`, …).
3. Every function has JSDoc.
4. **No `types.ts` in the table folder.** Row and write-input types live in `src/model/{entity}/` ([008](./008-domain-models.md)).

### 3) What is forbidden in `src/data/`

- Business rules (validation beyond DB constraints, pricing, permissions orchestration)
- HTTP or Express types
- Calling `processX()` or handlers
- AI / external API calls

### 4) Supabase client contract

1. Every data function accepts `SupabaseClient` as the first parameter.
2. No `createClient()` in data, services, or handlers.
3. Handlers get clients via `getManagedSupabaseClient()` and pass them to the data function (plain CRUD) or to `processX()` (real business logic), which passes them on to data functions.
4. Null managed client → HTTP `500`.

### 5) Service layer (`src/services/{feature}/`)

1. `router.ts` — factory only, thin wiring.
2. `routes/` — one handler per file; no inline queries.
3. `process-*.ts` — created **only** when an operation has logic beyond plain CRUD: multi-step writes, cross-table rules, derived values, external or AI calls. It takes the client first and **may call** `src/data/{table}/` only. **Never** generate or write pass-through process functions that just forward to a data function; add one later, when logic actually appears.
4. Handler flow:
   1. Log `📥`.
   2. Get the managed client; if it is null, answer `500`.
   3. Validate params, query and body; if any is bad, answer `400`.
   4. Call the work function. For plain CRUD, that is the `src/data/{table}/` function (e.g. `listContextAreas(client)`). Use `processX()` only when one exists for real business logic.
   5. Respond `200` with data, or `404` when get, update or delete finds no row.

   One try/catch around the whole body logs `❌` and answers `500`.

Status codes: `200` success, `400` client error, `404` row not found, `500` server error.

```json
{ "success": false, "error": "..." }
```

## Reference layout

```text
src/
  data/
    users/                       # table name = folder name
      get-user-by-id.ts
      get-user-by-email.ts
      create-user.ts
      index.ts
  model/
    user/
      index.ts
  services/
    users/
      router.ts
      routes/
        get-user-handler.ts      # plain CRUD: calls getUserById directly
        post-invite-user-handler.ts
      process-invite-user.ts     # real business logic only
      types.ts
```

## ✅ Correct examples

### Data (`src/data/users/get-user-by-id.ts`)

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRow } from '../../model/user';

/**
 * Fetches one user row by ID.
 */
export async function getUserById(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserRow | null> {
  console.log('💾 getUserById', { userId });
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}
```

### Plain CRUD handler (`src/services/users/routes/get-user-handler.ts`)

```ts
import type { Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../managed/clients';
import { getUserById } from '../../../data/users/get-user-by-id';

/**
 * Handles GET /users/:id.
 */
export async function getUserHandler(req: Request, res: Response) {
  console.log('📥 GET /users/:id', { params: req.params });
  try {
    const supabase = getManagedSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Service unavailable' });
    }
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing id' });
    }
    const user = await getUserById(supabase, id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('❌ Failed to fetch user', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
```

### Business logic (`src/services/users/process-invite-user.ts`)

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { getUserByEmail } from '../../data/users/get-user-by-email';
import { createUser } from '../../data/users/create-user';

/**
 * Invites a user: rejects duplicates, normalizes the email, then creates the row.
 */
export async function processInviteUser(supabase: SupabaseClient, email: string) {
  const normalized = email.trim().toLowerCase();
  const existing = await getUserByEmail(supabase, normalized);
  if (existing) throw new Error('User already exists');
  return createUser(supabase, { email: normalized, status: 'invited' });
}
```

## ❌ Incorrect examples

### Pass-through process function (not allowed)

```ts
// src/services/users/process-get-user.ts  ❌ just forwards to the data layer
export async function processGetUser(supabase, userId: string) {
  return getUserById(supabase, userId);
}
```

### Inline query in `processX` (not allowed)

```ts
// src/services/users/process-invite-user.ts
export async function processInviteUser(supabase, email: string) {
  const { data } = await supabase.from('users').select('*').eq('email', email).single(); // ❌
  return data;
}
```

### Business logic in data layer (not allowed)

```ts
// src/data/users/get-user-by-id.ts
export async function getUserById(supabase, userId: string) {
  if (!userId.startsWith('usr_')) throw new Error('bad id'); // ❌
}
```

### Multiple CRUD functions in one file (not allowed)

```ts
// src/data/users/user-crud.ts  ❌
export async function getUserById(...) {}
export async function createUser(...) {}
```

### Using `src/domains/` (not allowed)

```text
src/domains/users/   # ❌ not part of this template
```

## Enforcement checklist

- [ ] One `src/data/{table}/` folder per table
- [ ] One CRUD function per file with JSDoc
- [ ] No queries in handlers or `processX()`
- [ ] Plain CRUD handlers call `src/data/{table}/` functions directly
- [ ] `src/services/{feature}/process-*.ts` only for real business logic; no pass-through process functions
- [ ] No `src/domains/` directory
