# Edge Functions & Railway Boundaries

## Edge Functions Call Railway Only

Supabase Edge Functions must be thin proxies. They are allowed to:

- accept and minimally validate incoming requests
- forward requests to Railway endpoints
- return Railway responses to callers
- log request/response/error events

Supabase Edge Functions must **not**:

- run SQL or Supabase CRUD directly
- implement business logic
- create managed service clients for app logic

✅ Correct:
```typescript
// supabase/functions/process-request/index.ts
Deno.serve(async (req: Request) => {
  console.log("📥 [edge] process-request");

  const railwayBaseUrl = Deno.env.get("RAILWAY_API_URL");
  const endpoint = `${railwayBaseUrl}/api/ai/process-request`;

  const response = await fetch(endpoint, {
    method: req.method,
    headers: { "Content-Type": "application/json" },
    body: req.method === "GET" ? undefined : await req.text(),
  });

  console.log("📤 [edge] process-request", response.status);
  return new Response(await response.text(), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
});
```

❌ Incorrect:
```typescript
// supabase/functions/process-request/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js";

Deno.serve(async (_req: Request) => {
  // ❌ CRUD in edge function
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data } = await supabase.from("orders").select("*");

  // ❌ Business logic in edge function
  const highValueOrders = data?.filter((order) => order.total > 1000) ?? [];
  return Response.json({ highValueOrders });
});
```

**Reasoning:** Edge functions should stay transport-only. Railway owns business logic, validation, orchestration, AI calls, and data access via `src/services/` and `src/data/`.

## All Business Logic Lives in Railway (Express)

Railway Express server is the execution boundary for application logic:

- handlers follow the standard structure
- handlers call `processX()` business functions
- business functions call data-layer CRUD functions
- routers only wire routes to handlers

✅ Correct:
```typescript
// src/services/orders/routes/create-order-handler.ts
import type { Request, Response } from "express";
import { getManagedSupabaseClient } from "../../../services/supabase";
import { processCreateOrder } from "../process-create-order";

/**
 * Create order handler.
 */
export async function createOrderHandler(req: Request, res: Response) {
  console.log("📥 [orders] createOrder");
  try {
    const supabase = getManagedSupabaseClient();
    if (!supabase) {
      console.error("❌ [orders] managed supabase client unavailable");
      return res.status(500).json({ success: false, error: "Supabase client unavailable" });
    }

    if (!req.body?.customerId) {
      return res.status(400).json({ success: false, error: "customerId is required" });
    }

    const result = await processCreateOrder({ supabase, payload: req.body });
    console.log("✅ [orders] createOrder");
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("❌ [orders] createOrder", error);
    return res.status(500).json({ success: false, error: "Failed to create order" });
  }
}
```

```typescript
// src/data/orders/insertOrder.ts
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Insert a single order record.
 */
export async function insertOrder(supabase: SupabaseClient, payload: { customerId: string; total: number }) {
  const { data, error } = await supabase
    .from("orders")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
```

❌ Incorrect:
```typescript
// src/services/orders/router.ts
router.post("/orders", async (req, res) => {
  // ❌ Router contains business logic
  const discountedTotal = req.body.total * 0.85;

  // ❌ Inline CRUD in service router
  const { data, error } = await req.supabase
    .from("orders")
    .insert({ ...req.body, total: discountedTotal });

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.status(200).json({ success: true, data });
});
```

## Boundary Checklist

- Edge function only forwards to Railway endpoint
- No CRUD in edge functions
- No business logic in edge functions
- Business logic in Railway `processX()` under `src/services/{feature}/`
- CRUD isolated under `src/data/{table}/` (one folder per table, one function per file)
- Handlers in `src/services/{feature}/routes/` with try/catch
- No `src/domains/` folder
- Managed clients fetched once at startup and null-checked before use
- Routers are thin and exported as `createXRouter(): Router`
- Status code contract: `200` success, `400` client error, `500` server error

## Logging Prefixes

- 🚀 start
- ✅ success
- ❌ error
- 📥 request
- 📤 response
- 🤖 AI
- 💾 DB
