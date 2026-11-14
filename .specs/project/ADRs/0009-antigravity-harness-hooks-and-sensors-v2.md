# ADR 0009: Antigravity Lifecycle Hooks, Active Drift Scope & Sensors v2

## Status
Accepted

## Date
2026-11-14

## Context
Following the implementation of the 5-phase Elephant-Goldfish Model (EGM) in ADR 0008, an in-depth audit of how SDD operates inside modern AI harnesses—specifically **Google Antigravity**—surfaced four critical architectural gaps:

1. **Voluntary Prompt Compliance vs. Native Runtime Hooks**:
   Previously, SDD rules relied entirely on the LLM voluntarily reading `STATE.md`, `CONTEXT.md`, and `memory_graph.jsonl` at session start (consuming 5–6 sequential file-read tool calls) and voluntarily abstaining from prohibited git commands (`--no-verify`, `git reset --hard`) until the git pre-commit hook ran. Google Antigravity natively discovers `.agents/hooks.json` (`SessionStart`, `PreToolUse`, `Stop`), allowing deterministic runtime enforcement and automatic context injection over `stdin`/`stdout` protojson contracts.

2. **Historical Feature Bleed in Spec Drift (`check-spec-drift.js`)**:
   `getDeclaredTargetFiles()` previously collected `Target Files` across all rows of all `.specs/features/<id>/tasks.md` files, regardless of whether a task was already marked `[x]` (completed). As a repository accumulated completed features, nearly every source file eventually appeared in a historical `tasks.md`, allowing orphaned edits to pass `check-spec-drift.js` without an active task.

3. **Incomplete Goldfish & Semantic Drift Heuristics (`run-spec-review.js` & `generate-drift-report.js`)**:
   - `run-spec-review.js` only checked 8 English adjectives and did not audit `tasks.md` for MetaGPT SOP compliance (test-first ordering and 1–3 file safety valve).
   - `generate-drift-report.js` left the 4th drift category (`ARCHITECTURAL_DIVERGENCE`) unpopulated.

4. **Empty Knowledge Base & Multi-Harness Rule Desynchronization**:
   `.specs/knowledge/patterns/` and `.specs/knowledge/anti-patterns/` remained empty (`0 patterns | 0 anti-patterns`), and secondary harness rule files (`.cursorrules`, `.windsurfrules`, `.clinerules`) lacked the EGM commands added to `CLAUDE.md` in ADR 0008.

## Decision

We adopt the **Antigravity Harness Runtime & Sensors v2 Architecture** within `.agents/` and `.specs/`:

### 1. Native Antigravity Lifecycle Hooks (`.agents/hooks.json` + `.agents/scripts/sdd-hook.js`)
We configure `.agents/hooks.json` using cross-platform Node execution (`node scripts/sdd-hook.js <event>`, which executes with `.agents/` as working directory under both Windows `cmd /c` and Unix `sh -c`):
- **`SessionStart`**: Reads `.specs/project/STATE.md`, `CONTEXT.md`, active entities in `.agents/memory/memory_graph.jsonl`, and `.specs/knowledge/` titles, returning an Antigravity `injectSteps` payload (`{"injectSteps": [{"systemMessage": {"systemMessage": "..."}}]}`) for zero-tool-call context rehydration.
- **`PreToolUse`** (`matcher: "run_command"`): Inspects `toolCall.args.CommandLine` (and `command`) and returns `{"decision": "deny", "reason": "..."}` if destructive or hook-bypassing flags (`--no-verify`, `git reset --hard`, `git push --force`, `git clean -f`) are present. Allows normal commands (`{"decision": "allow"}`).
- **`Stop`**: Inspects working tree spec drift when `terminationReason === "NO_TOOL_CALL"`. Implements an anti-loop guardrail (`executionNum <= 1`): if orphaned code files exist on the first stop attempt, returns `{"decision": "continue", "reason": "..."}` once to remind the agent to map or revert the file; on subsequent turns (`executionNum > 1`) or when clean, allows termination (`{"decision": "allow"}`).

### 2. Active Task Scope Filtering in `check-spec-drift.js`
We update `getDeclaredTargetFiles(options)` in `.agents/scripts/check-spec-drift.js`:
- By default, prioritizes uncompleted tasks (`[ ]` or `[-]`) across `.specs/features/<id>/tasks.md`.
- Supports a backward-compatible fallback when a feature has all tasks marked `[x]` during the final review/commit gate (`includeCompletedFallback`), or explicit `activeOnly: true` filtering for strict working-tree checks.

### 3. Sensors v2 (`run-spec-review.js` & `generate-drift-report.js`)
- **`run-spec-review.js`**: Expands ambiguity detection to bilingual PT/EN terms (`rápido`, `robusto`, `flexível`, `escalável`, `simples`, `fácil`) and adds `auditTasksSop(tasksContent)` to verify decoupled test-first ordering (`test` before `feat`) and the 1–3 target file boundary per task.
- **`generate-drift-report.js`**: Implements `detectArchitecturalDivergence(fileContents, contracts)` to flag forbidden external requires in zero-dependency `.agents/scripts/` modules or unapproved architectural patterns, populating `architecturalDivergence`.

### 4. Knowledge Base Seeding & Multi-Harness Rule Parity
- Populate foundational patterns in `.specs/knowledge/patterns/` (`zero-host-pollution.md`, `antigravity-lifecycle-hooks.md`) and anti-patterns in `.specs/knowledge/anti-patterns/` (`blind-file-overwrite.md`, `test-assertion-weakening.md`).
- Synchronize `.cursorrules`, `.windsurfrules`, and `.clinerules` with `CLAUDE.md` and `AGENTS.md`.

## Consequences

### Positive
- **100% Native Antigravity Compatibility**: Zero vendor pollution; leverages `.agents/hooks.json` directly as specified by Google Antigravity's customization engine.
- **Zero-Latency Context Boot**: `SessionStart` hook pre-hydrates SDD state automatically.
- **Physical Tier-1 Guardrails**: Destructive git commands and `--no-verify` are blocked by the harness before shell execution.
- **Eliminates Historical Drift Blindspot**: Completed features no longer grant blanket permission to edit old source files without an active task.

### Trade-offs / Mitigations
- Hook execution runs synchronously in Antigravity (`timeout: 10`). *Mitigation*: `sdd-hook.js` uses zero external dependencies and fast synchronous filesystem reads, completing in `< 80ms`.
