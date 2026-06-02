# Managed Clients & Startup Init

## Goal

Initialize managed service clients once at server startup, then reuse them in domain handlers through `getManagedSupabaseClient()` and `getManagedAnthropicClient()`.

## Managed Service Clients

Use managed client accessors in domain code:

- `getManagedSupabaseClient()`
- `getManagedAnthropicClient()`

Do not call `createClient()` inside handlers, routers, domain services, or data-layer functions.

✅ Correct:
```typescript
import { Request, Response } from 'express';
import { getManagedSupabaseClient } from '../../services/clients';
import { processCreateProject } from '../services/process-create-project';

/**
 * POST /projects
 * Handler: create project
 */
export const createProjectHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log('📥 [createProjectHandler] Request received');

    const supabase = getManagedSupabaseClient();
    if (!supabase) {
      console.error('❌ [createProjectHandler] Supabase client unavailable');
      return res.status(500).json({ success: false, error: 'Service unavailable' });
    }

    const result = await processCreateProject({ supabase, payload: req.body });

    console.log('✅ [createProjectHandler] Project created');
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('❌ [createProjectHandler] Failed to create project', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
```

❌ Incorrect:
```typescript
import { createClient } from '@supabase/supabase-js';

export const createProjectHandler = async (req, res) => {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!); // ❌ per-request client creation
  // business logic...
};
```

**Reasoning:** Managed clients are long-lived dependencies initialized once for performance, reliability, and consistent configuration.

## Service Initialization at Startup

Initialize managed clients before `app.listen(...)`.

✅ Correct:
```typescript
import express from 'express';
import { initializeSupabaseClient, initializeAnthropicClient } from './services/clients';
import { setupRoutes } from './services/routes';

const bootstrap = async (): Promise<void> => {
  const app = express();

  console.log('🚀 Starting server bootstrap');

  await initializeSupabaseClient();
  console.log('✅ Supabase client initialized');

  await initializeAnthropicClient();
  console.log('✅ Anthropic client initialized');

  setupRoutes(app);

  app.listen(process.env.PORT || 3000, () => {
    console.log('🚀 Server listening');
  });
};

bootstrap().catch((error) => {
  console.error('❌ Failed during startup init', error);
  process.exit(1);
});
```

❌ Incorrect:
```typescript
router.post('/generate', async (req, res) => {
  const anthropic = createClient(process.env.ANTHROPIC_API_KEY!); // ❌ created inside request path
  // ...
});
```

## Handler Structure (Required)

Every handler should follow this order:

1. Get managed client(s)
2. Validate request input
3. Call `processX()` business logic
4. Handle errors with `try/catch`
5. Return JSON response with proper status code

✅ Correct:
```typescript
import { Request, Response } from 'express';
import { getManagedAnthropicClient } from '../../../services/clients';
import { processGenerateSummary } from '../services/process-generate-summary';
import { validateGenerateSummaryRequest } from '../utils/validate-generate-summary-request';

/**
 * POST /ai/summaries
 * Generate summary from input text
 */
export const generateSummaryHandler = async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log('📥 [generateSummaryHandler] Request received');

    const anthropic = getManagedAnthropicClient();
    if (!anthropic) {
      console.error('❌ [generateSummaryHandler] Anthropic client unavailable');
      return res.status(500).json({ success: false, error: 'Service unavailable' });
    }

    const validation = validateGenerateSummaryRequest(req.body);
    if (!validation.success) {
      console.error('❌ [generateSummaryHandler] Validation failed');
      return res.status(400).json({ success: false, error: validation.error });
    }

    const data = await processGenerateSummary({
      anthropic,
      input: validation.data,
    });

    console.log('📤 [generateSummaryHandler] Response sent');
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('❌ [generateSummaryHandler] Unexpected error', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
```

## Domain and Data-Layer Boundaries

- Routers are thin and only wire routes.
- Handlers live in `src/domains/{domain}/routes/` (one handler per file).
- Business logic lives in `processX()` functions (with JSDoc).
- CRUD functions live in `src/data/{entity}/` (one function per file with JSDoc).
- Never inline SQL/queries in handlers or domain business logic.

✅ Correct:
```typescript
// src/domains/projects/router.ts
import { Router } from 'express';
import { createProjectHandler } from './routes/create-project-handler';

/**
 * Factory for projects router
 */
export const createProjectsRouter = (): Router => {
  const router = Router();
  router.post('/', createProjectHandler);
  return router;
};
```

❌ Incorrect:
```typescript
// src/domains/projects/router.ts
router.post('/', async (req, res) => {
  const supabase = createClient(url, key); // ❌ unmanaged client
  const { data, error } = await supabase.from('projects').insert(req.body); // ❌ inline CRUD
  // ❌ inline business logic
});
```

## Emoji Logging Standard

Use consistent log prefixes:

- `🚀` startup
- `✅` success
- `❌` error
- `📥` request
- `📤` response
- `🤖` AI
- `💾` DB

✅ Example:
```typescript
console.log('📥 [createProjectHandler] Request received');
console.log('🤖 [processGenerateSummary] Calling Anthropic');
console.log('💾 [createProject] Inserting project');
console.log('✅ [createProjectHandler] Success');
```

❌ Example:
```typescript
console.log('doing stuff'); // ❌ inconsistent and unclear
```

## Status Code Rules

- `200`: successful request
- `400`: client/request validation error
- `500`: server/service error (including null managed client)

✅ Example:
```typescript
if (!supabase) {
  return res.status(500).json({ success: false, error: 'Service unavailable' });
}

if (!validation.success) {
  return res.status(400).json({ success: false, error: validation.error });
}

return res.status(200).json({ success: true, data });
```

## Edge Function Rule

Supabase edge functions should call Railway HTTP endpoints only. Do not include CRUD or business logic in edge functions.

✅ Correct:
```typescript
// edge function
const response = await fetch('https://railway-service.example.com/api/ai/summaries', {
  method: 'POST',
  body: JSON.stringify(payload),
});
```

❌ Incorrect:
```typescript
// edge function
const supabase = createClient(url, key); // ❌ no direct CRUD/business logic in edge
```

## Related

- See [Router Factory & Handler Pattern](./002-router-factory-and-handler-pattern.md)
- See [Domain-Based Architecture](./003-domain-based-architecture.md)
