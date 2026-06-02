# 002 - Router Factory and Handler Pattern

## Status
Accepted

## Goal
Standardize Express domain modules so routing is predictable, handlers stay thin, and business logic remains testable.

## Scope
Applies to all API domains under `src/domains/{domain}/`.

## Core Rules
1. Use router factory functions only: `createXRouter(): Router`.
2. Routers are thin: route wiring only (no business logic, no try/catch, no DB calls).
3. Put handlers in `src/domains/{domain}/routes/` with one handler per file.
4. Handler flow is fixed:
   1) get managed client  
   2) validate request  
   3) call business logic (`processX`)  
   4) catch/log errors  
   5) return response
5. Use managed clients only (`getManagedSupabaseClient()`, `getManagedAnthropicClient()`).
6. Always null-check managed clients before use and return `500` when unavailable.
7. Database CRUD lives in `src/data/{entity}/`; never inline queries in handlers or domain process functions.
8. Use `type` (not `interface`) for shared types.
9. Add JSDoc on router factory, handlers, and business logic functions.
10. Use standard emoji log prefixes:  
   `🚀` start, `✅` success, `❌` error, `📥` request, `📤` response, `🤖` AI, `💾` DB.

---

## Required Domain Layout

```text
src/
  domains/
    orders/
      router.ts
      config.ts
      types.ts
      routes/
        postCreateOrderHandler.ts
        getOrderByIdHandler.ts
      process/
        processCreateOrder.ts
        processGetOrderById.ts
  data/
    orders/
      insertOrder.ts
      selectOrderById.ts
  utils/
    orders/
      normalizeOrderInput.ts
```

- Each domain is self-contained in `src/domains/{domain}/`.
- Handlers are in `routes/` and exported/imported by the router.
- CRUD is isolated in `src/data/{entity}/`, one function per file.
- Utilities used 2+ times move to `src/utils/{domain}/` as pure functions.

---

## ✅ Router Factory Example (Thin Router)

```ts
import { Router } from 'express';
import { postCreateOrderHandler } from './routes/postCreateOrderHandler';
import { getOrderByIdHandler } from './routes/getOrderByIdHandler';

/**
 * Creates the orders router.
 */
export const createOrdersRouter = (): Router => {
  const router = Router();

  router.post('/', postCreateOrderHandler);
  router.get('/:orderId', getOrderByIdHandler);

  return router;
};
```

### ❌ Anti-Pattern Router (Do Not Do This)

```ts
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

export const router = Router();

router.post('/', async (req, res) => {
  // Business logic in router (bad)
  const client = createClient(process.env.URL!, process.env.KEY!); // Per-request client creation (bad)
  const { data, error } = await client.from('orders').insert(req.body); // Inline CRUD (bad)

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(200).json({ success: true, data });
});
```

---

## ✅ Handler Example (Correct Structure)

```ts
import { Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../../services/clients';
import { processCreateOrder } from '../process/processCreateOrder';
import { type CreateOrderRequest } from '../types';

/**
 * Handles POST /orders.
 */
export const postCreateOrderHandler = async (
  req: Request,
  res: Response
): Promise<Response> => {
  console.log('📥 POST /orders request received');

  // 1) Get managed client
  const supabase = getManagedSupabaseClient();
  if (!supabase) {
    console.error('❌ Supabase client is not initialized');
    return res.status(500).json({ success: false, error: 'Service unavailable' });
  }

  // 2) Validate request
  const body = req.body as Partial<CreateOrderRequest>;
  if (!body.customerId || !Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ success: false, error: 'Invalid request body' });
  }

  try {
    // 3) Call business logic
    console.log('🚀 Creating order');
    const result = await processCreateOrder({
      supabase,
      customerId: body.customerId,
      items: body.items,
    });

    // 5) Return response
    console.log('✅ Order created successfully');
    console.log('📤 POST /orders response sent');
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    // 4) Error handling in handler
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to create order:', message);
    return res.status(500).json({ success: false, error: message });
  }
};
```

### ❌ Anti-Pattern Handler (Do Not Do This)

```ts
import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const postCreateOrderHandler = async (req: Request, res: Response) => {
  const client = createClient(process.env.URL!, process.env.KEY!); // Not managed
  // No validation
  // No processX delegation
  // Inline DB query in handler
  const { data, error } = await client.from('orders').insert(req.body);

  if (error) {
    throw error; // Uncaught handler errors
  }

  return res.json(data); // Inconsistent response shape/status
};
```

---

## Business Logic and Data Layer Contract

### `processX` functions
- Handlers delegate domain behavior to `processX` functions.
- `processX` may coordinate data functions and utilities.
- `processX` must not contain raw SQL/query literals inline.

```ts
import { insertOrder } from '../../../data/orders/insertOrder';
import { type ManagedSupabaseClient } from '../../../services/clients/types';
import { type OrderItem } from '../types';

type ProcessCreateOrderInput = {
  supabase: ManagedSupabaseClient;
  customerId: string;
  items: OrderItem[];
};

/**
 * Creates an order and returns created record metadata.
 */
export const processCreateOrder = async ({
  supabase,
  customerId,
  items,
}: ProcessCreateOrderInput) => {
  return insertOrder({ supabase, customerId, items });
};
```

### Data functions (`src/data/{entity}/`)
- One CRUD function per file.
- JSDoc required.
- Use `💾` log prefix for DB operations.

```ts
import { type ManagedSupabaseClient } from '../../services/clients/types';
import { type OrderItem } from '../../domains/orders/types';

type InsertOrderInput = {
  supabase: ManagedSupabaseClient;
  customerId: string;
  items: OrderItem[];
};

/**
 * Inserts an order row and returns the inserted record.
 */
export const insertOrder = async ({
  supabase,
  customerId,
  items,
}: InsertOrderInput) => {
  console.log('💾 Inserting order');

  const { data, error } = await supabase
    .from('orders')
    .insert({ customer_id: customerId, items })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
```

---

## Client Lifecycle
- Initialize managed service clients once at server startup.
- Never create clients per request.
- Domain code only reads managed clients from accessors.

---

## Edge Function Boundary
- Supabase Edge Functions only call Railway endpoints.
- No CRUD and no business logic inside edge functions.

---

## HTTP and Response Standards
- `200` for success.
- `400` for client/request validation errors.
- `500` for server/internal errors.
- Error responses use:

```json
{ "success": false, "error": "message" }
```

---

## Definition of Done
- [ ] Router exports `createXRouter(): Router`.
- [ ] Router file only wires routes.
- [ ] Each handler is in `routes/` and one handler per file.
- [ ] Handler follows 5-step structure.
- [ ] Managed clients are null-checked.
- [ ] Business logic is delegated to `processX`.
- [ ] CRUD lives in `src/data/{entity}/` with one function per file.
- [ ] JSDoc exists on router factory, handlers, and process/data functions.
- [ ] Logging uses approved emoji prefixes.
- [ ] Shared helper used 2+ times extracted to `src/utils/{domain}/`.
