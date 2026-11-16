---
paths:
  - "migrations/**"
  - "**/*.sql"
---

# SQL migrations

Read: [010 – No SQL functions](../../.cursor/architecture/010-no-sql-functions.md).

- Tables, indexes, grants, RLS, `CHECK` only. **Never** `CREATE FUNCTION`, `CREATE TRIGGER`, `CREATE PROCEDURE`, `EXECUTE FUNCTION`.
- `default now()` / `gen_random_uuid()` are fine; `updated_at` is set by CRUD code.
- New file = next number (`0NN_name.sql`); never edit an applied migration.
