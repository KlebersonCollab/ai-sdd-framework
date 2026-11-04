# Task List: Canonical EGM Lifecycle, Agent Skills Convention & Semantic Drift Sensor — MetaGPT SOP Schema Contract

## Sequence Guidelines (MetaGPT SOP)
- **Strict Sequential Order**: Tasks must be executed top-to-bottom without reordering or cherry-picking.
- **Atomic File Boundaries**: Each task must modify at most 1–3 specific target files.
- **Decoupled Test Setup**: Test harness (`Type: test`) MUST precede implementation tasks (`Type: feat`).
- **Sensor Evidence Gate**: Mark complete `[x]` ONLY after passing build, lint, and test sensors with recorded evidence.

## Implementation Tasks

| Status | ID | Type | Description | Target Files | Dependencies | Evidence |
|---|---|---|---|---|---|---|
| [x] | TASK-01 | test | Scaffold unit & integration tests covering semantic drift engine, spec review runner, skill manifest integrity, and package script integration | `tests/egm-multi-harness-drift.test.js` | None | Scaffolded 12 BDD test assertions in tests/egm-multi-harness-drift.test.js |
| [x] | TASK-02 | feat | Implement native zero-dependency Semantic Drift Engine classifying discrepancies into 4 categories | `.agents/scripts/generate-drift-report.js` | TASK-01 | Implemented generate-drift-report.js (6/6 tests passing) |
| [x] | TASK-03 | feat | Implement stateless Goldfish Spec Review Runner evaluating pre-code ambiguity and BDD completeness | `.agents/scripts/run-spec-review.js` | TASK-01 | Implemented run-spec-review.js (9/12 tests passing) |
| [x] | TASK-04 | feat | Create canonical Agent Skill following Anthropic Agent Skills open specification | `.agents/skills/sdd-spec-review/SKILL.md` | TASK-01 | Created .agents/skills/sdd-spec-review/SKILL.md (10/12 tests passing) |
| [x] | TASK-05 | feat | Integrate semantic drift engine into unified SDD Review Runner as Stage 6 sensor gate | `.agents/scripts/run-sdd-review.js` | TASK-02 | Integrated semantic drift in run-sdd-review.js (11/12 tests passing) |
| [x] | TASK-06 | feat | Register drift-report and spec-review npm scripts in package.json | `package.json` | TASK-02, TASK-03 | Registered drift-report and spec-review in package.json (46/46 tests passing) |
| [x] | TASK-07 | docs | Update AGENTS.md and sdd-review SKILL.md with 5-phase EGM lifecycle, multi-harness routing matrix, and subagent invocation cheat-sheet | `AGENTS.md`, `.agents/skills/sdd-review/SKILL.md` | TASK-04, TASK-05, TASK-06 | Updated AGENTS.md and sdd-review/SKILL.md (46/46 tests passing) |
| [x] | TASK-08 | review | Audit implementation against BDD acceptance criteria, run all sensors, and compile verification report | `.specs/features/egm-multi-harness-drift/tasks.md` | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07 | Audit passed with VERDICT: APPROVED (5/5 sensors passing, 0 semantic drift) |

## Schema Dictionary
- **Status**: `[ ]` (Pending) | `[x]` (Verified Complete).
- **ID**: `TASK-01`, `TASK-02`, etc.
- **Type**: `test` | `feat` | `fix` | `refactor` | `docs` | `skill` | `review`.
- **Target Files**: Concrete relative file paths (1–3 files per task).
- **Dependencies**: Comma-separated preceding task IDs or `None`.
- **Evidence**: Commit hash (`git rev-parse --short HEAD`) + sensor output snippet.
