# Specification: Antigravity Harness Lifecycle Hooks, Active Drift Scope & Sensors v2

## 1. User Stories
- **US-1 (Antigravity Session Auto-Rehydration)**: As a developer using Google Antigravity, I want `.agents/hooks.json` to run a `SessionStart` hook that injects `STATE.md`, `CONTEXT.md`, active `memory_graph.jsonl` entities, and `.specs/knowledge/` indices via `systemMessage`, so that the agent boots with full project context in `< 80ms` without manual file-read tool calls.
- **US-2 (Antigravity PreToolUse Safety Gate)**: As a governance architect, I want a `PreToolUse` hook matching `run_command` to block (`decision: "deny"`) prohibited commands (`--no-verify`, `git reset --hard`, `git push --force`, `git branch -D`), so that Tier 1 Prohibitions are enforced physically by the harness before command execution.
- **US-3 (Antigravity Stop Hook with Anti-Loop Guardrail)**: As a developer, I want the `Stop` hook to check for orphaned working-tree code files when `terminationReason === "NO_TOOL_CALL"` and `executionNum <= 1`, returning `decision: "continue"` at most once per turn so that Spec Drift is caught before turn completion without causing infinite continuation loops.
- **US-4 (Active Task Scope Filtering)**: As an SDD reviewer, I want `check-spec-drift.js` to filter declared target files by uncompleted tasks (`[ ]` or `[-]`) when `activeOnly` is enabled (with fallback for completed feature commits), so that historical completed features do not mask orphaned edits.
- **US-5 (Sensors v2 & Knowledge Base Seeding)**: As an engineer, I want `run-spec-review.js` to audit `tasks.md` SOP boundaries and bilingual PT/EN ambiguities, `generate-drift-report.js` to detect `architecturalDivergence`, and `.specs/knowledge/` to contain initial patterns and anti-patterns.

## 2. Business Rules & Invariants
- **BR-1 (Antigravity Hook Contract Compliance)**: `.agents/hooks.json` MUST define `SessionStart`, `PreToolUse`, and `Stop` handlers invoking `node scripts/sdd-hook.js <event>` (resolved relative to `.agents/`), reading camelCase JSON from `stdin` and emitting valid JSON to `stdout` within `< 10s` timeout.
- **BR-2 (Tier 1 Command Interception)**: When `PreToolUse` receives `toolCall.name === "run_command"`, any command containing `--no-verify`, `git reset --hard`, `git push --force`, or `git branch -D` MUST return `{"decision": "deny", "reason": "..."}`.
- **BR-3 (Stop Hook Anti-Loop Invariance)**: The `Stop` hook handler MUST only return `{"decision": "continue"}` when `terminationReason === "NO_TOOL_CALL"`, `executionNum <= 1`, and `checkSpecDrift` detects `driftingFiles.length > 0`. For `executionNum > 1` or non-tool terminations, it MUST return `{"decision": "allow"}`.
- **BR-4 (Active Task Scope Isolation)**: `getDeclaredTargetFiles({ activeOnly: true })` in `check-spec-drift.js` MUST extract target files exclusively from task rows marked `[ ]` or `[-]`, ignoring rows marked `[x]`.
- **BR-5 (SOP Task Audit & Architectural Divergence)**: `run-spec-review.js` MUST export `auditTasksSop(tasksContent)` verifying `test` before `feat` ordering and `<= 3` target files per task, and `generate-drift-report.js` MUST export `detectArchitecturalDivergence(fileContents, contracts)` flagging prohibited external dependencies in zero-dependency `.agents/scripts/` files.
- **BR-6 (Knowledge Base & Harness Rule Parity)**: `.specs/knowledge/patterns/` and `.specs/knowledge/anti-patterns/` MUST each contain at least 2 canonical markdown entries, and `.cursorrules`, `.windsurfrules`, and `.clinerules` MUST include the canonical EGM CLI commands.

## 3. Acceptance Criteria (BDD)

### Happy Path (Success Scenarios)
- **AC-1: Antigravity SessionStart Context Injection**
  - **Given** `.agents/hooks.json` and `.agents/scripts/sdd-hook.js` are present in the workspace
  - **When** `sdd-hook.js session-start` is invoked with an Antigravity `SessionStart` JSON payload on `stdin`
  - **Then** it outputs a valid JSON object containing `injectSteps[0].systemMessage.systemMessage` with active context from `STATE.md`, `memory_graph.jsonl`, and `.specs/knowledge/` and exits with code 0.

- **AC-2: Antigravity PreToolUse Blocks Prohibited Commands**
  - **Given** the agent attempts to invoke `run_command` with `CommandLine: "git commit -m 'msg' --no-verify"` or `"git reset --hard HEAD~1"`
  - **When** `sdd-hook.js pre-tool-use` evaluates the `PreToolUse` JSON payload
  - **Then** it outputs `{"decision": "deny", "reason": "..."}` blocking execution, while returning `{"decision": "allow"}` for `"npm test"`.

