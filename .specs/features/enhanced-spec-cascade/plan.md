# Plan: Unified Spec Execution Cascade & Legacy Kanban Retirement

## 1. Problem Statement & Motivation
In Spec Driven Development (SDD), the single source of truth for all feature execution is the 7-column MetaGPT task table inside `.specs/features/<id>/tasks.md`.

In earlier iterations, an interactive 3-column Kanban board (`To Do`, `In Progress`, `Done`) was introduced in the Cockpit. In practice, this created three critical problems:
1. **The Ghost Column**: In AI-driven SDD, agents execute atomically in seconds or minutes (TDD: Red-Green-Refactor-Commit). Tasks jump directly from `[ ]` to `[x]`, leaving the `In Progress` column an empty ghost 99% of the time.
2. **Topological Ordering Invalidation**: SDD tasks form a strict Directed Acyclic Graph (DAG) with explicit `Dependencies`. Drag-and-drop Kanban allows arbitrary card movements that break dependency ordering.
3. **Severe UI Redundancy**: The `SpecsCascade` view already renders the complete specification cascade (Plan → User Stories → BDD Criteria → 7-Column Tasks Table). The Kanban board merely duplicated the task list in a detached, decontextualized format.

We must eliminate this redundancy by **retiring the legacy Kanban board** and elevating the **`SpecsCascade` component into a unified, AI-native execution cockpit**:
- Real-time topological dependency resolution highlighting the **Next Actionable Task** (`⚡ Pronta / Next`).
- Automatic detection and labeling of blocked tasks (`🔒 Bloqueada` with blocking dependency tags).
- Inline task operations: `⚡ Delegar Prompt` (generating & copying surgical agent prompts) and `↩ Rejeitar` (reverting completed tasks with feedback written directly to disk).
- Dynamic, clickable dependency badges (`TASK-01 ✓` / `TASK-02 ○`) that scroll directly to dependency rows.
- Interactive traceability between BDD Acceptance Criteria and task execution.
- Quick status and type filters with summary statistics.

## 2. Scope & Boundaries
- **In Scope**:
  - **Kanban Retirement**:
    - Delete `packages/dashboard/src/components/KanbanBoard.vue`.
    - Remove the Kanban tab from `Navbar.vue`.
    - Remove Kanban view routing and event plumbing from `App.vue`.
  - **Enhanced Spec Execution Cascade (`SpecsCascade.vue`)**:
    - **Dependency Graph Resolution**: Dynamically compute for each task whether its dependencies are met (`isReady`, `isBlocked`, `isNextActionable`).
    - **Next Actionable Highlight**: Visually emphasize the first unblocked pending task with an active pulse indicator.
    - **Inline Action Buttons**:
      - `⚡ Delegar`: Copy formatted task prompt containing ID, description, target files, and SDD instructions to clipboard and trigger optional terminal dispatch.
      - `↩ Rejeitar`: Open rejection modal for verified `[x]` tasks, capture feedback, and mutate status back to `pending` in `tasks.md`.
    - **Interactive Dependency Badges**: Clickable pills that scroll smoothly to the referenced task row and display its current completion state (`✓` or `○`).
    - **BDD Traceability Glow**: Hovering or clicking an Acceptance Criteria card highlights related task rows in the table.
    - **Feature Quick Filters & Statistics**: Filter tasks by status (`All`, `Pending`, `Done`, `Blocked`) and type (`feat`, `test`, `refactor`, `fix`, `docs`).
  - **Governance & ADR Alignment**:
    - Record ADR 0005 and mark ADR 0003 as Superseded.
    - Update `STATE.md`, `ROADMAP.md`, and `TECHNICAL-MAP.md`.
- **Out of Scope**:
  - Altering the backend API schema (existing `/api/features/:id/tasks/:taskId` already supports atomic markdown status updates).
  - External task tracking integrations (Jira, GitHub Issues).

## 3. High-Level Approach
1. **Scaffold Feature Spec**: Plan, BDD Spec, and 7-column Tasks under `.specs/features/enhanced-spec-cascade/`.
2. **Component Cleanup (Retire Kanban)**:
   - Remove `KanbanBoard.vue`.
   - Update `Navbar.vue` and `App.vue` to eliminate the Kanban view and wire rejection/delegation handlers to `SpecsCascade.vue`.
3. **Elevate `SpecsCascade.vue`**:
   - Implement dependency solver logic (`isNextActionable`, `isBlocked`, `isReady`).
   - Implement dynamic dependency badges and jump-to-row scrolling.
   - Implement inline `Delegar` and `Rejeitar` actions with the rejection modal.
   - Implement quick filters and type statistics.
   - Implement BDD criteria hover/focus traceability.
4. **Build & Sensor Verification**:
   - Compile production dashboard assets (`npm run build:dashboard`).
   - Verify SDD integrity (`npm run verify-sdd`), test suite (`npm test`), and spec drift (`npm run check-drift`).

## 4. Dependencies & Prerequisites
- Node.js >= 18 LTS standard library.
- Vue 3, Vite, Tailwind CSS in `packages/dashboard`.
- Existing `/api/features/:featureId/tasks/:taskId` PATCH endpoint in `serve-dashboard.js`.

## 5. Architectural Decision Records (ADRs)
- [ADR 0003: Modular Vue 3 Cockpit Dashboard (Superseded)](../project/ADRs/0003-modular-vue3-cockpit-dashboard.md)
- [ADR 0005: Unified Spec Execution Cascade & Legacy Kanban Retirement](../project/ADRs/0005-unified-spec-cascade-and-kanban-retirement.md)
