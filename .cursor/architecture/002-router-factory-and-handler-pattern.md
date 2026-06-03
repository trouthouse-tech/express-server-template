# 002 - Router Factory and Handler Pattern

## Status

Accepted

## Goal

Standardize Express feature modules under `src/services/` so routing is predictable, handlers stay thin, and business logic remains testable.

## Scope

Applies to all API features under `src/services/{feature}/`. **Do not use `src/domains/`.**

## Core Rules

1. Use router factory functions only: `createXRouter(): Router`.
2. Routers are thin: route wiring only (no business logic, no try/catch, no DB calls).
3. Put handlers in `src/services/{feature}/routes/` with one handler per file.
4. Put action/business logic in `processX()` files in the same `src/services/{feature}/` folder.
5. Handler flow is fixed:
   1) get managed client  
   2) validate request  
   3) call `processX()`  
   4) catch/log errors  
   5) return response
6. Use managed clients only (`getManagedSupabaseClient()`, `getManagedAnthropicClient()`).
7. Always null-check managed clients before use and return `500` when unavailable.
8. Database CRUD lives in `src/data/{table}/` only; never inline queries in handlers or `processX()`.
9. Use `type` (not `interface`) for shared types.
10. Add JSDoc on router factory, handlers, and `processX()` functions.
11. Use standard emoji log prefixes: `🚀` `✅` `❌` `📥` `📤` `🤖` `💾`.

---

## Required service layout

```text
src/
  services/
    orders/
      router.ts
      types.ts
      routes/
        post-create-order-handler.ts
        get-order-by-id-handler.ts
      process-create-order.ts
      process-get-order-by-id.ts
  data/
    orders/                    # one folder per table
      insert-order.ts
      select-order-by-id.ts
  utils/
    orders/
      normalize-order-input.ts
```

- Each feature is self-contained in `src/services/{feature}/`.
- CRUD is isolated in `src/data/{table}/`, one function per file.
- Utilities used 2+ times → `src/utils/{feature}/` as pure functions.

---

## ✅ Router factory (thin router)

```ts
import { Router } from 'express';
import { postCreateOrderHandler } from './routes/post-create-order-handler';
import { getOrderByIdHandler } from './routes/get-order-by-id-handler';

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

---

## ✅ Handler example

```ts
import { Request, Response } from 'express';
import { getManagedSupabaseClient } from '../managed/clients';
import { processCreateOrder } from '../process-create-order';
import { type CreateOrderRequest } from '../types';

/**
 * Handles POST /orders.
 */
export const postCreateOrderHandler = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  console.log('📥 POST /orders');

  const supabase = getManagedSupabaseClient();
  if (!supabase) {
    console.error('❌ Supabase client is not initialized');
    return res.status(500).json({ success: false, error: 'Service unavailable' });
  }

  const body = req.body as Partial<CreateOrderRequest>;
  if (!body.customerId || !Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ success: false, error: 'Invalid request body' });
  }

  try {
    const result = await processCreateOrder({
      supabase,
      customerId: body.customerId,
      items: body.items,
    });
    console.log('📤 200 POST /orders');
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to create order:', message);
    return res.status(500).json({ success: false, error: message });
  }
};
```

---

## `processX` and data layer

- `processX()` orchestrates rules and calls `src/data/{table}/` functions.
- `processX()` must not contain raw `.from('table')` calls.

```ts
import { insertOrder } from '../../data/orders/insert-order';

/**
 * Creates an order and returns the created record.
 */
export const processCreateOrder = async (input: {
  supabase: SupabaseClient;
  customerId: string;
  items: OrderItem[];
}) => {
  return insertOrder(input.supabase, {
    customer_id: input.customerId,
    items: input.items,
  });
};
```

Data functions accept `SupabaseClient` first, live under `src/data/orders/`, one per file, with `💾` logging.

---

## Definition of done

- [ ] Router exports `createXRouter(): Router` under `src/services/{feature}/`
- [ ] Handlers in `routes/`, one per file, delegate to `processX()`
- [ ] CRUD only in `src/data/{table}/`, one function per file
- [ ] No `src/domains/` paths
- [ ] JSDoc on router, handlers, `processX`, and data functions
- [ ] Approved emoji logging