- **AC-3: Antigravity Stop Hook Enforces Single-Turn Drift Check**
  - **Given** an unmapped source file exists in the working tree at turn end (`terminationReason: "NO_TOOL_CALL"`, `executionNum: 1`)
  - **When** `sdd-hook.js stop` evaluates the payload
  - **Then** it returns `{"decision": "continue", "reason": "..."}` on `executionNum: 1`, and returns `{"decision": "allow"}` when `executionNum: 2` or when 0 drifting files exist.

- **AC-4: Active Task Scope Filtering in Spec Drift Sensor**
  - **Given** a feature `tasks.md` containing both completed (`[x]`) and pending (`[ ]` or `[-]`) task rows
  - **When** `getDeclaredTargetFiles({ activeOnly: true })` is called
  - **Then** only files declared in `[ ]` or `[-]` rows are returned in the set, excluding files that appear solely in `[x]` rows.

- **AC-5: Spec Review SOP Task Validation & Bilingual Ambiguity Detection**
  - **Given** a `tasks.md` where a `feat` task precedes all `test` tasks or declares `> 3` target files, or a `spec.md` with Portuguese vague terms (`rápido`, `robusto`)
  - **When** `auditTasksSop` and `detectAmbiguities` in `run-spec-review.js` are executed
  - **Then** the violations and bilingual ambiguous terms are reported with line numbers and actionable recommendations.

- **AC-6: Semantic Drift Architectural Divergence Detection**
  - **Given** a target file under `.agents/scripts/` importing an unapproved external npm package (e.g., `require('axios')` or `require('lodash')`)
  - **When** `detectArchitecturalDivergence` and `analyzeSemanticDrift` in `generate-drift-report.js` run
  - **Then** `architecturalDivergence` lists the violation and `verdict` is set to `FAIL`.

### Input & Validation Scenarios
- **AC-7: Malformed or Empty Hook Stdin Payload Resilience**
  - **Given** `sdd-hook.js` receives an empty string or malformed JSON on `stdin`
  - **When** the script executes
  - **Then** it safely falls back to a valid non-crashing JSON response (`{}` or `{"decision": "allow"}`) and exits with code 0 so the Antigravity harness loop is never deadlocked.

- **AC-8: PowerShell One-Liner (irm | iex) BOM-Free & Pipeline Execution Resilience**
  - **Given** `setup.ps1` is fetched via `Invoke-RestMethod` (`irm`) from `raw.githubusercontent.com` and piped into `Invoke-Expression` (`iex`) in Windows PowerShell 5.1 or PowerShell 7
  - **When** the PowerShell AST parser (`Parser::ParseInput`) and `Invoke-Expression` evaluate `setup.ps1`
  - **Then** `setup.ps1` contains zero UTF-8 BOM bytes (`0xEF 0xBB 0xBF`), omits top-level `[CmdletBinding()]` and `param(...)` blocks that fail under `iex`, resolves `$Repo` and `$Branch` via `$env:AI_SDD_REPO` / `$env:AI_SDD_BRANCH` fallbacks, and writes `memory_graph.jsonl` using BOM-free `UTF8Encoding($false)` with 0 parse errors.

## 4. Test Data & Boundary Matrix
| Parameter / Field | Valid Inputs (Happy) | Invalid / Boundary Inputs (Edge) |
|---|---|---|
| `toolCall` | `{ name: "run_command", args: { CommandLine: "npm test" } }` | `{ name: "run_command", args: { CommandLine: "git commit --no-verify" } }`, `null` |
| `executionNum` | `1` (first stop check), `2` (anti-loop bypass) | `0`, `undefined`, `-1` |
| `activeOnly` | `true` (active tasks `[ ]` / `[-]`), `false` (all tasks) | `undefined` |
| `architecturalDivergence` | `[]` (only Node.js built-ins required in `.agents/scripts/`) | `["require('express') in zero-dependency script"]` |

## 5. Verification Sensors
| Sensor | Command / Target | Success Threshold |
|---|---|---|
| SDD Integrity | `node .agents/scripts/verify-sdd-integrity.js` | Exit code 0, 0 violations |
| Spec Drift | `node .agents/scripts/check-spec-drift.js --working-tree` | 0 drifting files |
| Semantic Drift | `node .agents/scripts/generate-drift-report.js antigravity-harness-v2` | 0 discrepancies (`APPROVED`) |
| Goldfish Spec Review | `node .agents/scripts/run-spec-review.js antigravity-harness-v2` | `PASS` (0 ambiguities, 100% BDD) |
| Unit & Integration Tests | `npm test` | 100% pass across all test suites |
| Unified Review Gate | `npm run review antigravity-harness-v2` | `Verdict: APPROVED` |
