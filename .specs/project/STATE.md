# Project State & Context

## 🏁 Session Status
- **Current Task**: Completed implementation and verification of feature `egm-multi-harness-drift` (Multi-Harness EGM Lifecycle, Agent Skills Convention & Semantic Drift Engine).
- **Progress**: Phase 4 (Verified & Complete) — 8/8 tasks completed. Delivered `generate-drift-report.js`, `run-spec-review.js`, canonical skill `.agents/skills/sdd-spec-review/SKILL.md`, Stage 6 Reviewer integration, ADR 0008, updated `AGENTS.md` and `package.json`, and zero-drift review approval.
- **Verification Sensors**:
  1. SDD Integrity Sensor: `node .agents/scripts/verify-sdd-integrity.js` — 100% pass (0 violations).
  2. Unit & Integration Tests: `npm test` — 46/46 passing across 5 test suites (100% in ~240ms).
  3. Spec Drift Sensor (File-level): `npm run check-drift` — 0 drifted files.
  4. Semantic Drift Sensor: `npm run drift-report egm-multi-harness-drift` — 0 semantic discrepancies.
  5. SDD Review Runner: `npm run review egm-multi-harness-drift` — VERDICT: APPROVED.

## 💡 Decisions Log
- **2026-11-03 - Canonical EGM Lifecycle, Agent Skills Convention & Semantic Drift Engine (ADR 0008)**: Formalized the 5-phase Elephant-Goldfish Model (EGM) in `AGENTS.md`. Packaged Goldfish adversarial spec review as a canonical Agent Skill (`.agents/skills/sdd-spec-review/SKILL.md`) following Anthropic's open standard. Implemented native zero-dependency Semantic Drift Engine (`generate-drift-report.js`) classifying discrepancies into 4 categories (Missing Features, Incomplete Models, Logic Shortcuts, Architectural Divergences) and integrated as Stage 6 in `run-sdd-review.js`. Accepted ADR 0008.
- **2026-11-02 - GitHub One-Liner Installer & Update-Safe Distribution (ADR 0007)**: Implemented dual-platform zero-dependency one-liner installers (`setup.ps1` and `setup.sh`) pulling directly from GitHub archive. Enforced update-safety invariance protecting `.specs/` and `memory_graph.jsonl`, automatic greenfield/brownfield bootstrapping, and pre-commit hook registration. Accepted ADR 0007.
- **2026-10-18 - Core Sensors Robustness & Productivity Automation Tooling (ADR 0006)**: Introduced dual-mode verification (`--bootstrap` vs canonical), DFS topological task dependency cycle sensor, working-tree aware spec drift detection, worktree-resilient pre-commit hooks, and native CLI automation tools (`auto-discover.js`, `create-feature.js`, `run-sdd-review.js`). Accepted ADR 0006.
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
