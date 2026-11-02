# Task List: GitHub One-Liner Installer & Quickstart Docs — MetaGPT SOP Schema Contract

## Sequence Guidelines (MetaGPT SOP)
- **Strict Sequential Order**: Tasks must be executed top-to-bottom without reordering or cherry-picking.
- **Atomic File Boundaries**: Each task must modify at most 1–3 specific target files.
- **Decoupled Test Setup**: Test harness (`Type: test`) MUST precede implementation tasks (`Type: feat`).
- **Sensor Evidence Gate**: Mark complete `[x]` ONLY after passing build, lint, and test sensors with recorded evidence.

## Implementation Tasks

| Status | ID | Type | Description | Target Files | Dependencies | Evidence |
|---|---|---|---|---|---|---|
| [x] | TASK-01 | test | Create automated installer test suite covering script existence, syntax, zip extraction logic, and update-safety invariants | `tests/installer.test.js` | None | Scaffolded 4 unit & integration test cases in tests/installer.test.js |
| [x] | TASK-02 | feat | Implement Windows PowerShell one-liner installer with selective extraction, auto-discover fallback, and update safety | `setup.ps1` | TASK-01 | Implemented setup.ps1 with archive fetch, update-safe preservation, auto-discover, and hook installation |
| [x] | TASK-03 | feat | Implement POSIX Bash one-liner installer with curl/wget, unzip fallback, auto-discover, and hook installation | `setup.sh` | TASK-02 | Implemented setup.sh with curl/wget, unzip fallback, update-safe logic, and hook install |
| [x] | TASK-04 | feat | Wire `tests/installer.test.js` into package.json test script and verify all unit/integration tests pass | `package.json`, `tests/installer.test.js` | TASK-03 | Wired tests/installer.test.js; 33/33 tests passing across 4 suites |
| [x] | TASK-05 | docs | Author ADR 0007 documenting the one-liner GitHub installer architecture and update project state | `.specs/project/ADRs/0007-github-one-liner-installer-architecture.md`, `.specs/project/STATE.md` | TASK-04 | Authored ADR 0007 and updated STATE.md decisions log and session status |
| [x] | TASK-06 | docs | Update README.md with comprehensive, user-friendly Quickstart instructions for greenfield, brownfield, and update workflows | `README.md` | TASK-05 | Updated README with one-liner commands, greenfield/brownfield workflows, update-safe invariance |
| [x] | TASK-07 | review | Execute unified SDD Review sensor gate and verify zero spec drift and test immutability | `.specs/features/github-one-liner-installer/tasks.md` | TASK-06 | SDD Review Runner passed; Verdict: APPROVED (0 drift, 33/33 tests) |

## Schema Dictionary
- **Status**: `[ ]` (Pending) | `[x]` (Verified Complete).
- **ID**: `TASK-01`, `TASK-02`, etc.
- **Type**: `test` | `feat` | `fix` | `refactor` | `docs` | `review`.
- **Target Files**: Concrete relative file paths.
- **Dependencies**: Comma-separated preceding task IDs or `None`.
- **Evidence**: Commit hash (`git rev-parse --short HEAD`) + sensor output snippet.
