# 011 - Project dispatcher role

## Status

Accepted

## Context

Each project that runs on the studio sits behind the main on-device gateway (`on-device-dispatcher-express-server`, `:3010`). The main gateway does not spawn storage or the API itself: it spawns one **project dispatcher** per project, and that dispatcher spawns and proxies the project's storage and API. Repos with the `dispatcher` role start from this template, and Code Control's **Dispatcher** tab (`dispatcher` codegen kind) turns them into a project dispatcher.

## Decision

### 1) Topology

```text
gate client -> main gateway :3010 -> project dispatcher :{dispatcher port} -> storage :{storage port}
                                                                      \-> API     :{api port}
```

- The dispatcher, storage and API all bind `127.0.0.1`. Only the main gateway listens on the LAN.
- One project per dispatcher (`dispatcher.projects.json` has one entry).
- Exactly two upstream services: storage (`{project}-storage`) and the API (`{project}-api`). The API declares `dependsOn: ["{project}-storage"]`; `ensureServiceReady` starts dependencies first, and stopping storage stops the API first.

### 2) Lazy workers

- Services start on the first request that needs them and stop after proxying when `DISPATCHER_STOP_WORKERS_AFTER_PROXY=true`.
- Catalog reads start storage briefly (`withEphemeralStorageForCatalog`) and stop it after when `DISPATCHER_STOP_STORAGE_AFTER_CATALOG=true`.
- Spawned storage and API lifetimes are reported to the main gateway (`MAIN_GATEWAY_URL`, `MAIN_GATEWAY_PROJECT_ID`), which owns the session tables (gateway ADR 012).

### 3) Files

| File | Owner |
|------|-------|
| `src/config/project.ts` | Generated: project id, name, service ids, storage secret env name, ports |
| `dispatcher.services.json`, `dispatcher.projects.json`, `dispatcher.catalog.json` | Generated from the dispatcher plan (ADR 012) |
| Everything else under `src/` | Generic dispatcher code, the same in every project. Fix bugs here in the template, not per project. |

- Generic code never names a project, repo or port; it reads `src/config/project.ts`.

### 4) Calls through the dispatcher

- The API is spawned with `CANONICAL_DATA_ACCESS_MODE=direct`, `STORAGE_URL` (the storage service's loopback URL) and `STORAGE_SECRET`. `DISPATCHER_GATE_SECRET`, `MAIN_GATEWAY_URL` and `MAIN_GATEWAY_PROJECT_ID` are unset for it, so it never sends the gate secret to storage.
- Storage is spawned with `DATABASE_URL` unset; it reads its own `.env`.

## Related

- [012 - Registry and catalog](./012-dispatcher-registry-and-catalog.md)
- [013 - Secrets per hop](./013-dispatcher-secrets-per-hop.md)
- [014 - Naming and ports](./014-dispatcher-naming-and-ports.md)
- Main gateway ADRs 005 (project dispatchers), 011 (gateway infra Postgres), 012 (worker session tables)
