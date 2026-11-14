# Plan: Antigravity Harness Lifecycle Hooks, Active Drift Scope & Sensors v2

## 1. Problem Statement & Motivation
While the AI-SDD Framework enforces constitutional governance at git commit time and defines the 5-phase Elephant-Goldfish Model (EGM), an empirical audit of its operation inside the **Google Antigravity** harness identified four structural improvement areas:
1. **Runtime Hook Integration (`.agents/hooks.json`)**: Without native lifecycle hooks, the agent must execute 5–6 manual file reads at the beginning of every session to rehydrate `STATE.md`, `CONTEXT.md`, and `memory_graph.jsonl`, and Tier 1 command prohibitions (`--no-verify`, `git reset --hard`) are not physically intercepted before shell execution.
2. **Historical Feature Bleed in `check-spec-drift.js`**: Scanning all `tasks.md` rows across already-completed features allows previously touched source files to be modified without an active task (`[ ]` or `[-]`).
3. **Sensor Coverage in `run-spec-review.js` and `generate-drift-report.js`**: `run-spec-review.js` lacks bilingual (PT/EN) ambiguity detection and automated MetaGPT SOP task validation (`test` before `feat`, max 3 target files per task), while `generate-drift-report.js` leaves `architecturalDivergence` unpopulated.
4. **Empty Knowledge Base & Secondary Harness Rules**: `.specs/knowledge/patterns/` and `.specs/knowledge/anti-patterns/` contain 0 entries, and `.cursorrules`, `.windsurfrules`, and `.clinerules` lack the EGM CLI commands present in `CLAUDE.md`.

## 2. Scope & Boundaries
- **In Scope**:
  - **Antigravity Lifecycle Hooks (`.agents/hooks.json` & `.agents/scripts/sdd-hook.js`)**:
    - `SessionStart` handler returning `injectSteps` with pre-hydrated context from `STATE.md`, `CONTEXT.md`, active `memory_graph.jsonl` entities, and `.specs/knowledge/` entries in `< 80ms`.
    - `PreToolUse` handler (`matcher: "run_command"`) blocking (`decision: "deny"`) prohibited flags (`--no-verify`, `git reset --hard`, `git push --force`, `git branch -D`).
    - `Stop` handler with single-turn anti-loop guardrail (`executionNum <= 1`) checking for orphaned code files via `checkSpecDrift`.
  - **Active Task Scope Filtering in `check-spec-drift.js`**:
    - Support `activeOnly` task filtering (`[ ]` and `[-]`) with backward-compatible fallback when auditing staged commits or completed feature reviews.
  - **Sensors v2 (`run-spec-review.js` & `generate-drift-report.js`)**:
    - Bilingual PT/EN ambiguity lexicon and `auditTasksSop(tasksContent)` in `run-spec-review.js`.
    - `detectArchitecturalDivergence(fileContents, contracts)` in `generate-drift-report.js`.
  - **Knowledge Base Seeding & Multi-Harness Rule Parity**:
    - Initial patterns (`zero-host-pollution.md`, `antigravity-lifecycle-hooks.md`) and anti-patterns (`blind-file-overwrite.md`, `test-assertion-weakening.md`).
    - Synchronization of `.cursorrules`, `.windsurfrules`, and `.clinerules` with `AGENTS.md` and `CLAUDE.md`.
- **Out of Scope**:
  - Proprietary directories outside `.agents/` and `.specs/`.
  - External npm runtime dependencies.

## 3. High-Level Approach
1. Create comprehensive unit and integration tests in `tests/antigravity-harness-v2.test.js` covering Antigravity hook stdin/stdout JSON contracts, active drift scope filtering, SOP task auditing, architectural divergence detection, and knowledge base artifacts.
2. Implement `.agents/scripts/sdd-hook.js` and `.agents/hooks.json` adhering to the Google Antigravity `hooks.json` specification (`cwd` set to `.agents/`, camelCase JSON payloads on `stdin`/`stdout`).
3. Upgrade `.agents/scripts/check-spec-drift.js`, `.agents/scripts/run-spec-review.js`, and `.agents/scripts/generate-drift-report.js`.
4. Populate `.specs/knowledge/patterns/` and `.specs/knowledge/anti-patterns/`, and synchronize `.cursorrules`, `.windsurfrules`, `.clinerules`, and `AGENTS.md`.

## 4. Dependencies & Prerequisites
- Node.js v18+ standard library (`fs`, `path`, `child_process`).
- Google Antigravity customization discovery engine (`.agents/hooks.json`).

## 5. Architectural Decision Records (ADRs)
- [ADR 0009: Antigravity Lifecycle Hooks, Active Drift Scope & Sensors v2](file:///F:/Projetos/ai-sdd-framework/.specs/project/ADRs/0009-antigravity-harness-hooks-and-sensors-v2.md)
