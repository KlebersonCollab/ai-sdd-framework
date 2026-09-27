# ADR 0005: Unified Spec Execution Cascade & Retirement of Legacy Kanban Board

## Status
Accepted

## Date
2026-09-27

## Context
In ADR 0003, we introduced a 3-column Interactive Kanban Board (`To Do`, `In Progress`, `Done`) inside the Vue 3 Cockpit Dashboard. The intention was to provide human-in-the-loop task dispatching and status mutation.

However, in practical operation within an AI-driven Spec Driven Development (SDD) ecosystem:
1. **The Physics of AI Execution**: Unlike human developers who keep tasks in "In Progress" for days, AI agents execute atomically in seconds or minutes (TDD: Red-Green-Refactor-Commit). Tasks jump directly from `[ ]` (Pending) to `[x]` (Done). Consequently, the "In Progress" column remained an empty visual ghost 99% of the time.
2. **Topological Dependency Invalidation**: SDD tasks follow a strict Directed Acyclic Graph (DAG) defined in the MetaGPT 7-column schema (`Dependencies` column). Free-form drag-and-drop between columns visually distorts task ordering and invites accidental execution of blocked tasks.
3. **Severe UI Redundancy**: The `SpecsCascade` view already rendered the complete hierarchical specification cascade: Strategic Plan (`plan.md`) → User Stories (`spec.md`) → BDD Acceptance Criteria (`spec.md`) → 7-Column Task Execution Table (`tasks.md`). The Kanban board merely duplicated the task list in an inferior, decontextualized format.

We evaluated two alternatives:
- **Alternative A: Retain and Artificially Animate Kanban**: Force subagents to log micro-status transitions into `[-]` during their 15-second runs.
- **Alternative B: Retire Kanban and Unify into Enhanced Spec Cascade**: Eliminate `KanbanBoard.vue` and enhance `SpecsCascade.vue` with real-time topological dependency resolution, inline delegation/reversion actions, BDD traceability, and clickable dependency badges.

## Decision
We adopt **Alternative B: Retire Legacy Kanban in favor of the Unified Spec Execution Cascade**:

1. **Retire `KanbanBoard.vue`**:
   - Remove `packages/dashboard/src/components/KanbanBoard.vue`.
   - Remove the `[📌 Kanban Board]` tab from `Navbar.vue` and routing in `App.vue`.
   - Supersede ADR 0003 with ADR 0005.

2. **Elevate `SpecsCascade.vue` with Native AI Capabilities**:
   - **Topological Dependency Resolver & Next Actionable Task Highlight**:
     - Compute task readiness based on dependencies.
     - Unblocked pending tasks are labeled "Pronta / Ready".
     - The first unblocked pending task is highlighted with a pulse badge: `⚡ PRÓXIMA / NEXT ACTIONABLE`.
     - Tasks with pending dependencies are flagged as `🔒 Bloqueada` with tooltip showing blocking tasks.
   - **Inline Task Operations**:
     - `⚡ Delegar Prompt`: Generates and copies a context-rich prompt tailored for the AI agent (including Task ID, Description, Target Files, and SDD guidelines).
     - `↩ Rejeitar / Reverter`: Allows the tech lead to reopen a completed task (`[x]` → `[ ]`) with feedback that is persisted directly into `tasks.md`.
   - **Dynamic Dependency Badges**:
     - Transform raw dependency strings into reactive badges:
       - Green check `TASK-01 ✓` if the dependency is satisfied.
       - Amber circle `TASK-02 ○` if the dependency is blocking.
       - Clicking any dependency badge automatically scrolls to and highlights that task row.
   - **Traceability & Filters**:
     - Quick filters by status (`All`, `Pending`, `Done`, `Blocked`) and task type (`feat`, `test`, `fix`, `refactor`, `docs`).
     - Visual link between BDD Acceptance Criteria and tasks.

## Consequences
### Positive
- **Zero Redundancy**: The Cockpit eliminates duplicated task views and focuses strictly on high-value projections: Specifications, Living Docs, Memory Graph, and Terminal.
- **True AI-Native Workflow**: Eliminates legacy human agile ceremonies (3-column Kanban) in favor of DAG dependency resolution and atomic verification.
- **Enhanced Productivity**: Developers identify the exact next actionable task at a glance without manually tracing dependency IDs.
- **Reduced Bundle Footprint**: Eliminates dead component code and simplifies state synchronization in `App.vue`.

### Trade-offs / Mitigations
- Drag-and-drop column movement is removed. *Mitigation*: Dragging was an anti-pattern for DAG-governed tasks; inline one-click status buttons (`Delegar`, `Rejeitar`) provide superior, dependency-safe control.
