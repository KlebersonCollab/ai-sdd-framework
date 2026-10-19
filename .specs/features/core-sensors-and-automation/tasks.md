# Task List: Core Sensors Robustness & Automation Tooling

## Sequence Guidelines (MetaGPT SOP)
- **Strict Sequential Order**: Tasks must be executed top-to-bottom without reordering or cherry-picking.
- **Atomic File Boundaries**: Each task must modify at most 1–3 specific target files.
- **Decoupled Test Setup**: Test harness (`Type: test`) MUST precede implementation tasks (`Type: feat`).
- **Sensor Evidence Gate**: Mark complete `[x]` ONLY after passing build, lint, and test sensors with recorded evidence.

## Implementation Tasks

| Status | ID | Type | Description | Target Files | Dependencies | Evidence |
|---|---|---|---|---|---|---|
| [x] | TASK-01 | test | Scaffold unit & integration tests for sensors, hooks, and automation scripts | `tests/core-sensors-automation.test.js` | None | Scaffolded 7 test cases in tests/core-sensors-automation.test.js |
| [x] | TASK-02 | feat | Enhance verify-sdd-integrity.js with --bootstrap mode and DAG dependency cycle validation | `.agents/scripts/verify-sdd-integrity.js` | TASK-01 | Added bootstrap option and DFS-based validateTaskDependencies DAG sensor |
| [x] | TASK-03 | feat | Enhance check-spec-drift.js with working tree inspection, dot-slash normalization, and glob matching | `.agents/scripts/check-spec-drift.js` | TASK-01 | Added --working-tree mode, porcelain regex parser, path normalization, and glob matching |
| [x] | TASK-04 | feat | Enhance install-hooks.js with worktree git path detection and dual-sensor pre-commit execution | `.agents/scripts/install-hooks.js` | TASK-01 | Implemented git rev-parse --git-path hooks and dual-sensor (verify-sdd + check-drift) hook script |
| [x] | TASK-05 | feat | Implement auto-discover.js for deterministic manifest scanning and codebase specs generation | `.agents/scripts/auto-discover.js` | TASK-01 | Implemented auto-discover.js with multi-ecosystem manifest parsing and markdown generators |
| [x] | TASK-06 | feat | Implement create-feature.js for canonical spec scaffolding (plan, spec, tasks) | `.agents/scripts/create-feature.js` | TASK-01 | Implemented create-feature.js scaffolding with valid 7-column SOP tasks and BDD templates |
| [x] | TASK-07 | feat | Implement run-sdd-review.js for unified sensor execution and Verification Report generation | `.agents/scripts/run-sdd-review.js` | TASK-01, TASK-02, TASK-03 | Implemented automated Reviewer runner generating markdown verification reports |
| [x] | TASK-08 | docs | Record ADR 0006, wire package.json scripts, and update project STATE.md | `.specs/project/ADRs/0006-core-sensors-robustness-and-automation-tooling.md`, `package.json`, `.specs/project/STATE.md` | TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07 | Recorded ADR 0006, added package scripts, and updated STATE.md |
| [x] | TASK-09 | review | Execute full test suite, verify spec drift invariance, and generate formal Verification Report | `tests/`, `.specs/project/STATE.md` | TASK-08 | 29/29 tests pass (100%), 0 drift, formal Verification Report APPROVED |

## Schema Dictionary
- **Status**: `[ ]` (Pending) | `[x]` (Verified Complete).
- **ID**: `TASK-01` through `TASK-09`.
- **Type**: `test` | `feat` | `docs` | `review`.
- **Target Files**: Concrete relative file paths.
- **Dependencies**: Comma-separated preceding task IDs.
- **Evidence**: Commit hash (`git rev-parse --short HEAD`) + sensor output snippet.
