# 010 – No SQL functions

## Status

Accepted

## Context

Postgres `CREATE FUNCTION`, triggers, and stored procedures hide writes (for example `set_updated_at`) outside `src/data/`. Agents then fail when a later migration assumes a function that was never applied.

## Decision

1. SQL migrations are tables, indexes, grants, RLS, and `CHECK` constraints only.
2. Never `CREATE FUNCTION`, `CREATE OR REPLACE FUNCTION`, `CREATE TRIGGER`, `CREATE PROCEDURE`, or `CREATE LANGUAGE`.
3. Never `EXECUTE FUNCTION` / `EXECUTE PROCEDURE` on a trigger.
4. Timestamps such as `updated_at` are written in data-layer CRUD (`new Date().toISOString()`), not by the database.
5. Default column values (`default now()`, `default gen_random_uuid()`) are allowed. Those are not functions you define.

## Related

- [003 – Data layer CRUD boundaries](./003-data-layer-crud-boundaries.md)
