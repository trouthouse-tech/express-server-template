# codegen/

Code Control renders the code it delivers to projects (data model and data-access PRs) from the templates in this folder. Code Control itself only builds the data for each template: tables, columns, names and standard operations. **How the generated code looks is decided here**, so a convention change reaches new projects by changing these templates.

The **template agent** in Code Control edits this folder (plus the scaffold and `.cursor/architecture/` ADRs) when conventions change, and opens a PR. One template agent run covers every template repo a change affects, so its PRs in the other template repos are reviewed together. Review and merge them from Code Control → Template agents (not on GitHub), so the conventions ledger stays in sync.

## Layout

- `manifest.json` lists every generated file, per kind (`model`, `crud`, `dispatcher`).
- `model/`, `crud/`, `dispatcher/`: [Eta](https://eta.js.org) templates (`.eta`).
- `crud/support/**.raw`, `dispatcher/support/**.raw`: files copied as-is (no Eta).
- `dispatcher` serves two roles (ADRs 011-014). Role `dispatcher`: turns a repo made from this template into the project dispatcher: the generic dispatcher code (`dispatcher/support/`, `if_missing`, or `write` for the few template files it replaces), plus `src/config/project.ts`, `dispatcher.*.json`, `.env.example`, `package.json` and `scripts/smoke.sh` rendered from the plan. Role `gateway`: the registration and session-table migrations opened on the shared main gateway repo (`dispatcher/gateway/`).

## Manifest entries

| field | meaning |
|---|---|
| `id` | stable id (findings, mapping output paths back to templates) |
| `path` | output path, an Eta string (`src/data/<%= it.names.folder %>/<%= it.op.file %>.ts`) |
| `each` | `once`, `table` or `operation` (`operation_kinds` narrows the operations) |
| `mode` | `write` (always), `if_missing` (support files), `merge` (edit an existing file) |
| `template` | template path relative to `codegen/` |
| `raw` | copy the template without Eta |
| `roles` | only render for these repo roles (e.g. `["gateway"]`); default every role that uses this template |
| `skip_if_empty` | no file when the render is empty/whitespace |
| `convention_keys` | conventions the template implements |
| `merge` | `on_missing_file` (`error` / `skip` / `create` / `empty`), `scope` (`once` / `tables`), `present` (`contains` / `regex` / `in_list`) and `steps` (`add_imports`, `insert_before_last`, `insert_before_line_containing`, `insert_after_regex`, `rewrite_list`, `append_lines`) |

## Template data (`it`)

- `it.role`, `it.kind`, `it.version`, `it.vocabulary`, `it.standard_columns` (sorted), `it.tables`, `it.migrations.next`
- `it.dispatcher` (kind `dispatcher` only, else null): `project_id`, `name`, `description`, `env_prefix`, `session_slug`, `ports` (`dispatcher`, `storage`, `api`, `web`), `service_ids` (`storage`, `api`, `gateway`), `repos` (`storage`, `express`, `dispatcher`, `dispatcher_web`), `spawn_root`, `cwd` (same keys as `repos`), `gateway_path_prefix`, `api_path_prefix`, `secrets` (`main_gate`, `main_admin`, `storage`), `endpoints` (`id`, `service_id`, `method`, `path`, `summary`, `requires_body`, `sort_order`)
- per table / operation: `it.crud`, `it.table`, `it.names` (`table`, `entity`, `folder`, `Entity`, `Things`, `entityCamel`, `thingsCamel`), `it.columns`, `it.index`, `it.op` (`kind`, `name`, `file`, `column`)
- `it.h`: string helpers (`pascal`, `kebab`, `camel`, `upperFirst`, `camelToKebab`, `indexName`, `sqlQuote`, `tsQuote`, `json`, `oneLine`, `docText`, `reEscape`)

Whitespace is significant: use `-%>` to drop the newline after a control tag. Generated files must end with exactly one newline.

## Trying a change locally

Point Code Control at local checkouts instead of GitHub:

```bash
# code-control-express-server/.env
CODEGEN_TEMPLATES_DIR=/path/to/dir/containing/the/template/repos
```
