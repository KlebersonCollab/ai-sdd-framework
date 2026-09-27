# ADR 0003: Modular Vue 3 Cockpit Dashboard with Interactive Human-AI Kanban and Embedded Terminal

## Status
Superseded by ADR 0005

## Date
2026-09-11

## Context
The AI-SDD Framework requires a visual cockpit that not only observes specifications and memory, but actively facilitates the real-world collaboration loop between the human developer (acting as Tech Lead / Reviewer) and AI agents (acting as Implementers).
Developers need to:
1. Direct the AI agent to focus on specific tasks.
2. Review deliverables and reject/revert tasks back to Pending or In Progress if the delivery does not meet quality expectations, appending structured feedback.
3. Keep Markdown (`tasks.md`) as the ultimate git-tracked single source of truth without desynchronization.
4. Execute sensors and interact with AI CLIs via an integrated terminal (xterm.js).
5. Ensure zero dependency pollution when the framework is imported into foreign/brownfield host projects.

## Decision
We adopt an **Interactive Human-AI Cockpit Architecture**:
- **Source Location**: packages/dashboard/ developed with **Vue 3**, **Vite**, and styled with [DESIGN.md](../../../DESIGN.md) Linear Dark tokens.
- **Delivery & Serving**: Production assets compiled to .agents/dashboard/dist/ and served statically by native Node.js (serve-dashboard.js).
- **Interactive Two-Way Kanban Board**:
  - Drag-and-drop or card actions trigger PATCH /api/features/:featureId/tasks/:taskId, which surgically updates the status checkbox ([ ], [-], [x]) in the physical `tasks.md` file.
  - **Revert & Quality Feedback Loop**: Moving a card out of Done back to In Progress or Pending prompts for review feedback, appended to the task's context so the agent knows what to fix.
  - **Agent Dispatcher Action**: Each card features a [⚡ Run with Agent] action that generates the exact task execution prompt and directly feeds it into the embedded terminal or clipboard.
- **Embedded Terminal**: xterm.js in a dockable drawer connected via WebSocket to a native shell process with quick-action sensor buttons.

## Consequences
### Positive
- **Real-World Team Dynamics**: Seamless Tech Lead / Agent pairing with clear delegation, review, rejection, and approval cycles.
- **Git-Governed Single Source of Truth**: All UI changes write directly to Markdown (`tasks.md`), preserving full version control and spec immutability across multi-agent sessions.
- **Immediate Agent Context**: Rejection feedback written to `tasks.md` is immediately readable by any AI harness (Cursor, Claude Code, Antigravity, Windsurf).
- **Non-Invasive**: Host projects remain 100% free of frontend npm dependencies.

### Trade-offs / Mitigations
- **Concurrent File Writes**: Fast UI edits could compete with agent edits. *Mitigation*: Atomic surgical regex replacement on `tasks.md` with SSE broadcast.
- **Security**: Terminal and mutation endpoints bind strictly to localhost.