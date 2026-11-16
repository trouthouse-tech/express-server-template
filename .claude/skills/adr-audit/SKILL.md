---
name: adr-audit
description: Audit this express-server-template-based repo for compliance with its .cursor/architecture ADRs and AGENTS.md rules. Read-only; produces a findings report with file:line citations. Use when asked to audit, check conventions, or verify ADR compliance.
---

# ADR audit — express-server-template-based

Read-only. Never edit code or ADRs while auditing; the working tree (including uncommitted changes) is in scope.

## Steps

1. Read `.cursor/architecture/README.md` and `.cursor/rules/AGENTS.md`. Note which ADRs are product-specific.
2. Baseline: `git status --porcelain | wc -l` (if git), then `npm run build`. Record failures as `build` findings.
3. For every ADR, run its probes (grep/find/ls), then **open every hit** to confirm it before reporting.
4. Check the README and `.env.example` against the code (env vars actually read, ports, routes).
5. Write the report to chat (do not add files to the repo unless asked).

## Core checks (template ADRs)

- **001/011** no `src/domains/`; handlers only in `routes/` folders.
- **002** routers export `create*Router(): Router`; one handler per file; handler order client → validate → `processX()` → try/catch → respond; no inline queries.
- **003** one exported CRUD function per `src/data/**` file; no `types.ts` in data; no `req`/`res` in CRUD.
- **004** no client construction (`createClient(`, `new Pool(`, `new Anthropic(`, `new Stripe(`) outside startup init; null client → 500.
- **006** `{ success, data }` / `{ success: false, error }`; emoji log prefixes.
- **008** every table has `src/model/{entity}/index.ts`, re-exported from `src/model/index.ts`.
- **010** no `CREATE FUNCTION/TRIGGER/PROCEDURE` in any `.sql`; `updated_at` set in CRUD.
- `type` not `interface`; JSDoc on factories, handlers, `processX()`, CRUD.

## Report format

```markdown
# ADR audit — <repo> — YYYY-MM-DD
## Summary (counts by severity, build/lint status)
| ADR | file:line | severity | finding | suggested fix |
## ADR is wrong, not the code (proposed amendments)
## Fix plan (PR-sized batches: build → violations → drift → docs)
```

Severity: **violation** (breaks MUST/NEVER) · **drift** (legacy allowed to migrate incrementally) · **doc-only** · **build**.
