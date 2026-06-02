# 003: Data Layer CRUD Boundaries

- **Status:** Accepted
- **Date:** 2026-02-27
- **Applies to:** `roads-platform-express-server` (Express)

## Context

To keep domain code maintainable and testable, database access must be isolated from handlers, routers, and business logic. This document defines strict boundaries for CRUD behavior, Supabase client usage, and file organization.

## Decision

### 1) CRUD location and ownership

1. All database CRUD operations live in `src/data/{entity}/`.
2. Never inline SQL/query-builder calls in domain handlers or business logic.
3. The data layer is the only layer that talks directly to Supabase tables.

### 2) One function per file in the data layer

1. Each file in `src/data/{entity}/` exports exactly one CRUD function.
2. File names describe the action (for example: `getUserById.ts`, `createUser.ts`, `updateUserById.ts`, `deleteUserById.ts`).
3. Every function has JSDoc.

### 3) Supabase client contract

1. Every data-layer function accepts `SupabaseClient` as the first parameter.
2. Domain code must not call `createClient()` directly.
3. Domain handlers obtain clients via `getManagedSupabaseClient()` and pass the client into data functions.
4. Handlers must check for null managed clients and return HTTP 500 if unavailable.

### 4) Domain architecture

1. Domains are self-contained under `src/domains/{domain}/`.
2. Required structure:
   - `router.ts` (factory only)
   - `routes/` (one handler per file)
   - `config.ts`
   - `types.ts` (use `type`, not `interface`)
3. Routers are thin: route wiring only, no business logic or try/catch blocks.
4. Handlers delegate business logic to `processX()` functions.

### 5) Handler contract

Each handler follows this order:

1. Get managed client(s)
2. Validate request
3. Call business logic (`processX()`)
4. Handle errors in `try/catch`
5. Return response

Status code contract:

- `200` success
- `400` client error
- `500` server error

Error payload shape:

```json
{ "success": false, "error": "..." }
```

### 6) Additional architecture constraints

1. Initialize managed service clients once at server startup, never per-request.
2. Supabase edge functions call Railway endpoints only (no CRUD/business logic in edge).
3. Extract utilities used 2+ times into `src/utils/{domain}/` as pure functions.
4. Use emoji log prefixes consistently:
   - `🚀` start
   - `✅` success
   - `❌` error
   - `📥` request
   - `📤` response
   - `🤖` AI
   - `💾` DB

## Reference layout

```text
src/
  data/
    users/
      getUserById.ts
      createUser.ts
      updateUserById.ts
      deleteUserById.ts
  domains/
    users/
      router.ts
      config.ts
      types.ts
      routes/
        getUserHandler.ts
      processGetUser.ts
  utils/
    users/
      normalizeUserName.ts
```

## ✅ Correct examples

### Data layer function (`src/data/users/getUserById.ts`)

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRow } from "../../domains/users/types";

/**
 * Fetches one user row by ID.
 */
export async function getUserById(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}
```

### Business logic (`src/domains/users/processGetUser.ts`)

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserById } from "../../data/users/getUserById";

/**
 * Processes user retrieval domain logic.
 */
export async function processGetUser(
  supabase: SupabaseClient,
  userId: string,
) {
  return getUserById(supabase, userId);
}
```

### Handler (`src/domains/users/routes/getUserHandler.ts`)

```ts
import type { Request, Response } from "express";
import { getManagedSupabaseClient } from "../../../services/managed/supabase";
import { processGetUser } from "../processGetUser";

/**
 * Handles GET /users/:id.
 */
export async function getUserHandler(req: Request, res: Response) {
  try {
    const supabase = getManagedSupabaseClient();
    if (!supabase) {
      console.error("❌ Supabase client unavailable");
      return res.status(500).json({ success: false, error: "Service unavailable" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Missing id" });
    }

    console.info("📥 GET /users/:id", { id });
    const user = await processGetUser(supabase, id);
    console.info("✅ User fetched", { id });

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("❌ Failed to fetch user", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
```

## ❌ Incorrect examples

### Inline query in domain logic (not allowed)

```ts
// src/domains/users/processGetUser.ts
export async function processGetUser(supabase, userId: string) {
  // ❌ Query is inline in domain logic.
  const { data } = await supabase.from("users").select("*").eq("id", userId).single();
  return data;
}
```

### Multiple CRUD functions in one data file (not allowed)

```ts
// src/data/users/userCrud.ts
// ❌ Violates one-function-per-file rule.
export async function getUserById(...) {}
export async function createUser(...) {}
```

### Creating Supabase clients in domain code (not allowed)

```ts
// src/domains/users/routes/getUserHandler.ts
import { createClient } from "@supabase/supabase-js";

export async function getUserHandler(req, res) {
  // ❌ Do not construct clients per request.
  const supabase = createClient(process.env.URL!, process.env.KEY!);
}
```

## Enforcement checklist

- [ ] CRUD lives in `src/data/{entity}/`
- [ ] One function per data file with JSDoc
- [ ] Supabase client is first argument in each data function
- [ ] No inline queries in handlers/process functions
- [ ] Handlers check managed client null -> `500`
- [ ] Routers only wire routes via `createXRouter(): Router`
