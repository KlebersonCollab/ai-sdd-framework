# Specification: Unified Spec Execution Cascade & Legacy Kanban Retirement

## 1. User Stories
- **US-1**: As a developer working with AI agents, I want to see the **Next Actionable Task** automatically highlighted in the specification table, so that I immediately know which task has all dependencies satisfied and is ready to execute.
- **US-2**: As an AI engineer, I want blocked tasks to be explicitly badged with their unmet dependencies, so that I never attempt to run an atomic task before its prerequisites are verified.
- **US-3**: As a tech lead reviewing agent output, I want inline action buttons on every task row to either delegate the task prompt or reject a completed task with feedback, so that I can guide the agent directly from the specification without switching to an external board.
- **US-4**: As a developer inspecting a feature, I want clickable dependency badges that jump directly to the referenced task, so that I can navigate large task graphs effortlessly.
- **US-5**: As an architect, I want to see visual traceability between BDD Acceptance Criteria and the task execution table, so that I can verify that every criteria is implemented by at least one atomic task.
- **US-6**: As a cockpit user, I want the retired Kanban tab removed from the navigation bar, so that the dashboard interface is streamlined and free of redundant views.

## 2. Business Rules & Invariants
- **BR-1**: Single Source of Truth — All status mutations, feedback notes, and task properties must continue to be read from and written to `.specs/features/<id>/tasks.md`.
- **BR-2**: Topological Determinism — A task can only be identified as `isReady` or `isNextActionable` if 100% of its dependencies listed in the `Dependencies` column are in status `done` (`[x]`). If any dependency is pending, the task must be marked `isBlocked`.
- **BR-3**: Zero Redundant Views — The Cockpit navigation must strictly expose distinct, non-overlapping capabilities: Specifications, Living Docs, Memory Graph, and Terminal.
- **BR-4**: Design System Invariance — All new badges, modals, and interaction states must strictly adhere to `DESIGN.md` Linear Dark design tokens.

## 3. Acceptance Criteria (BDD)

### Happy Path (Success Scenarios)
- **AC-1: Elimination of Kanban Navigation and Component**
  - **Given** the Cockpit dashboard is running
  - **When** the developer views the top navigation bar
  - **Then** the `[📌 Kanban Board]` tab is completely absent
  - **And** the available tabs are `[📋 Specifications]`, `[📚 Living Docs]`, `[🧠 Memory Graph]`, and `[🖥️ Terminal]`.

- **AC-2: Topological Dependency Resolution and Next Actionable Highlight**
  - **Given** a feature has tasks with sequential dependencies (`TASK-01` -> `TASK-02` -> `TASK-03`)
  - **When** `TASK-01` is pending
  - **Then** `TASK-01` is badged as `⚡ PRÓXIMA (READY)`
  - **And** `TASK-02` and `TASK-03` are badged as `🔒 Bloqueada` (Blocked)
  - **When** `TASK-01` is marked `[x]` (Done)
  - **Then** `TASK-02` immediately transitions to `⚡ PRÓXIMA (READY)`.

- **AC-3: Interactive Inline Delegation Button**
  - **Given** any unblocked task in the execution table
  - **When** the developer clicks the `⚡ Delegar` button
  - **Then** a structured prompt including task ID, description, target files, and SDD rules is copied to the clipboard
  - **And** a confirmation toast notification is displayed.

- **AC-4: Interactive Inline Rejection and Two-Way Sync**
  - **Given** a task marked as `done` (`[x]`)
  - **When** the developer clicks the `↩ Rejeitar` button
  - **Then** a feedback modal opens allowing the tech lead to enter a revision note
  - **When** the rejection is submitted
  - **Then** `tasks.md` is updated on disk setting status to `[ ]` and appending the feedback to the evidence column
  - **And** the UI reflects the reverted status without page reload.

- **AC-5: Interactive Dependency Badges and Jump-To-Row**
  - **Given** a task row with dependencies (e.g., `TASK-01, TASK-02`)
  - **When** rendered in the table
  - **Then** each dependency is rendered as an individual colored pill (green if done, amber if pending)
  - **When** the developer clicks a dependency pill
  - **Then** the view smoothly scrolls to that task's row and flashes a subtle highlight.

- **AC-6: BDD Acceptance Criteria Traceability Glow**
  - **Given** the BDD Acceptance Criteria section and Task Execution Table are expanded
  - **When** the developer hovers or clicks on an Acceptance Criteria card (e.g. `AC-2`)
  - **Then** the task rows associated with that criteria receive an active visual glow.

- **AC-7: Task Filtering and Summary Metrics**
  - **Given** a feature with multiple tasks
  - **When** the developer selects a filter (`All`, `Pending`, `Done`, `Blocked`, or type `feat`, `test`, `refactor`)
  - **Then** only matching tasks are rendered in the execution table
  - **And** feature header metrics display total, completed, pending, and blocked task counts.

## 4. Test Data & Boundary Matrix
| Input / Scenario | Expected Output | Error Handling / Fallback |
|---|---|---|
| Dependencies: `None` or empty | Task is immediately `Ready` (or `Next Actionable` if first) | Handled safely as 0 dependencies |
| Non-existent dependency ID (e.g. `TASK-99`) | Treated as unmet/blocking dependency | Warning badge or fallback pill |
| Empty feedback in rejection modal | Defaults to `Needs revision` | Fallback text recorded in markdown |
