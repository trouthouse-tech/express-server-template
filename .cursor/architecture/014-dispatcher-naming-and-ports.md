# 014 - Dispatcher naming and ports

## Status

Accepted

## Decision

### 1) Ids

| Thing | Value |
|-------|-------|
| Gateway catalog project id | `{project}` (kebab case, the software system's slug) |
| Storage registry id (this repo) | `{project}-storage` |
| API registry id (this repo) | `{project}-api` |
| Main gateway registry id | `{project}-dispatcher` |
| Main gateway path prefix | `/api/{project}` |
| Main gateway session tables | `{project_snake}_dispatcher_sessions`, `_storage_sessions`, `_api_sessions` |

### 2) Ports

- Each project gets four loopback ports: dispatcher, storage, API and dispatcher web. Code Control assigns them from 3200 up in blocks of four, skipping ports any other project already uses on the main gateway or in Code Control, and keeps them on the software system.
- The ports appear in `src/config/project.ts`, `dispatcher.services.json`, `.env.example` and the main gateway registration. Change them in Code Control and deliver again rather than by hand.

### 3) Spawn folders

- Spawn `cwd` values are `{STUDIO_REPOS_ROOT}/{project}/{repo name}` on the studio, and `DISPATCHER_SPAWN_ROOTS` is `{STUDIO_REPOS_ROOT}/{project}`.
- Clone the project's repos into that folder on the studio before starting the dispatcher.

## Related

- [011 - Project dispatcher role](./011-project-dispatcher-role.md)
- Main gateway ADR 012 (worker session tables)
