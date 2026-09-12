# Task List: Modular Vue 3 AI Agent Cockpit & Interactive Human-AI Kanban

## Sequence Guidelines (MetaGPT SOP)
- **Strict Sequential Order**: Tasks must be executed top-to-bottom without reordering or cherry-picking.
- **Atomic File Boundaries**: Each task modifies at most 1–3 specific target files.
- **Decoupled Test Setup**: Test scaffolding tasks (`Type: test`) precede implementation tasks (`Type: feat`).
- **Sensor Evidence Gate**: Mark complete `[x]` ONLY after passing build, lint, and test sensors with recorded evidence.

## Implementation Tasks

| Status | ID | Type | Description | Target Files | Dependencies | Evidence |
|---|---|---|---|---|---|---|
| [x] | TASK-01 | test | Scaffold test cases for task mutation endpoint (`PATCH /api/features/:id/tasks/:id`), static asset serving, and WebSocket terminal | `tests/serve-dashboard.test.js` | None | node:test 10 pass, 2 fail (baseline confirmed) |
| [x] | TASK-02 | feat | Implement `PATCH /api/features/:id/tasks/:id` with two-way markdown sync and task feedback recording | `.agents/scripts/serve-dashboard.js` | TASK-01 | node:test 12 pass (PATCH endpoint & surgical markdown sync) |
| [x] | TASK-03 | feat | Implement static file serving for `.agents/dashboard/dist/` and WebSocket terminal bridge | `.agents/scripts/serve-dashboard.js` | TASK-01 | node:test 14 pass (static asset serving & websocket upgrade) |
| [x] | TASK-04 | feat | Scaffold Vue 3 + Vite monorepo structure in `packages/dashboard` with Tailwind CSS and `DESIGN.md` tokens | `packages/dashboard/package.json`, `packages/dashboard/vite.config.js`, `packages/dashboard/tailwind.config.js`, `packages/dashboard/postcss.config.js`, `packages/dashboard/index.html`, `packages/dashboard/src/main.js`, `packages/dashboard/src/style.css`, `packages/dashboard/src/App.vue` | None | vite build exit 0 (Vue 3 + Tailwind scaffolded) |
| [x] | TASK-05 | feat | Implement Top Navigation, Metrics, and `SpecsCascade.vue` component in `packages/dashboard/src` | `packages/dashboard/src/components/Navbar.vue`, `packages/dashboard/src/components/MetricsHeader.vue`, `packages/dashboard/src/components/SpecsCascade.vue` | TASK-04 | vite build exit 0 (Navbar, MetricsHeader, SpecsCascade.vue) |
| [x] | TASK-06 | feat | Implement `KanbanBoard.vue` with drag-and-drop, two-way sync, Revert/Reject modal, and Agent Dispatch button | `packages/dashboard/src/components/KanbanBoard.vue` | TASK-02, TASK-04 | vite build exit 0 (KanbanBoard.vue with drag-drop, reject modal, agent delegation) |
| [x] | TASK-07 | feat | Implement `TerminalDrawer.vue` with `xterm.js`, WebSocket streaming, and 1-click sensor trigger buttons | `packages/dashboard/src/components/TerminalDrawer.vue` | TASK-03, TASK-04 | vite build exit 0 (TerminalDrawer with xterm.js & ws bridge) |
| [x] | TASK-08 | feat | Implement `MemoryGraphView.vue` with vis-network force layout and node inspector drawer | `packages/dashboard/src/components/MemoryGraphView.vue` | TASK-05 | vite build exit 0 (vis-network graph & node inspector drawer) |
| [x] | TASK-09 | feat | Configure Vite build target to emit assets to `.agents/dashboard/dist/` and add dashboard build script | `packages/dashboard/vite.config.js`, `package.json` | TASK-06, TASK-07, TASK-08 | npm run build:dashboard exit 0 (assets emitted to .agents/dashboard/dist) |
| [x] | TASK-10 | refactor | Remove legacy embedded HTML template string and Bootstrap 5 CDN from `serve-dashboard.js` | `.agents/scripts/serve-dashboard.js` | TASK-09 | node:test 14 pass (legacy renderDashboardHtml and Bootstrap removed) |
| [x] | TASK-11 | review | Audit all acceptance criteria, verify zero spec drift, and run full test sensors | `tests/serve-dashboard.test.js`, `.agents/scripts/check-spec-drift.js` | TASK-10 | node:test 14 pass, check-drift 0 drifted, vite build exit 0 |
| [x] | TASK-12 | feat | Implement interactive line discipline, UTF-8 PowerShell console, history navigation, and OS font detection for embedded terminal | `packages/dashboard/src/components/TerminalDrawer.vue`, `.agents/scripts/serve-dashboard.js`, `packages/dashboard/src/style.css` | TASK-07 | node:test 15 pass, vite build exit 0 |
| [x] | TASK-13 | docs | Update README.md with Cockpit architecture, zero host pollution runtime, interactive Kanban, embedded terminal, and framework scripts | `README.md` | TASK-12 | check-drift 0 drifted, README updated |


## Schema Dictionary
- **Status**: `[ ]` (Pending) | `[x]` (Verified Complete).
- **ID**: `TASK-01`, `TASK-02`, etc.
- **Type**: `test` | `feat` | `fix` | `refactor` | `docs` | `rules` | `skill` | `review`.
- **Target Files**: Concrete comma-separated file paths (relative to workspace root).
- **Dependencies**: Comma-separated list of preceding task IDs or `None`.
- **Evidence**: Commit hash (`git rev-parse --short HEAD`) + sensor output snippet.
