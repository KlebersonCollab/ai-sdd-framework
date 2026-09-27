# ADR 0004: Universal Living HTML Documentation Platform & Standalone Static Exporter

## Status
Accepted

## Date
2026-09-27

## Context
The AI-SDD Framework enforces a File-First Single Source of Truth where all specifications, brownfield realities, architecture maps, and governance rules reside in Git-tracked Markdown files (`.specs/` and `.agents/rules/`).

While structured Markdown is optimal for LLM comprehension and version control diffs, human developers, tech leads, and stakeholders face friction when navigating across nested folders:
1. **75% Blind Spot in Cockpit**: The existing Cockpit dashboard only parses `.specs/features/` and memory graph, leaving project vision (`PROJECT.md`, `ROADMAP.md`), brownfield architecture (`.specs/codebase/`), governance rules (`.agents/rules/`), and decision records (`ADRs/`) unprojected in the browser.
2. **Static Dead Architecture**: Architecture maps and component hierarchies stored as text lack interactive visual graph rendering (e.g. Mermaid diagram rendering).
3. **Sharing & Offline Accessibility**: Stakeholders and non-developer team members cannot view the specifications without cloning the repository and launching a Node.js process.

We evaluated two architectural strategies:
- **Strategy A: Dynamic-Only Expansion**: Add more API endpoints to `serve-dashboard.js` and render in Vue 3 only.
- **Strategy B: Dual-Projection (Dynamic Cockpit + Standalone Static Exporter)**: Expand the native Node.js API and Vue 3 Cockpit for live local development, AND provide an automated zero-dependency static HTML compiler that bundles the entire specification corpus into a single standalone HTML document.

## Decision
We adopt **Strategy B: Dual-Projection Architecture for Universal Living Documentation**:

1. **Native Server Expansion (`serve-dashboard.js`)**:
   - Add zero-dependency REST endpoints:
     - `GET /api/project`: Parses `PROJECT.md`, `ROADMAP.md`, `STATE.md`, `CONTEXT.md`, and all `ADRs/` with status metadata.
     - `GET /api/codebase`: Parses `STACK.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `CONCERNS.md`, and `TECHNICAL-MAP.md`.
     - `GET /api/rules`: Parses `TIER1_PROHIBITIONS.md`, `QUALITY_ENFORCEMENT.md`, and `TOKEN_OPTIMIZATION.md`.
     - `GET /api/knowledge`: Parses patterns and anti-patterns from `.specs/knowledge/`.
   - The existing debounced `fs.watch` on `.specs/` and `.agents/rules/` ensures immediate SSE live-sync upon saving any file.

2. **Frontend Living Docs Explorer (`packages/dashboard`)**:
   - New top-level navigation tab: `[📚 Living Docs]`.
   - Sub-views:
     - **Architecture & System Map**: Interactive Mermaid diagram renderer + Stack badges + Conventions table.
     - **ADR Decision Hub**: Filterable catalog (`Accepted`, `Superseded`, `Proposed`) with status badges and feature cross-links.
     - **Domain Glossary**: Instant search across ubiquitous language terms in `CONTEXT.md`.
     - **Governance Hub**: Visual matrix of Tier 1 Prohibitions and Quality Enforcement with code diff examples.
     - **Knowledge Base**: Curated patterns and anti-patterns.

3. **Standalone Zero-Dependency Static Exporter (`.agents/scripts/export-docs.js`)**:
   - Script executable via `npm run docs:export`.
   - Compiles 100% of `.specs/` and rules into a self-contained, single-file HTML (`docs/index.html` or `specs-live-book.html`).
   - Includes embedded CSS (`DESIGN.md` Linear Dark tokens), client-side search, collapsibles, and CDN/inlined markdown + Mermaid renderers.
   - Requires zero server runtime and can be hosted on GitHub Pages or shared offline via email.

## Consequences
### Positive
- **360° Living Visibility**: Human leads inspect the entire project ecosystem in real time without digging through nested directories.
- **Zero Host Pollution Preserved**: The native server requires zero npm dependencies for host projects; the exporter runs via native Node.js.
- **True Living Documentation**: Any edit in Markdown instantly reflects in the browser without manual refresh.
- **Zero-Friction Sharing**: Standalone single-file export enables non-technical stakeholders to explore the full spec tree offline.

### Trade-offs / Mitigations
- **Bundle & Asset Footprint**: Adding Mermaid rendering in Vue and static export. *Mitigation*: Dynamically load Mermaid or use CDN/lightweight parser to keep footprint minimal.
