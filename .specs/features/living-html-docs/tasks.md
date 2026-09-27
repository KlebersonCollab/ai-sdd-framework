# Task List: Universal Living HTML Documentation Platform & Standalone Static Exporter

## Sequence Guidelines (MetaGPT SOP)
- **Strict Sequential Order**: Tasks must be executed top-to-bottom without reordering or cherry-picking.
- **Atomic File Boundaries**: Each task modifies at most 1–3 specific target files.
- **Decoupled Test Setup**: Test scaffolding tasks (`Type: test`) precede implementation tasks (`Type: feat`).
- **Sensor Evidence Gate**: Mark complete `[x]` ONLY after passing build, lint, and test sensors with recorded evidence.

## Implementation Tasks

| Status | ID | Type | Description | Target Files | Dependencies | Evidence |
|---|---|---|---|---|---|---|
| [x] | TASK-01 | test | Scaffold test cases for documentation endpoints (`GET /api/project`, `/api/codebase`, `/api/rules`, `/api/knowledge`) | `tests/serve-dashboard.test.js` | None | node:test 15 pass, 4 fail (baseline 404 confirmed) |
| [x] | TASK-02 | feat | Implement `/api/project`, `/api/codebase`, `/api/rules`, and `/api/knowledge` endpoints | `.agents/scripts/serve-dashboard.js` | TASK-01 | node:test 19 pass (all 4 endpoints returning 200 JSON) |
| [x] | TASK-03 | test | Scaffold test suite for standalone static documentation exporter | `tests/export-docs.test.js` | None | node:test 0 pass, 2 fail (baseline confirmed) |
| [x] | TASK-04 | feat | Implement zero-dependency standalone HTML documentation exporter and add `docs:export` script | `.agents/scripts/export-docs.js`, `package.json` | TASK-03 | node:test 2 pass, docs/index.html generated (85 KB) |
| [x] | TASK-05 | feat | Scaffold `LivingDocsView.vue` component with sub-navigation tabs (Architecture, ADRs, Glossary, Rules, Knowledge) | `packages/dashboard/src/components/LivingDocsView.vue` | TASK-02 | vite build exit 0 (LivingDocsView scaffolded) |
| [x] | TASK-06 | feat | Implement ADR Decision Hub and Domain Glossary sub-views with status filtering and instant search | `packages/dashboard/src/components/LivingDocsView.vue` | TASK-05 | vite build exit 0 (ADR filters & domain glossary search) |
| [x] | TASK-07 | feat | Implement Architecture & System Map sub-view with in-browser Mermaid diagram rendering | `packages/dashboard/src/components/LivingDocsView.vue` | TASK-05 | vite build exit 0 (Mermaid dynamic renderer integration) |
| [x] | TASK-08 | feat | Integrate `LivingDocsView` into `Navbar.vue` and `App.vue`, wire SSE live reload, and compile production assets | `packages/dashboard/src/components/Navbar.vue`, `packages/dashboard/src/App.vue` | TASK-06, TASK-07 | npm run build:dashboard exit 0 (.agents/dashboard/dist/ updated) |
| [x] | TASK-09 | review | Run complete SDD sensor suite (`verify-sdd-integrity.js`, unit tests, spec drift check) and audit acceptance criteria | `tests/serve-dashboard.test.js`, `.agents/scripts/verify-sdd-integrity.js` | TASK-04, TASK-08 | 21/21 tests pass, SDD integrity 100% pass |

## Schema Dictionary
- **Status**: `[ ]` (Pending) | `[x]` (Verified Complete).
- **ID**: `TASK-01`, `TASK-02`, etc.
- **Type**: `test` | `feat` | `fix` | `refactor` | `docs` | `rules` | `skill` | `review`.
- **Target Files**: Concrete comma-separated file paths (relative to workspace root).
- **Dependencies**: Comma-separated list of preceding task IDs or `None`.
- **Evidence**: Commit hash (`git rev-parse --short HEAD`) + sensor output snippet.
