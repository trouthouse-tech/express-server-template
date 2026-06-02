# File & Domain Organization

This document defines how to organize files in the Express server so each domain is isolated, handlers stay thin, and data access remains in `src/data/`.

## Canonical Folder Structure

✅ Correct:
```text
src/
  domains/
    business-coach/
      router.ts
      routes/
        chat-handler.ts
        get-session-handler.ts
      process-chat-request.ts
      config.ts
      types.ts
      index.ts
  data/
    sessions/
      create-session.ts
      get-session-by-id.ts
      update-session.ts
      delete-session.ts
      index.ts
  services/
    managed/
      clients.ts
      init-managed-clients.ts
  utils/
    business-coach/
      build-system-prompt.ts
      normalize-message.ts
      index.ts
  server.ts
supabase/
  functions/
    business-coach-proxy/
      index.ts
```

❌ Incorrect:
```text
src/
  routes/
    business-coach.ts            # domain router in global routes folder
  business-coach.ts              # mixed router + handler + business logic
  db.ts                           # ad-hoc queries from everywhere
  helpers.ts                      # large shared file with unrelated utilities
supabase/
  functions/
    business-coach/
      index.ts                    # direct DB CRUD + business logic in edge
```

**Reasoning:** Keep domains self-contained, CRUD in `src/data/{entity}/`, managed clients centralized, and edge functions as Railway proxies only.

## Domain-Based Architecture (`src/domains/{domain}/`)

✅ Correct:
```typescript
// src/domains/business-coach/router.ts
import { Router, type Router as ExpressRouter } from 'express';
import { chatHandler } from './routes/chat-handler';
import { getSessionHandler } from './routes/get-session-handler';

/**
 * Factory for business coach router.
 */
export const createBusinessCoachRouter = (): ExpressRouter => {
  const router = Router();
  router.post('/chat', chatHandler);
  router.get('/sessions/:id', getSessionHandler);
  return router;
};
```

❌ Incorrect:
```typescript
// src/routes/business-coach.ts
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

export const router = Router(); // not a factory

router.post('/chat', async (req, res) => {
  // business logic inline in router
  const supabase = createClient(process.env.URL!, process.env.KEY!); // unmanaged client
  const result = await supabase.from('sessions').select('*');
  res.json(result);
});
```

**Reasoning:** Routers are thin route maps only. Use `createXRouter(): Router` factory and delegate execution to handlers.

## Handlers in `routes/` + Handler Structure

✅ Correct:
```typescript
// src/domains/business-coach/routes/chat-handler.ts
import type { Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../../services/managed/clients';
import { processChatRequest } from '../process-chat-request';

/**
 * Handle POST /chat requests for business coach.
 */
export const chatHandler = async (req: Request, res: Response): Promise<void> => {
  console.log('📥 POST /business-coach/chat');

  const supabase = getManagedSupabaseClient();
  if (!supabase) {
    console.error('❌ Managed Supabase client is null');
    res.status(500).json({ success: false, error: 'Service unavailable' });
    return;
  }

  const { message } = req.body as { message?: string };
  if (!message) {
    res.status(400).json({ success: false, error: 'message is required' });
    return;
  }

  try {
    const data = await processChatRequest({ supabase, message });
    console.log('📤 200 /business-coach/chat');
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('❌ chatHandler failed', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
```

❌ Incorrect:
```typescript
// src/domains/business-coach/router.ts
router.post('/chat', async (req, res) => {
  // no null check, no validation, no processX function, no try/catch
  const reply = await anthropic.messages.create({ model: 'claude-3-5-sonnet' });
  await supabase.from('sessions').insert({ message: req.body.message });
  res.json(reply);
});
```

**Reasoning:** Handler flow must be: (1) get managed client, (2) validate request, (3) call business logic function, (4) try/catch, (5) return response with standard status codes.

## Business Logic in `processX()` Functions

✅ Correct:
```typescript
// src/domains/business-coach/process-chat-request.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { saveSessionMessage } from '../../data/sessions/create-session';

type ProcessChatRequestInput = {
  supabase: SupabaseClient;
  message: string;
};

/**
 * Execute business rules for coach chat flow.
 */
export const processChatRequest = async ({
  supabase,
  message,
}: ProcessChatRequestInput): Promise<{ reply: string }> => {
  console.log('🤖 Generating coach reply');
  const reply = `Echo: ${message}`;
  await saveSessionMessage(supabase, { message, reply });
  console.log('✅ Chat request processed');
  return { reply };
};
```

❌ Incorrect:
```typescript
// src/domains/business-coach/routes/chat-handler.ts
export const chatHandler = async (req, res) => {
  // business rules implemented directly in handler
  if (req.body.message.includes('refund')) {
    // ...
  }
  // DB writes inline instead of using src/data/
};
```

**Reasoning:** Keep handlers transport-focused and move domain rules into dedicated `processX` functions with JSDoc.

## One Function Per File in `src/data/{entity}/`

