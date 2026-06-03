# Express Server Template

A production-ready Express API server template with TypeScript, perfect for quickly spinning up new backend services.

## Features

- ✅ **TypeScript** - Full type safety and modern JS features
- ✅ **Express.js** - Fast, minimalist web framework
- ✅ **CORS** - Configured for cross-origin requests
- ✅ **Hot Reload** - Nodemon for development
- ✅ **Health Checks** - Built-in health endpoints
- ✅ **Error Handling** - Centralized error middleware
- ✅ **Clean Structure** - Organized, scalable file structure

## Quick Start

### 1. Create a New Project from This Template

**Using GitHub CLI:**
```bash
gh repo create my-new-api --template trouthouse-tech/express-server-template --private --clone
cd my-new-api
```

**Using degit:**
```bash
npx degit trouthouse-tech/express-server-template my-new-api
cd my-new-api
git init
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

Server will start on `http://localhost:3000`

### 4. Test It
```bash
curl http://localhost:3000
# {"status":"ok","message":"TroutHouseTech Express Server is running",...}
```

## Available Endpoints

- `GET /` - Health check
- `GET /api/health` - Health check with detailed info

## Project Structure

```
express-server-template/
├── index.ts                 # Main entry point
├── src/
│   └── services/
│       ├── middleware/      # Express middleware
│       │   ├── setup-early-middleware.ts
│       │   ├── setup-error-handling.ts
│       │   └── index.ts
│       ├── health/          # Health check routes
│       │   ├── create-health-router.ts
│       │   └── index.ts
│       └── server/          # Server startup logic
│           ├── start-server.ts
│           └── index.ts
├── package.json
├── tsconfig.json
└── .gitignore
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm run build` - Compile TypeScript to JavaScript
- `npm run build:watch` - Watch mode compilation

## Adding New Routes

Feature routes and business logic live under `src/services/{feature}/`. When you add a database, put CRUD in `src/data/{table}/` (one file per operation) and call those functions from `processX()` in the service folder.

1. Create a new router in `src/services/{feature}/`:

```typescript
// src/services/my-feature/create-my-router.ts
import { Router, Request, Response } from 'express';

export const createMyRouter = (): Router => {
  const router = Router();
  
  router.get('/', (req: Request, res: Response) => {
    res.json({ message: 'My feature works!' });
  });
  
  return router;
};
```

2. Export it in `src/services/my-feature/index.ts`:

```typescript
export { createMyRouter } from './create-my-router';
```

3. Mount it in `index.ts`:

```typescript
import { createMyRouter } from './src/services/my-feature';
app.use('/api/my-feature', createMyRouter());
```

## Deployment

### Build for Production
```bash
npm run build
```

### Run Production Build
```bash
NODE_ENV=production node dist/index.js
```

## Architecture & agent rules

Cursor agents and contributors should follow **`.cursor/rules/AGENTS.md`** and the ADRs in **`.cursor/architecture/`**.

| Layer | Path | Purpose |
|-------|------|---------|
| CRUD | `src/data/{table}/` | One folder per table, one function per file — **no business logic** |
| HTTP + actions | `src/services/{feature}/` | Routers, handlers, `processX()` business logic |
| Cross-cutting | `src/services/middleware`, `health`, `server` | Shipped in starter |

There is **no `src/domains/`** folder in this template.

## Architecture Principles

- **One function per file** — including each CRUD operation in its own file under `src/data/{table}/`
- **Factory pattern** — `createXRouter(): Router` in `src/services/{feature}/`
- **Index exports** — every folder has an `index.ts`
- **CRUD vs services** — database calls only in `src/data/`; orchestration in `src/services/`
- **Type safety** — use `type`, not `interface`

## License

MIT

## Author

TroutHouseTech
