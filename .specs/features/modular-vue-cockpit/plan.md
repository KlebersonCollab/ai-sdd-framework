# Plan: Modular Vue 3 AI Agent Cockpit & Interactive Human-AI Kanban

## 1. Problem Statement & Motivation
The current dashboard implementation in .agents/scripts/serve-dashboard.js uses inline HTML template strings and CDN libraries. While lightweight, it is read-only and lacks true componentization.
In a real-world Spec Driven Development lifecycle, the relationship between the developer and AI agents is dynamic: the developer acts as the Tech Lead / Reviewer who assigns tasks, reviews PRs/deliveries, and rejects or reverts tasks back to earlier stages when tests or code quality are insufficient.
The AI Agent Cockpit must empower this exact collaboration dynamic:
1. Two-way interactive Kanban board where status changes update `tasks.md` on disk.
2. Review & Revert workflow: reject low-quality deliveries with feedback for the AI to address.
3. 1-click Agent Dispatch: trigger or feed tasks directly into the embedded terminal or AI CLI.
4. Embedded xterm.js terminal for running sensors and interacting with agent harnesses.
5. Zero dependency pollution when imported into host repositories.

## 2. Scope & Boundaries
- **In Scope**:
  - Modular Vue 3 + Vite SPA in packages/dashboard/ styled with DESIGN.md Linear Dark tokens.
  - **Interactive Kanban Board**:
    - Columns: To Do (Pending), In Progress, Done (Verified).
    - Drag-and-drop or card action menu with status transitions.
    - Two-way sync: writing status updates directly to `tasks.md` via PATCH /api/features/:featureId/tasks/:taskId.
    - Revert / Reject flow with review feedback modal.
    - Agent Dispatch button ([⚡ Run with Agent]) injecting commands into the embedded terminal or clipboard.
  - **Embedded Terminal**:
    - Bottom dockable drawer with xterm.js and WebSocket backend in serve-dashboard.js.
    - Quick-action buttons to run SDD sensors (`check-spec-drift.js`, `npm test`, `compact-memory.js`).
  - **Specs Cascade & Memory Graph**:
    - Living spec hierarchy (Plan -> User Stories -> BDD Scenarios -> Tasks).
    - Vis-network knowledge graph with side inspector drawer.
  - **Zero-Dependency Host Serving**:
    - Vite builds static assets to .agents/dashboard/dist/.
    - Native Node.js HTTP server in serve-dashboard.js serves pre-built assets with zero npm dependencies for the host project.
- **Out of Scope**:
  - Direct UI creation/deletion of features (spec creation remains governed by sdd-planner).
  - Storing state in external SQL/NoSQL databases (Markdown remains the single source of truth).

## 3. High-Level Approach
1. **Backend Endpoints & WebSocket Bridge**:
   - Add PATCH /api/features/:featureId/tasks/:taskId to serve-dashboard.js to perform surgical updates on `tasks.md` (updating checkboxes [ ], [-], [x]).
   - Add WebSocket handler to stream bidirectional shell I/O for xterm.js.
   - Add static asset handler for .agents/dashboard/dist/.
2. **Frontend Architecture**:
   - Scaffold packages/dashboard with Vue 3, Vite, Pinia, and Tailwind CSS.
   - Build KanbanBoard.vue with drag-and-drop, review feedback modal, and agent dispatcher.
   - Build TerminalDrawer.vue with xterm.js integration and quick trigger actions.
   - Build SpecsCascade.vue and MemoryGraphView.vue.
3. **Distribution & Build**:
   - Output build directly into .agents/dashboard/dist/.

## 4. Dependencies & Prerequisites
- Node.js >= 18 LTS.
- xterm and xterm-addon-fit for the frontend.
- Native Node.js http and child_process for server and terminal streaming.

## 5. Architectural Decision Records (ADRs)
- [ADR 0001: Native Node.js Server & Linear Dark Bootstrap Architecture](../project/ADRs/0001-specs-dashboard-server-architecture.md)
- [ADR 0002: Memory Graph Visualization](../project/ADRs/0002-memory-graph-visualization.md)
- [ADR 0003: Modular Vue 3 Cockpit Dashboard with Interactive Human-AI Kanban and Embedded Terminal](../project/ADRs/0003-modular-vue3-cockpit-dashboard.md)