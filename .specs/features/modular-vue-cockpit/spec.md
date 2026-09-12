# Specification: Modular Vue 3 AI Agent Cockpit & Interactive Human-AI Kanban

## 1. User Stories
- **US-1**: As a developer, I want a modular Vue 3 SPA architecture, so that the dashboard UI is clean, componentized, and fully aligned with `DESIGN.md` tokens.
- **US-2**: As a developer acting as Tech Lead, I want an Interactive Kanban Board with two-way sync, so that changing a card's status in the UI immediately updates the physical `tasks.md` file on disk.
- **US-3**: As a developer, I want to review deliveries and revert/reject tasks with feedback, so that if the AI agent's code or tests are insufficient, the task moves back to Pending with clear instructions on what needs to be fixed.
- **US-4**: As a developer, I want a 1-click 'Run with Agent' action on each card, so that I can dispatch the task context directly to the embedded terminal or copy it to the clipboard for my AI assistant.
- **US-5**: As a developer, I want an Embedded Terminal in a dockable bottom drawer with 1-click sensor trigger buttons, so that I can run drift checks, test suites, and AI agent commands without leaving the browser.
- **US-6**: As a developer, I want an Interactive Knowledge Memory Graph view, so that I can inspect entities, observations, and relationships across project sessions.
- **US-7**: As a developer importing SDD into my project, I want the dashboard to run without installing frontend dependencies in my repository root, so that my project remains clean and unpolluted.

## 2. Business Rules & Invariants
- **BR-1**: Host Project Zero-Pollution Invariant — No frontend dependencies, lockfiles, or build steps shall be injected into host repository roots when importing or running SDD.
- **BR-2**: Markdown Single Source of Truth — All status mutations from the UI must directly update the corresponding row in `tasks.md` (converting `[ ]`, `[-]`, or `[x]`) while preserving table formatting.
- **BR-3**: Review Reversion Feedback — When a task is reverted from `Done` or `In Progress` back to `Pending`, the user may provide feedback notes that are recorded alongside the task for the AI to read.
- **BR-4**: Terminal Localhost Invariant — The WebSocket terminal server must bind strictly to `localhost` (`127.0.0.1`) and execute processes within the repository workspace root.
- **BR-5**: Design System Invariant — All UI components must strictly adhere to the Linear Dark color palette (`--canvas: #010102`, `--surface-1: #0f1011`, `--primary: #5e6ad2`), typography (`Inter`, `JetBrains Mono`), and radius tokens defined in `DESIGN.md`.

## 3. Acceptance Criteria (BDD)

### Happy Path (Success Scenarios)
- **AC-1: Static Asset Serving & SPA Fallback**
  - **Given** `.agents/dashboard/dist/` contains pre-compiled SPA assets (index.html, assets/...)
  - **When** a browser sends a `GET /` or `GET /index.html` request to `serve-dashboard.js`
  - **Then** the server responds with 200 OK and serves the Vue 3 application bundle.

- **AC-2: Interactive Kanban Status Mutation (Two-Way Sync)**
  - **Given** an active task TASK-02 with status `[ ]` (Pending) in `tasks.md`
  - **When** the developer moves the card to In Progress in the Kanban board
  - **Then** the client sends a `PATCH /api/features/:featureId/tasks/TASK-02` request with `{ status: "in_progress" }`
  - **And** the server modifies `tasks.md` changing `[ ]` to `[-]` on the TASK-02 line
  - **And** the updated state is broadcast to all clients via SSE.

- **AC-3: Task Revert & Quality Review Feedback**
  - **Given** a task marked as `[x]` (Done) in `tasks.md`
  - **When** the developer drags it back to Pending or clicks 'Request Changes'
  - **Then** a feedback modal opens allowing the developer to type revision notes
  - **And** submitting updates `tasks.md` changing `[x]` back to `[ ]` and appends the feedback note into the task evidence or context.

- **AC-4: 1-Click Agent Dispatcher**
  - **Given** any task in the Kanban board
  - **When** the developer clicks the '[Run with Agent]' button on the card
  - **Then** the Cockpit generates the standardized prompt for the task and its acceptance criteria
  - **And** provides options to send directly into the active embedded terminal or copy to clipboard.

- **AC-5: Terminal Drawer & WebSocket Bidirectional Communication**
  - **Given** the Cockpit dashboard is running in the browser
  - **When** the developer toggles the bottom terminal drawer and enters a command
  - **Then** input is transmitted over WebSocket to a local shell process
  - **And** stdout/stderr ANSI output streams back to `xterm.js` in real-time
  - **And** clicking the '[Run Spec Drift]' button immediately executes `node .agents/scripts/check-spec-drift.js`.

- **AC-6: Live Sync on External AI Edits**
  - **Given** the Cockpit is displayed in the browser
  - **When** an AI agent modifies `tasks.md` or `memory_graph.jsonl` externally in the IDE
  - **Then** the server detects the change via file watcher and broadcasts an update event
  - **And** the Kanban cards and Memory Graph smoothly re-render without page reload.

## 4. Test Data & Boundary Matrix
| Parameter / Field | Valid Inputs (Happy) | Invalid / Boundary Inputs (Edge) |
|---|---|---|
| `PATCH /tasks/:id status` | "pending", "in_progress", "done" | "invalid_status", "", null |
| `PATCH /tasks/:id feedback` | "Fix edge case handling in line 42" | "" (optional), 5000+ chars |
| `ws.message` | Shell keypress string, terminal resize payload | Malformed JSON, non-UTF8 binary chunks |

## 5. Verification Sensors
| Sensor | Command / Target | Success Threshold |
|---|---|---|
| Test Suite | `node tests/serve-dashboard.test.js` | 100% pass |
| Spec Drift Sensor | `node .agents/scripts/check-spec-drift.js` | 0 drifted tasks |
| SPA Build Sensor | `cd packages/dashboard && npm run build` | Clean exit 0, outputs to .agents/dashboard/dist |
