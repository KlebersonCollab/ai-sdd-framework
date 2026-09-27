# Project State & Context

## 🏁 Session Status
- **Current Task**: Completed implementation and audit of feature `living-html-docs` (Milestone 4: Universal Living HTML Documentation Platform & Standalone Static Exporter).
- **Progress**: Phase 4 (Verified & Complete) — 9/9 tasks executed under `sdd-executor` and audited under `sdd-review`. Integrated `/api/project`, `/api/codebase`, `/api/rules`, and `/api/knowledge` in `serve-dashboard.js`. Created `LivingDocsView.vue` with interactive sub-tabs for Architecture (with dynamic Mermaid rendering), ADR Decision Hub (with status filters), Domain Glossary (with instant search), Governance Rules, and Knowledge Base. Delivered zero-dependency single-file static HTML exporter (`export-docs.js` -> `npm run docs:export` generating `docs/index.html`).
- **Verification Sensors**:
  1. SDD Integrity Sensor: `node .agents/scripts/verify-sdd-integrity.js` — 100% pass (0 violations).
  2. Unit & Integration Tests: `npm test` — 21/21 passing (100% in 135ms).
  3. Spec Drift Sensor: `npm run check-drift` — 0 drifted files.
  4. Dashboard Build: `npm run build:dashboard` — Clean build to `.agents/dashboard/dist/`.
  5. Standalone HTML Export: `npm run docs:export` — Generated `docs/index.html` (85 KB).

## 💡 Decisions Log
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
