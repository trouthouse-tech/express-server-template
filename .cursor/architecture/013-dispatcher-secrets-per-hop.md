# 013 - Dispatcher secrets per hop

## Status

Accepted

## Context

A request from another device crosses up to three hops, and each hop has its own credential. Mixing them up is the most common setup failure (for example the API sending the gate secret to storage and getting 401).

## Decision

| Hop | Header | Value |
|-----|--------|-------|
| Gate client -> main gateway `:3010` | `x-dispatcher-gate-secret` | Main gateway `DISPATCHER_GATE_SECRET` |
| Main gateway -> this dispatcher | `x-dispatcher-gate-secret` | Main `{PREFIX}_DISPATCHER_GATE_SECRET` = this repo's `DISPATCHER_GATE_SECRET` |
| Main gateway / dispatcher web -> this dispatcher's `/api/dispatcher/*` | `x-dispatcher-admin-secret` | Main `{PREFIX}_DISPATCHER_ADMIN_SECRET` = this repo's `DISPATCHER_INFRA_ADMIN_SECRET` |
| This dispatcher -> storage | `x-storage-secret` | This repo's `{PREFIX}_STORAGE_DISPATCHER_SECRET` = storage's `STORAGE_DISPATCHER_SECRET` |
| Spawned API -> storage | `x-storage-secret` | `STORAGE_SECRET`, injected at spawn (ADR 011) |

- `{PREFIX}` is the project id in upper snake case (`my-project` -> `MY_PROJECT`).
- Repos and migrations hold env var **names** only. Values are **runtime credentials** (main gateway ADR 015): each parent generates them in memory and injects them at spawn, declared with `spawn.credentials` (`{ name, childEnv }`):
  - main gateway registry row → this dispatcher: gate + admin names → `DISPATCHER_GATE_SECRET`, `DISPATCHER_INFRA_ADMIN_SECRET`
  - main gateway `dispatcher_web_spawn` → dispatcher web: admin name → `DISPATCHER_INFRA_ADMIN_SECRET`
  - this repo's `dispatcher.services.json`: storage name → storage `STORAGE_DISPATCHER_SECRET` and API `STORAGE_SECRET`
- `.env.example` lists none of these (comments only). Set them by hand only when running a process outside its parent.
- When this dispatcher restarts, storage/API workers still holding old values are stopped and respawn with new ones.
- The main gateway's own `DISPATCHER_GATE_SECRET` is unrelated to the child pair; external clients only ever know the main one.

## Related

- [011 - Project dispatcher role](./011-project-dispatcher-role.md)
- Main gateway ADR 002 (gateway security and callers)
