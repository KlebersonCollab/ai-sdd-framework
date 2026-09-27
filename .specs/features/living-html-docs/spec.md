# Specification: Universal Living HTML Documentation Platform & Standalone Static Exporter

## 1. User Stories
- **US-1**: As a developer or tech lead, I want to access a unified `Living Docs` view in the Cockpit, so that I can explore the entire project specification tree (project vision, codebase reality, ADRs, and governance rules) from a single interface.
- **US-2**: As an architect, I want to view all Architectural Decision Records (ADRs) in an interactive hub with status filtering (`Accepted`, `Superseded`, `Proposed`), so that I can immediately understand active vs deprecated architectural choices.
- **US-3**: As a software engineer, I want architecture diagrams and flows written in Mermaid markdown (````mermaid) to render as interactive visual diagrams in the browser, so that I don't have to visualize text blocks in my head.
- **US-4**: As a team member, I want to search domain terms defined in `CONTEXT.md` in real time, so that I can adhere to the ubiquitous language across all features.
- **US-5**: As a developer sharing specs with non-technical stakeholders, I want a single command (`npm run docs:export`) that compiles the entire specification corpus into a single, offline HTML file (`docs/index.html`), so that it can be reviewed without launching a server.
- **US-6**: As an AI agent or developer updating documentation, I want changes made in Markdown on disk to update the Living Docs view in real-time via SSE without requiring manual browser reload.

## 2. Business Rules & Invariants
- **BR-1**: File-First Immutability — The Living Docs view and the Static Exporter are strictly read projections. Git-tracked Markdown and JSONL files remain the sole authoritative single source of truth.
- **BR-2**: Zero Host Pollution — The static exporter (`export-docs.js`) and the backend endpoints in `serve-dashboard.js` must operate using native Node.js standard libraries with zero external npm dependencies required in the host project.
- **BR-3**: Design System Invariance — All Living Docs UI views and exported HTML must strictly comply with `DESIGN.md` Linear Dark tokens (`--canvas: #010102`, `--surface-1: #0f1011`, `--primary: #5e6ad2`, font `Inter` and `JetBrains Mono`).
- **BR-4**: ADR Status Completeness — The ADR Decision Hub must display status badges matching valid lifecycles (`Accepted`, `Superseded`, `Proposed`, `Deprecated`) and include direct hyperlinks between superseding and superseded decisions.
- **BR-5**: Offline Standalone Invariance — The exported `docs/index.html` file must function 100% offline when opened via `file:///` in any modern web browser without network requests to local backends.

## 3. Acceptance Criteria (BDD)

### Happy Path (Success Scenarios)
- **AC-1: Project, Codebase, and Rules API Endpoints**
  - **Given** `.specs/project/`, `.specs/codebase/`, and `.agents/rules/` contain valid markdown files
  - **When** the browser sends `GET /api/project`, `GET /api/codebase`, and `GET /api/rules`
  - **Then** the server responds with 200 OK and JSON payloads containing parsed titles, content, and metadata
  - **And** `GET /api/project` includes an array of all ADRs with parsed status, date, and title.

- **AC-2: Interactive Living Docs View in Cockpit**
  - **Given** the Cockpit dashboard is open in the browser
  - **When** the developer clicks the `[📚 Living Docs]` tab in the top navigation
  - **Then** the view switches to the Living Docs Explorer displaying sub-tabs: Architecture, ADR Hub, Glossary, Rules, and Knowledge
  - **And** the user can switch between sub-tabs instantly without full page reloads.

- **AC-3: In-Browser Mermaid Diagram Rendering**
  - **Given** a markdown section contains a fenced code block with language `mermaid`
  - **When** the section is rendered in the Living Docs view or exported HTML
  - **Then** the raw text is transformed into a responsive visual SVG diagram.

- **AC-4: Filterable ADR Catalog**
  - **Given** multiple ADRs exist with statuses `Accepted` and `Superseded`
  - **When** the developer selects filter "Superseded"
  - **Then** only superseded ADRs are shown
  - **And** clicking any ADR card opens its complete decision rationale and target link.

- **AC-5: Standalone Single-File HTML Export**
  - **Given** the command `node .agents/scripts/export-docs.js` is executed
  - **When** the compilation completes
  - **Then** a self-contained `docs/index.html` file is generated
  - **And** opening `docs/index.html` directly in a browser allows tab switching, full-text searching, and reading all specifications offline.

- **AC-6: Real-Time SSE Live-Sync for Documentation**
  - **Given** the Living Docs view is displayed in the browser
  - **When** an agent or developer edits any file in `.specs/codebase/` or `.specs/project/`
  - **Then** the server detects the change via `fs.watch` and dispatches a `{ type: 'reload', event: 'reload' }` SSE event
  - **And** the active view re-fetches data and updates the UI without manual page refresh.

## 4. Test Data & Boundary Matrix
| Endpoint / Function | Valid Inputs (Happy) | Boundary / Invalid Inputs (Edge) |
|---|---|---|
| `GET /api/project` | Standard GET request | Missing files (returns graceful empty fallbacks) |
| `GET /api/codebase` | Standard GET request | Malformed markdown headers (handles generic fallback title) |
| `GET /api/rules` | Standard GET request | Missing rules folder (returns empty rules array) |
| `exportDocs()` | Standard execution with full `.specs/` | Empty knowledge directory (renders "No patterns registered yet") |
| Mermaid Renderer | Valid flowchart / sequence syntax | Syntax error in diagram (displays error fallback message gracefully) |

## 5. Verification Sensors
| Sensor | Command / Target | Success Threshold |
|---|---|---|
| SDD Integrity Sensor | `node .agents/scripts/verify-sdd-integrity.js` | 100% pass (0 violations) |
| Server & API Tests | `node tests/serve-dashboard.test.js` | 100% pass |
| Exporter Tests | `node tests/export-docs.test.js` | 100% pass |
| Spec Drift Sensor | `node .agents/scripts/check-spec-drift.js` | 0 drifted files |
| SPA Dashboard Build | `npm run build:dashboard` | Clean exit 0, outputs to .agents/dashboard/dist |