✅ Correct:
```typescript
// src/data/sessions/get-session-by-id.ts
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fetch one session by id.
 */
export const getSessionById = async (supabase: SupabaseClient, id: string) => {
  const { data, error } = await supabase.from('sessions').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
};
```

```typescript
// src/data/sessions/create-session.ts
import type { SupabaseClient } from '@supabase/supabase-js';

type CreateSessionInput = {
  message: string;
  reply: string;
};

/**
 * Insert one session message row.
 */
export const saveSessionMessage = async (
  supabase: SupabaseClient,
  input: CreateSessionInput,
) => {
  const { error } = await supabase.from('sessions').insert(input);
  if (error) throw error;
};
```

❌ Incorrect:
```typescript
// src/data/sessions.ts
export const getSessionById = async () => { /* ... */ };
export const saveSessionMessage = async () => { /* ... */ };
export const deleteSession = async () => { /* ... */ };
// multiple CRUD functions in one file
```

**Reasoning:** One file per CRUD function keeps ownership clear, supports granular tests, and avoids monolithic data modules.

## `index.ts` Barrel Export Patterns

✅ Correct:
```typescript
// src/domains/business-coach/index.ts
export { createBusinessCoachRouter } from './router';
export type { BusinessCoachConfig, CoachChatRequest } from './types';
```

```typescript
// src/domains/business-coach/routes/index.ts
export { chatHandler } from './chat-handler';
export { getSessionHandler } from './get-session-handler';
```

```typescript
// src/data/sessions/index.ts
export { getSessionById } from './get-session-by-id';
export { saveSessionMessage } from './create-session';
export { updateSession } from './update-session';
export { deleteSession } from './delete-session';
```

❌ Incorrect:
```typescript
// src/index.ts
export * from './domains';
export * from './data';
export * from './services';
// broad wildcard barrels leak internals and create circular import risk
```

**Reasoning:** Keep barrels close to a domain/entity boundary and export only intentional public API.

## Managed Service Clients + Startup Initialization

✅ Correct:
```typescript
// src/server.ts
import { initializeManagedClients } from './services/managed/init-managed-clients';

const startServer = async (): Promise<void> => {
  console.log('🚀 Initializing managed clients');
  await initializeManagedClients();
  console.log('✅ Managed clients ready');
  app.listen(PORT);
};
```

```typescript
// src/domains/business-coach/routes/get-session-handler.ts
const supabase = getManagedSupabaseClient();
if (!supabase) {
  console.error('❌ Managed Supabase client is null');
  res.status(500).json({ success: false, error: 'Service unavailable' });
  return;
}
```

❌ Incorrect:
```typescript
// src/domains/business-coach/routes/get-session-handler.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key); // per-request client creation
```

**Reasoning:** Initialize clients once at startup and always null-check managed clients before use.

## Utilities Used 2+ Times

✅ Correct:
```typescript
// src/utils/business-coach/normalize-message.ts
/**
 * Normalize user message input for repeated reuse.
 */
export const normalizeMessage = (value: string): string => value.trim().replace(/\s+/g, ' ');
```

```typescript
// src/domains/business-coach/process-chat-request.ts
import { normalizeMessage } from '../../utils/business-coach/normalize-message';
```

❌ Incorrect:
```typescript
// repeated in multiple handlers
const normalized = req.body.message.trim().replace(/\s+/g, ' ');
```

**Reasoning:** Extract pure utility functions when reused 2+ times; keep domain logic focused and testable.

## Supabase Edge Function Boundary

✅ Correct:
```typescript
// supabase/functions/business-coach-proxy/index.ts
import { serve } from 'https://deno.land/std/http/server.ts';

serve(async (req) => {
  const response = await fetch(`${Deno.env.get('RAILWAY_API_URL')}/business-coach/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: await req.text(),
  });
  return new Response(await response.text(), { status: response.status });
});
```

❌ Incorrect:
```typescript
// supabase/functions/business-coach/index.ts
// direct SQL / business logic in edge function
const { data } = await supabase.from('sessions').insert(payload);
```

**Reasoning:** Edge functions are transport proxies only; Railway Express owns CRUD and domain business logic.

## Logging Prefixes

✅ Correct:
```typescript
console.log('🚀 Server starting');
console.log('📥 POST /business-coach/chat');
console.log('🤖 Generating response');
console.log('💾 Saving session');
console.log('✅ Session saved');
console.error('❌ Failed to save session', error);
console.log('📤 200 /business-coach/chat');
```

❌ Incorrect:
```typescript
console.log('starting...');
console.log('done');
console.error('something broke');
```

**Reasoning:** Standard emoji prefixes make logs scannable across startup, request flow, AI calls, DB operations, and errors.

## Related

- See [Router Factory and Handler Pattern](./002-router-factory-and-handler-pattern.md)
- See [Data Layer CRUD Boundaries](./003-data-layer-crud-boundaries.md)
