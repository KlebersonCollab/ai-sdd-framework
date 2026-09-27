# Task List: Unified Spec Execution Cascade & Legacy Kanban Retirement

## Sequence Guidelines (MetaGPT SOP)
- **Strict Sequential Order**: Tasks must be executed top-to-bottom without reordering or cherry-picking.
- **Atomic File Boundaries**: Each task modifies at most 1–3 specific target files.
- **Decoupled Test Setup**: Test scaffolding and refactor tasks precede implementation tasks.
- **Sensor Evidence Gate**: Mark complete `[x]` ONLY after passing build, lint, and test sensors with recorded evidence.

## Implementation Tasks

| Status | ID | Type | Description | Target Files | Dependencies | Evidence |
|---|---|---|---|---|---|---|
| [x] | TASK-01 | refactor | Delete `KanbanBoard.vue` and remove Kanban navigation tab and views from `Navbar.vue` and `App.vue` | `packages/dashboard/src/components/Navbar.vue`, `packages/dashboard/src/App.vue` | None | vite build exit 0, Kanban navigation eliminated |
| [x] | TASK-02 | feat | Implement topological dependency resolution logic in `SpecsCascade.vue` (`isBlocked`, `isReady`, `isNextActionable`) | `packages/dashboard/src/components/SpecsCascade.vue` | TASK-01 | vite build exit 0, Next Actionable task highlighted |
| [x] | TASK-03 | feat | Implement dynamic dependency badges with status indicators (`✓`/`○`) and jump-to-row scrolling in `SpecsCascade.vue` | `packages/dashboard/src/components/SpecsCascade.vue` | TASK-02 | vite build exit 0, Clickable dependency badges |
| [x] | TASK-04 | feat | Implement inline task actions (`⚡ Delegar Prompt` and `↩ Rejeitar` with feedback modal) in `SpecsCascade.vue` and `App.vue` | `packages/dashboard/src/components/SpecsCascade.vue`, `packages/dashboard/src/App.vue` | TASK-03 | vite build exit 0, Task delegation & rejection synced |
| [x] | TASK-05 | feat | Implement BDD Acceptance Criteria traceability cross-highlighting, target files copy chips, and status/type quick filters | `packages/dashboard/src/components/SpecsCascade.vue` | TASK-04 | vite build exit 0, Filters & BDD traceability active |
| [x] | TASK-06 | feat | Compile dashboard assets (`npm run build:dashboard`) and regenerate static documentation (`npm run docs:export`) | `packages/dashboard/dist/index.html`, `docs/index.html` | TASK-05 | build:dashboard exit 0, docs/index.html (99 KB) |
| [x] | TASK-07 | review | Run complete SDD sensors (`verify-sdd-integrity.js`, unit tests, spec drift check) and audit acceptance criteria | `tests/serve-dashboard.test.js`, `.agents/scripts/verify-sdd-integrity.js` | TASK-06 | 21/21 tests pass, SDD integrity 100% pass, 0 drift |

## Schema Dictionary
- **Status**: `[ ]` (Pending) | `[x]` (Verified Complete).
- **ID**: `TASK-01`, `TASK-02`, etc.
- **Type**: `test` | `feat` | `fix` | `refactor` | `docs` | `rules` | `skill` | `review`.
- **Target Files**: Concrete comma-separated file paths (relative to workspace root).
- **Dependencies**: Comma-separated list of preceding task IDs or `None`.
- **Evidence**: Commit hash (`git rev-parse --short HEAD`) + sensor output snippet.
