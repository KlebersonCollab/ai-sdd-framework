# Project State & Context

## 🏁 Session Status
- **Current Task**: Completed implementation and verification of feature `enhanced-spec-cascade` (Unified Spec Execution Cascade & Legacy Kanban Retirement).
- **Progress**: Phase 4 (Verified & Complete) — 7/7 tasks completed. Retired `KanbanBoard.vue` and Kanban navigation tab. Elevated `SpecsCascade.vue` with real-time topological dependency resolution (DAG), Next Actionable Task pulse highlight (`⚡ PRÓXIMA`), dynamic dependency status badges (`✓`/`○`) with jump-to-row scrolling, inline task actions (`⚡ Delegar` with structured prompt copy, `↩ Rejeitar` with feedback modal and two-way sync), target files chips, and BDD Acceptance Criteria traceability glow. ADR 0005 accepted; ADR 0003 superseded.
- **Verification Sensors**:
  1. SDD Integrity Sensor: `node .agents/scripts/verify-sdd-integrity.js` — 100% pass (0 violations).
  2. Unit & Integration Tests: `npm test` — 21/21 passing (100% in 139ms).
  3. Spec Drift Sensor: `npm run check-drift` — 0 drifted files.
  4. Dashboard Build: `npm run build:dashboard` — Clean build to `.agents/dashboard/dist/`.
  5. Standalone HTML Export: `npm run docs:export` — Generated `docs/index.html` (99 KB).

## 💡 Decisions Log
- **2026-09-27 - Unified Spec Execution Cascade & Kanban Retirement (ADR 0005)**: Retired legacy 3-column Kanban board in favor of AI-native execution cascade inside `SpecsCascade.vue` featuring real-time topological dependency resolution, Next Actionable task pulse highlight, inline `Delegar`/`Rejeitar` actions, and clickable dependency badges. Superseded ADR 0003.
- **2026-09-27 - Universal Living HTML Docs Architecture (ADR 0004)**: Formalized dual-projection living documentation strategy combining native Node.js endpoints (`/api/project`, `/api/codebase`, `/api/rules`, `/api/knowledge`), in-browser Mermaid diagram rendering in Vue 3 Cockpit, and a standalone zero-dependency static HTML exporter (`export-docs.js`).
- **2026-09-27 - SSE Reactivity Normalization**: Standardized SSE payloads to transmit `{ type: 'reload', event: 'reload', timestamp }` and updated `App.vue` to handle both, eliminating the manual refresh requirement. Wired `fetchMemory` in `MemoryGraphView` and `fetchDocs` in `LivingDocsView` to live sync events.
- **2026-09-27 - ADR Lifecycle & Canonical Integrity**: Enforced explicit ADR lifecycle (`Proposed` -> `Accepted` -> `Superseded`). Marked ADR 0001 as superseded by ADR 0003. Created `ROADMAP.md` to satisfy AGENTS.md requirements.
- **2026-09-11 - Interactive Human-AI Cockpit (ADR 0003)**: Decoupled Vue 3 + Vite SPA in `packages/dashboard` emitting pre-compiled production assets to `.agents/dashboard/dist/` served statically by native Node.js (`serve-dashboard.js`).
- **2026-09-03 - Memory Graph Visualization (ADR 0002)**: Selected Vis-Network via CDN integrated into unified Specs Dashboard with top navigation tabs, native `GET /api/memory`, and Neo4j-style side inspector drawer.
- **2026-09-03 - Live Sync & Auto-Reload**: Implemented native Server-Sent Events (`/api/events`) with debounced (300ms) recursive `fs.watch` on `.specs/`.

## 🚧 Active Blockers
- None currently blocking.

## ❄️ Deferred Ideas / Icebox
- PDF generator export alongside HTML export.
- Auto-sync to GitHub Pages via GitHub Actions workflow.

## ⚠️ Known Technical Debts
- **Knowledge Base Content**: Populate initial patterns (e.g. Zero Host Pollution, Dual-Projection Living Docs) in `.specs/knowledge/patterns/`.
