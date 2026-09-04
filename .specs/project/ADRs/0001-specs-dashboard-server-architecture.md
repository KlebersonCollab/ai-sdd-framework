# ADR 0001: Native Node.js Server & Linear Dark Bootstrap Architecture for Specs Dashboard

## Status
Accepted

## Date
2026-09-03

## Context
The AI-SDD Framework organizes specifications in structured Markdown files under `.specs/features/<id>/`.
Human developers and stakeholders require a high-level visual representation of feature progress, hierarchy (Feature -> User Story -> BDD Criteria -> Tasks), and sensor health.

We evaluated three architectures for delivering this dashboard:
1. **Zero-dependency Native Node.js HTTP Server** dynamically reading `.specs/` on demand.
2. **Static Single-File Generator** compiling Markdown to a static HTML file on disk.
3. **SPA Frontend Framework (React/Vite/Next.js)** requiring package management and build steps.

## Decision
We chose **Option 1: Zero-dependency Native Node.js HTTP Server** (`.agents/scripts/serve-dashboard.js`) serving a responsive frontend built with **Bootstrap 5 CDN + DESIGN.md Linear Dark tokens**.

### Key Architectural Choices:
- **Runtime**: Native Node.js (`http`, `fs`, `path`, `url`) with 0 external npm dependencies (`npm install` not required).
- **Dynamic Parsing**: Parses Markdown files on demand upon client request, allowing real-time reflection of markdown edits upon page refresh without restarting or rebuilding.
- **UI Styling**: Bootstrap 5 grid and components styled with the framework's native Linear Dark design tokens (`#010102` canvas, `#0f1011` surface cards, `#23252a` hairline borders, and `#5e6ad2` lavender accent).
- **Zero-Write Security**: The server acts as a strictly read-only visualization layer, preventing accidental corruption of git-governed specification files.

## Consequences
### Positive
- Zero installation friction: Works immediately with `node .agents/scripts/serve-dashboard.js`.
- Real-time reactivity: Refreshing the browser instantly displays updated tasks and checkboxes.
- Visual alignment: High aesthetic consistency matching `DESIGN.md`.
- Safe: No risk of overwriting or drifting specs from browser input.

### Trade-offs / Mitigations
- Requires an active terminal process while viewing (mitigated by instant startup < 100ms).
- Port conflict if 3000 is occupied (mitigated by auto-fallback or `PORT` environment variable support).
