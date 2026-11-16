# express-server-template

Express 5 + TypeScript API starter. Apps created from this template inherit these rules.

- Dev: `npm run dev` (nodemon + ts-node, port from `PORT`, default 3000) · Typecheck/build: `npm run build`
- Before any feature, read `.cursor/architecture/README.md` and the ADRs it points to. Path-scoped reminders load from `.claude/rules/` when you touch `src/data`, `src/services`, `src/model`, or SQL.
- If no ADR covers a decision, propose a new ADR before writing code.
- `/adr-audit` checks the repo against its ADRs (read-only report).

## Agent rules (single source of truth, shared with Cursor)

@.cursor/rules/AGENTS.md
