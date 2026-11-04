# Plan: Canonical EGM Lifecycle, Agent Skills Convention & Semantic Drift Sensor

## 1. Problem Statement & Motivation
Modern Spec-Driven Development (SDD) with autonomous and pair-programming AI coding agents faces two critical failure modes:
1. **Conversational Sycophancy & Confirmation Bias**: When a single LLM session brainstorms, specifies, and reviews its own design, it develops conversational bias—glossing over its own ambiguities and unstated assumptions. Solving this requires strict role decoupling:
   - **The Elephant**: Context-rich, long-horizon session for ideation and formal specifications. Strictly **writes zero production code**.
   - **The Goldfish Swarm**: Stateless, zero-context subagents with fresh context windows that attack the specification cold before implementation begins.
2. **Semantic Spec-Code Drift (Video 4:13 - 4:38)**: Traditional git pre-commit hooks and file-boundary sensors only verify that modified file paths match task declarations. They fail to detect whether actual production code omitted required business rules, truncated data models, took shortcuts (hardcoded values, stubs, unhandled errors), or introduced architectural divergence.
3. **Repository Directory Sprawl vs. Open Standards**: Rather than fragmenting the repository with vendor-specific folders (`.claude/`, `.codex/`), we adhere to Anthropic's open **Agent Skills specification** ([agentskills.io](https://agentskills.io)) and the Linux Foundation's **`AGENTS.md` standard**, maintaining `.agents/` as the single source of truth across all tools.

## 2. Scope & Boundaries
- **In Scope**:
  - **Canonical Agent Skill (`.agents/skills/sdd-spec-review/SKILL.md`)**:
    - Declarative YAML frontmatter and adversarial audit instructions following Anthropic's Agent Skills specification.
    - Native auto-discovery by Claude Code, Codex, Antigravity, Cursor, and Windsurf from `.agents/skills/`.
  - **Multi-Harness Invocation Routing in `AGENTS.md`**:
    - Complete instructions and cheat-sheet for Antigravity (`invoke_subagent`), Claude Code (Agent Skills / `Task` tool), and OpenAI Codex.
  - **Semantic Drift Engine**:
    - Zero-dependency script `node .agents/scripts/generate-drift-report.js [feature-id]` analyzing `spec.md` vs. codebase diffs across 4 categories: `MISSING_FEATURES`, `INCOMPLETE_MODELS`, `LOGIC_SHORTCUTS`, `ARCHITECTURAL_DIVERGENCE`.
    - Automated integration into `run-sdd-review.js` as an explicit verification sensor.
  - **Goldfish Spec Review Runner**:
    - Standalone script `node .agents/scripts/run-spec-review.js [feature-id]` (and `npm run spec-review`) for zero-context adversarial spec auditing.
  - **Installer & New Project Distribution**:
    - Verification that `setup.ps1` and `setup.sh` package and deploy the new skill and scripts inside `.agents/`.
    - Automatic script registration (`drift-report`, `spec-review`) in `package.json` when present.
  - **Automated Test Suite**:
    - Unit and integration tests in `tests/egm-multi-harness-drift.test.js` validating all new scripts and skill manifest integrity.

- **Out of Scope**:
  - Creating proprietary vendor folders (`.claude/`, `.codex/`) that violate the single source of truth.
  - Rewriting existing legacy features or altering past ADRs.

## 3. High-Level Approach
1. **Agent Skill Definition**:
   - Author `.agents/skills/sdd-spec-review/SKILL.md` strictly adhering to the Agent Skills open standard (`name`, `description`, progressive disclosure).
2. **Sensor & Tooling Implementation**:
   - `generate-drift-report.js`: Zero-dependency Node.js script comparing `spec.md` against target implementation files to produce `drift-report.md`.
   - `run-spec-review.js`: Zero-dependency Node.js script auditing specifications cold for ambiguity, missing edge cases, and BDD integrity.
   - Wire `generate-drift-report.js` into `run-sdd-review.js`.
3. **Distribution & Governance**:
   - Update `package.json` with `drift-report` and `spec-review` scripts.
   - Update `AGENTS.md` with the 5-phase EGM lifecycle and multi-harness routing matrix.
   - Verify `setup.ps1` and `setup.sh` distribute `.agents/` cleanly.

## 4. Dependencies & Prerequisites
- Node.js (v18+) runtime (zero external npm dependencies required).
- Existing `check-spec-drift.js` and `verify-sdd-integrity.js` sensors.
- Git CLI for diff inspection.

## 5. Architectural Decision Records (ADRs)
- [ADR 0008: Canonical EGM Lifecycle, Agent Skills Convention & Semantic Drift Engine](file:///F:/Projetos/ai-sdd-framework/.specs/project/ADRs/0008-egm-multi-harness-and-semantic-drift.md)
