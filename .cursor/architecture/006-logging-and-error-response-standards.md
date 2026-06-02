# Logging & Error Response Standards

This document defines how all Express handlers log activity and return errors.

## Emoji Logging

Use these prefixes consistently:

- 🚀 start
- ✅ success
- ❌ error
- 📥 request
- 📤 response
- 🤖 AI
- 💾 DB

✅ Correct:

```typescript
console.log('📥 [orders.createOrderHandler] Request received', {
  body: req.body,
  params: req.params,
});
console.log('🚀 [orders.processCreateOrder] Starting order creation');
console.log('🤖 [orders.processCreateOrder] Calling AI for summary');
console.log('💾 [orders.processCreateOrder] Inserting order into database');
console.log('✅ [orders.processCreateOrder] Order created successfully', {
  orderId: result.id,
});
console.log('📤 [orders.createOrderHandler] Sending response', {
  statusCode: 200,
});
```

❌ Incorrect:

```typescript
console.log('start');
console.log('worked');
console.log('failed', error);
```

## Status Codes

Only use:

- `200` for success
- `400` for client/request errors
- `500` for server/internal errors

✅ Correct:

```typescript
return res.status(200).json({ success: true, data: result });
return res.status(400).json({ success: false, error: 'Invalid request body' });
return res.status(500).json({ success: false, error: 'Internal server error' });
```

❌ Incorrect:

```typescript
return res.status(201).json({ ok: true, data: result });
return res.status(422).json({ message: 'Invalid input' });
return res.status(503).json({ error: 'Temporary failure' });
```

## Standard Error Response Shape

All handler errors must use this JSON format:

```typescript
type ErrorResponse = {
  success: false;
  error: string;
  details?: unknown;
};
```

Example:

```typescript
return res.status(400).json({
  success: false,
  error: 'Missing required field: name',
});
```

## Handler Error Handling Pattern

Rules:

1. Get managed client and null-check it
2. Validate request
3. Call business logic function (`processX`)
4. Wrap handler in `try/catch`
5. Return standard response shape

✅ Correct:

```typescript
/**
 * Creates an order.
 */
export async function createOrderHandler(req: Request, res: Response): Promise<void> {
  console.log('📥 [orders.createOrderHandler] Request received');

  const supabase = getManagedSupabaseClient();
  if (!supabase) {
    console.error('❌ [orders.createOrderHandler] Supabase client is not initialized');
    res.status(500).json({ success: false, error: 'Internal server error' });
    return;
  }

  if (!req.body?.customerId) {
    console.error('❌ [orders.createOrderHandler] Invalid request: customerId missing');
    res.status(400).json({ success: false, error: 'Invalid request body' });
    return;
  }

  try {
    console.log('🚀 [orders.createOrderHandler] Starting processCreateOrder');
    const result = await processCreateOrder({
      supabase,
      input: req.body,
    });

    console.log('✅ [orders.createOrderHandler] Order created successfully');
    console.log('📤 [orders.createOrderHandler] Sending response');
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('❌ [orders.createOrderHandler] Failed to create order', {
      message: error?.message ?? 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: error?.message ?? 'Internal server error',
    });
  }
}
```

❌ Incorrect:

```typescript
router.post('/orders', async (req, res) => {
  const result = await supabase.from('orders').insert(req.body).select().single();
  res.json(result);
});
```

Why incorrect:

- Business logic and CRUD are inline in the route
- No managed client null check
- No request validation
- No `try/catch`
- No standard `success/error` response shape
- No emoji logging standard

## Router vs Handler Responsibility

- Router files: route wiring only
- Handler files: validation, orchestration, try/catch, response formatting
- Business logic: `processX` functions
- Data access: `src/data/{entity}/` one CRUD function per file

## Related

- See [Router Factory and Handler Pattern](./002-router-factory-and-handler-pattern.md)
