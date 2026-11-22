# 012 - Dispatcher registry and catalog

## Status

Accepted

## Context

A project dispatcher needs two lists: the upstream services it may spawn and proxy (the registry), and the paths the main gateway may forward to it (the exposed-endpoint catalog). Earlier dispatchers kept catalog rows in a JSON file; they now live in the project's storage database (storage template ADR 012).

## Decision

### 1) Registry: `dispatcher.services.json`

| Service | `pathPrefix` | `upstreamAuth` | `proxyPathsAllowlist` | `spawn.startCommand` |
|---------|--------------|----------------|-----------------------|----------------------|
| `{project}-storage` | `/api/storage` | `inject-from-env`, header `x-storage-secret`, env `{PREFIX}_STORAGE_DISPATCHER_SECRET` | `/api/storage/health`, `/api/storage/meta` | `npm run start` |
| `{project}-api` | `/api/data` | `none` | `/api/health` | `npm run start` |

- `upstreamBaseUrl` is always `http://127.0.0.1:{port}` (validated at load).
- `spawn.cwd` is an absolute path under `DISPATCHER_SPAWN_ROOTS` (ADR 014).
- Keep `proxyPathsAllowlist` minimal; gate paths come from the catalog.

### 2) Catalog: rows in storage

- Rows live in the storage repo's `dispatcher_exposed_endpoints` table and are read over loopback HTTP with the storage secret. This dispatcher never connects to Postgres.
- Every row must name a registry `serviceId` and a path under that service's `pathPrefix`; `validateCatalogEndpointsAgainstRegistry` drops rows that do not.
- Every project seeds at least `GET /api/storage/health`, `GET /api/storage/meta` and `POST /api/storage/v1/invoke` on the storage service.
- Never expose `/api/storage/dispatcher-exposed-endpoints` (catalog admin stays loopback + storage secret).
- `dispatcher.catalog.json` holds project metadata only (`endpoints: []`).
- `GET /api/dispatcher/catalog` (admin secret) serves the catalog to the main gateway, which caches it for `DISPATCHER_CHILD_CATALOG_CACHE_MS`. Toggling a row through `PATCH /api/dispatcher/catalog/endpoints/:id` writes storage and takes effect on the main gateway after its cache refresh.

### 3) Adding a gate path

1. Implement the route on storage or the API under its `pathPrefix`.
2. Add a `dispatcher_exposed_endpoints` row (storage migration with `ON CONFLICT DO NOTHING`, or the dispatcher web).
3. Wait for the main gateway's catalog cache (or restart it). No change to this repo or the main gateway's registry.

## Related

- [011 - Project dispatcher role](./011-project-dispatcher-role.md)
- Storage template ADR 012 (dispatcher exposed endpoints)
