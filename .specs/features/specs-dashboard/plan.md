# Plan: Specs Dashboard (Visual Documentation & Cascade Viewer)

## 1. Problem Statement & Motivation
The AI-SDD Framework establishes an airtight, deterministic workflow for AI agents using Markdown files (`plan.md`, `spec.md`, `tasks.md`). However, reviewing multi-level markdown across nested directories introduces cognitive overhead for human developers, team leads, and product stakeholders.

There is no unified visual dashboard that answers at a glance:
- Which features exist and what phase are they in?
- What is the completion percentage (% of completed tasks)?
- How does the feature cascade from high-level User Stories down into BDD criteria and atomic tasks?

## 2. Scope & Boundaries
- **In Scope**:
  - Standalone native Node.js HTTP server (`.agents/scripts/serve-dashboard.js`) running on configurable port (default 3000).
  - Real-time dynamic parsing of `.specs/features/*` (`plan.md`, `spec.md`, `tasks.md`).
  - Parsing the MetaGPT 7-column task table to compute progress metrics (Pending, In Progress, Done).
  - Responsive web interface featuring Bootstrap 5 and the framework's **Linear Dark** design system (`DESIGN.md`).
  - Multi-level cascading drill-down:
    1. Feature Overview Card & Progress Bar
    2. User Stories & Strategic Plan (from `plan.md` / `spec.md`)
    3. BDD Acceptance Criteria (from `spec.md`)
    4. Atomic Tasks Table (from `tasks.md`) with status badges and commit/sensor evidence.
  - Quick refresh button and health check indicator.
- **Out of Scope**:
  - Web-based editing/writing to markdown files (dashboard is strictly read-only).
  - External npm dependencies or heavyweight frontend build frameworks.
  - Multi-user authentication/RBAC (intended for local developer pair-programming or CI artifact hosting).

## 3. High-Level Approach
1. **Server Layer**: `.agents/scripts/serve-dashboard.js` provides:
   - `GET /`: Serves single-page HTML containing UI templates, styles, and client-side logic.
   - `GET /api/features`: Scans `.specs/features/`, parses Markdown files into structured JSON hierarchy, and returns HTTP 200 JSON.
2. **Parser Layer**: Modular parsing functions extracting:
   - Metadata from frontmatter or top-level headings.
   - User stories and sections from `plan.md` and `spec.md`.
   - Markdown table rows from `tasks.md` matching the MetaGPT 7-column schema.
3. **UI Layer**:
   - Built with Bootstrap 5 layout primitives.
   - Injected with CSS variables matching `DESIGN.md` (`--bg-canvas: #010102`, `--card-bg: #0f1011`, `--accent-lavender: #5e6ad2`, `--hairline: #23252a`).
   - Accordion component for smooth cascade expansion.

## 4. Dependencies & Prerequisites
- Node.js >= 18 LTS (native `http`, `fs`, `path`, `url`).
- Browser with modern CSS support.
- No external npm packages required.

## 5. Architectural Decision Records (ADRs)
- See [ADR 0001: Native Node.js Server & Linear Dark Bootstrap Architecture](file:///F:/Projetos/ai-sdd-framework/.specs/project/ADRs/0001-specs-dashboard-server-architecture.md).
