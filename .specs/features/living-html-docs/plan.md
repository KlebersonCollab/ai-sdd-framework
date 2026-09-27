# Plan: Universal Living HTML Documentation Platform & Standalone Static Exporter

## 1. Problem Statement & Motivation
In Spec Driven Development (SDD), the single source of truth is always Git-tracked Markdown and JSONL files.
However, human stakeholders, tech leads, and developers often find navigating through dozens of nested markdown files in `.specs/project/`, `.specs/codebase/`, `.specs/features/`, `.specs/knowledge/`, and `.agents/rules/` fragmented and tedious.

Currently, the AI-SDD Cockpit (`serve-dashboard.js` + `packages/dashboard`) solves this only for active features and the memory graph. Over 75% of the framework's knowledge—architectural decisions (ADRs), brownfield maps, conventions, domain glossary, and governance rules—has no visual projection in the browser. Furthermore, sharing specifications with non-developer stakeholders currently requires them to clone the repository and launch a Node.js process.

We must empower the project with a **Universal Living HTML Documentation Platform**:
1. Full 360° visibility over 100% of `.specs/` and `.agents/rules/` directly within the interactive Vue Cockpit.
2. Real-time in-browser Mermaid diagram rendering for architecture diagrams and sequence flows.
3. Interactive ADR Decision Hub with lifecycle filtering (`Accepted`, `Superseded`, `Proposed`) and cross-impact tracking.
4. Instant search across domain glossary terms (`CONTEXT.md`).
5. A zero-dependency standalone HTML exporter (`.agents/scripts/export-docs.js`) compiling the entire spec ecosystem into a single-file offline document (`docs/index.html`).

## 2. Scope & Boundaries
- **In Scope**:
  - **Backend API Expansion (`serve-dashboard.js`)**:
    - `GET /api/project`: Returns parsed `PROJECT.md`, `ROADMAP.md`, `STATE.md`, `CONTEXT.md`, and all `ADRs/` with status and dates.
    - `GET /api/codebase`: Returns parsed `STACK.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `CONCERNS.md`, and `TECHNICAL-MAP.md`.
    - `GET /api/rules`: Returns parsed `TIER1_PROHIBITIONS.md`, `QUALITY_ENFORCEMENT.md`, and `TOKEN_OPTIMIZATION.md`.
    - `GET /api/knowledge`: Returns parsed patterns and anti-patterns from `.specs/knowledge/`.
  - **Frontend Living Docs View (`packages/dashboard/src/components/LivingDocsView.vue`)**:
    - Sub-tabs: Architecture & System Map, ADR Decision Hub, Domain Glossary, Governance Rules, Knowledge Base.
    - Interactive Mermaid rendering for ````mermaid blocks.
    - Instant full-text search across documentation sections.
    - Navigation link integrated into `Navbar.vue`.
  - **Standalone Static Exporter (`.agents/scripts/export-docs.js`)**:
    - Zero external npm dependencies (native Node.js `fs`, `path`).
    - Produces a single-file self-contained HTML (`docs/index.html`) with embedded `DESIGN.md` Linear Dark tokens.
    - Interactive client-side tab switching and search without needing a web server.
    - Added script: `npm run docs:export`.
- **Out of Scope**:
  - Modifying the underlying file formats (Markdown and JSONL remain the File-First single source of truth).
  - External documentation hosting or cloud service deployments.

## 3. High-Level Approach
1. **Backend & Test-First Scaffolding**:
   - Write unit tests in `tests/serve-dashboard.test.js` verifying the new API endpoints (`/api/project`, `/api/codebase`, `/api/rules`, `/api/knowledge`).
   - Implement the endpoint handlers in `serve-dashboard.js`.
2. **Static Exporter Implementation & Testing**:
   - Write test suite `tests/export-docs.test.js`.
   - Implement `.agents/scripts/export-docs.js` reading `.specs/` and emitting `docs/index.html`.
3. **Frontend Living Docs Component**:
   - Build `LivingDocsView.vue` in `packages/dashboard/src/components/`.
   - Implement Mermaid integration and markdown rendering.
   - Wire top-level navigation in `Navbar.vue` and `App.vue`.
   - Compile production assets (`npm run build:dashboard`).
4. **Sensor Verification & Audit**:
   - Run `verify-sdd-integrity.js`, unit tests, spec drift sensor, and production build sensor.

## 4. Dependencies & Prerequisites
- Node.js >= 18 LTS standard library.
- Vue 3, Vite, Tailwind CSS (already scaffolded in `packages/dashboard`).
- Mermaid CDN or lightweight client-side library for diagram rendering.

## 5. Architectural Decision Records (ADRs)
- [ADR 0001: Native Node.js Server & Linear Dark Bootstrap Architecture (Superseded)](../project/ADRs/0001-specs-dashboard-server-architecture.md)
- [ADR 0002: Memory Graph Visualization](../project/ADRs/0002-memory-graph-visualization.md)
- [ADR 0003: Modular Vue 3 Cockpit Dashboard](../project/ADRs/0003-modular-vue3-cockpit-dashboard.md)
- [ADR 0004: Universal Living HTML Documentation Platform & Standalone Static Exporter](../project/ADRs/0004-universal-living-html-docs-architecture.md)
