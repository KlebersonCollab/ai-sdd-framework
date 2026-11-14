# Project Roadmap: AI-SDD Framework

## Strategic Objectives
Establish the industry-standard Spec Driven Development (SDD) runtime and living governance operating system for autonomous and pair-programming AI coding assistants.

---

## Milestones

### Milestone 1: Core Governance & Multi-Harness Runtime (v0.1.0)
- [x] Standardize 5-stage SDD lifecycle (`Memory -> Explorer -> Planner -> Executor -> Reviewer`).
- [x] Implement Tier 1 Absolute Prohibitions (`.agents/rules/TIER1_PROHIBITIONS.md`).
- [x] Implement Quality Enforcement Rules (`.agents/rules/QUALITY_ENFORCEMENT.md`).
- [x] Implement Token Optimization Rules (`.agents/rules/TOKEN_OPTIMIZATION.md`).
- [x] Long-Term Memory Graph (`.agents/memory/memory_graph.jsonl`) with namespace & tenant isolation.

### Milestone 2: Pre-Commit Spec Drift Sensor & SOP Schema (v0.2.0)
- [x] Constitutional Spec-Code Drift Sensor (`check-spec-drift.js`).
- [x] MetaGPT 7-column SOP tasks table standard.
- [x] BDD acceptance criteria schema with Given/When/Then contracts.
- [x] Native git pre-commit hook installer (`install-hooks.js`).

### Milestone 3: Interactive AI Agent Cockpit & Reactive Kanban (v0.3.0)
- [x] Native zero-dependency Node.js HTTP/WS server (`serve-dashboard.js`).
- [x] Decoupled Vue 3 + Vite SPA in `packages/dashboard` with Linear Dark tokens.
- [x] Two-way interactive Kanban board syncing directly to `tasks.md`.
- [x] Embedded PTY terminal drawer with WebSocket streaming and sensor triggers.
- [x] Interactive property graph visualizer (`vis-network`) for memory recall.
- [x] Stabilize bidirectional reactivity & SSE live-sync across all open tabs.
- [x] Automated SDD integrity sensor (`verify-sdd-integrity.js`).

### Milestone 4: Canonical Living HTML Documentation Platform (v0.4.0)
- [x] Universal specs explorer covering 100% of `.specs/` (`project/`, `codebase/`, `knowledge/`, `ADRs/`, `rules/`).
- [x] Real-time in-browser Mermaid diagram rendering for architecture graphs.
- [x] ADR catalog with status lifecycle (`Proposed` -> `Accepted` -> `Superseded`) and cross-impact links.
- [x] Interactive domain glossary search (`CONTEXT.md`).
- [x] Standalone single-file HTML exporter (`npm run docs:export`) for zero-server distribution.

### Milestone 5: Multi-Harness EGM Lifecycle & One-Liner Distribution (v0.5.0)
- [x] Universal GitHub one-liner installers (`setup.ps1` & `setup.sh`) with update-safe `.specs/` and `memory_graph.jsonl` preservation (ADR 0007).
- [x] Canonical 5-phase Elephant-Goldfish Model (EGM) & `.agents/skills/sdd-spec-review/SKILL.md` (ADR 0008).
- [x] Zero-dependency Semantic Drift Engine (`generate-drift-report.js`) across 4 discrepancy categories.

### Milestone 6: Native Google Antigravity Harness Hooks & Sensors v2 (v1.0.0)
- [x] Native Google Antigravity lifecycle hooks (`.agents/hooks.json` + `.agents/scripts/sdd-hook.js` for `SessionStart`, `PreToolUse`, `Stop`) (ADR 0009).
- [x] Active task scope filtering (`activeOnly`) in `check-spec-drift.js`.
- [x] Bilingual PT/EN ambiguity lexicon & MetaGPT SOP task validator (`auditTasksSop`) in `run-spec-review.js`.
- [x] Architectural divergence detector (`detectArchitecturalDivergence`) in `generate-drift-report.js`.
- [x] Foundational Knowledge Base patterns & anti-patterns seeded in `.specs/knowledge/`.

---

## Release Status Matrix
| Milestone | Version | Status | Target Date |
|---|---|---|---|
| Milestone 1: Governance & Rules | v0.1.0 | Released | 2026-08-25 |
| Milestone 2: Spec Drift Engine | v0.2.0 | Released | 2026-08-31 |
| Milestone 3: Cockpit & Reactivity | v0.3.0 | Released | 2026-09-27 |
| Milestone 4: Living HTML Docs | v0.4.0 | Released | 2026-09-27 |
| Milestone 5: EGM & One-Liner Setup | v0.5.0 | Released | 2026-11-03 |
| Milestone 6: Antigravity Harness v2 | v1.0.0 | Released | 2026-11-14 |
