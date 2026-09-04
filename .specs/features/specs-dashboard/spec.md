# Specification: Specs Dashboard

## 1. User Stories
- **US-1**: As a developer, I want to launch a local dashboard using `node .agents/scripts/serve-dashboard.js` so that I can visually track SDD feature progress without installing extra npm dependencies.
- **US-2**: As a tech lead, I want to see an executive card for every feature in `.specs/features/` showing its title, task completion ratio, and percentage progress bar.
- **US-3**: As a stakeholder, I want to expand a feature card in cascade to view its User Stories, BDD acceptance criteria (Given/When/Then), and atomic tasks table.
- **US-4**: As a developer, I want the tasks table to clearly display task IDs, types, descriptions, dependencies, statuses, and sensor/commit evidence.
- **US-5**: As a user, I want the dashboard to follow the Linear Dark design system from `DESIGN.md` with dark theme tokens, clean typography, and subtle hairline borders.
- **US-6**: As a user, I want to refresh the page or click a Refresh button to immediately see changes made to markdown files on disk.

## 2. Business Rules & Invariants
- **BR-1 (Zero Dependencies)**: The server and parser script MUST execute using only Node.js standard library modules (`http`, `fs`, `path`, `url`). No `node_modules` may be introduced.
- **BR-2 (Read-Only Safety)**: The server MUST NOT expose any endpoints that modify, create, or delete files in the repository.
- **BR-3 (Robust Parsing Fallback)**: If a feature directory is missing `plan.md`, `spec.md`, or `tasks.md`, the parser MUST NOT crash; it must report the missing components gracefully with an informative placeholder.
- **BR-4 (Design System Compliance)**: The styling MUST strictly utilize the color tokens specified in `DESIGN.md` (Canvas: `#010102`, Surface-1: `#0f1011`, Hairline: `#23252a`, Primary Accent: `#5e6ad2`, Ink: `#f7f8f8`, Ink-Muted: `#8a8f98`).

## 3. Acceptance Criteria (BDD)

### Happy Path (Success Scenarios)
- **AC-1: Server Initialization & Endpoint Response**
  - **Given** Node.js >= 18 is installed in the environment
  - **When** `node .agents/scripts/serve-dashboard.js` is started
  - **Then** the server listens on port 3000 (or `process.env.PORT`)
  - **And** requests to `GET /api/features` return HTTP 200 with an array of parsed features in JSON format
  - **And** requests to `GET /` return HTTP 200 with `Content-Type: text/html`.

- **AC-2: Parsing Hierarchy & Progress Calculation**
  - **Given** an active feature directory under `.specs/features/<id>/` containing `tasks.md`
  - **When** the features endpoint parses the feature
  - **Then** all tasks in the 7-column table are extracted with `status`, `id`, `type`, `description`, `targetFiles`, `dependencies`, and `evidence`
  - **And** `completionRate` is computed as `(completedTasks / totalTasks) * 100`.

- **AC-3: Cascading UI Drill-Down**
  - **Given** the dashboard is loaded in the browser
  - **When** a user clicks on a feature card or its expand icon
  - **Then** the accordion expands revealing:
    - User Stories / Plan summary from `plan.md`
    - BDD Scenarios (Given/When/Then) from `spec.md`
    - 7-Column MetaGPT Task Table from `tasks.md` with status badges.

### Input & Validation Scenarios
- **AC-4: Custom Port Selection**
  - **Given** environment variable `PORT=4500` is provided
  - **When** the server starts
  - **Then** it binds to port 4500 instead of 3000 and logs the active URL to stdout.

### Edge Cases & Exceptions (Resilience)
- **AC-5: Missing or Incomplete Spec Files**
  - **Given** a feature folder with only `plan.md` but no `tasks.md`
  - **When** `/api/features` is requested
  - **Then** the server returns the feature with `tasks: []`, `progress: 0`, and does not throw an unhandled exception.

- **AC-6: Empty Features Directory**
  - **Given** no feature folders exist in `.specs/features/`
  - **When** the dashboard page loads
  - **Then** an informative empty-state card is rendered stating "No features found under .specs/features/".

## 4. Test Data & Boundary Matrix
| Parameter / Scenario | Valid Inputs (Happy) | Boundary / Edge Inputs |
|---|---|---|
| `PORT` env var | `3000`, `8080` | `""` (defaults to 3000), non-numeric (fallback to 3000) |
| Feature directory | `.specs/features/specs-dashboard` | Empty folder, folder with invalid files |
| Tasks table syntax | Standard 7-column markdown table | Table with missing columns or extra whitespace |

## 5. Verification Sensors
| Sensor | Command / Target | Success Threshold |
|---|---|---|
| Unit / API Test | `node tests/serve-dashboard.test.js` | 100% pass (Exit code 0) |
| Drift Sensor | `node .agents/scripts/check-spec-drift.js` | 0 unmapped files |
| Memory Compactor | `node .agents/scripts/compact-memory.js` | 0 schema errors |

## 6. UI & Design System Tokens (DESIGN.md Alignment)
- **Canvas Background**: `#010102`
- **Surface Cards (surface-1)**: `#0f1011`
- **Surface Secondary (surface-2)**: `#141516`
- **Hairline Borders**: `#23252a` / `#34343a`
- **Primary Accent**: `#5e6ad2` (Linear lavender)
- **Accent Hover**: `#828fff`
- **Primary Text (ink)**: `#f7f8f8`
- **Secondary Text (ink-muted)**: `#8a8f98`
- **Success Badge**: `#27a644`
- **Progress Bar Track**: `#191a1b` with fill `#5e6ad2`
