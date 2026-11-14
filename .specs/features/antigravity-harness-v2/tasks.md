# Task List: Antigravity Harness Lifecycle Hooks, Active Drift Scope & Sensors v2 — MetaGPT SOP Schema Contract

## Sequence Guidelines (MetaGPT SOP)
- **Strict Sequential Order**: Tasks must be executed top-to-bottom without reordering or cherry-picking.
- **Atomic File Boundaries**: Each task must modify at most 1–3 specific target files.
- **Decoupled Test Setup**: Test harness (`Type: test`) MUST precede implementation tasks (`Type: feat`).
- **Sensor Evidence Gate**: Mark complete `[x]` ONLY after passing build, lint, and test sensors with recorded evidence.

## Implementation Tasks

| Status | ID | Type | Description | Target Files | Dependencies | Evidence |
|---|---|---|---|---|---|---|
| [x] | TASK-01 | test | Scaffold unit & integration tests for Antigravity hooks, active drift scope, SOP task review, architectural divergence, and knowledge base | `tests/antigravity-harness-v2.test.js` | None | Scaffolded 9 BDD test cases in tests/antigravity-harness-v2.test.js (Red TDD verified) |
| [x] | TASK-02 | feat | Implement Antigravity lifecycle hook runner and .agents/hooks.json configuration for SessionStart, PreToolUse, and Stop | `.agents/scripts/sdd-hook.js`, `.agents/hooks.json` | TASK-01 | Implemented sdd-hook.js and .agents/hooks.json (5/5 hook tests passing) |
| [x] | TASK-03 | feat | Upgrade check-spec-drift.js with activeOnly task scope filtering and completed-feature fallback | `.agents/scripts/check-spec-drift.js` | TASK-01 | Implemented extractTargetsFromTasksMarkdown and activeOnly filtering in check-spec-drift.js (AC-4 passing) |
| [x] | TASK-04 | feat | Upgrade run-spec-review.js with bilingual PT/EN ambiguity lexicon and auditTasksSop validator, and generate-drift-report.js with detectArchitecturalDivergence | `.agents/scripts/run-spec-review.js`, `.agents/scripts/generate-drift-report.js` | TASK-01 | Upgraded run-spec-review.js and generate-drift-report.js (AC-5 and AC-6 passing) |
| [x] | TASK-05 | docs | Populate .specs/knowledge/patterns/ and .specs/knowledge/anti-patterns/ with foundational SDD & Antigravity entries | `.specs/knowledge/patterns/zero-host-pollution.md`, `.specs/knowledge/patterns/antigravity-lifecycle-hooks.md`, `.specs/knowledge/anti-patterns/blind-file-overwrite.md` | TASK-01 | Populated 2 patterns and 1 anti-pattern in .specs/knowledge/ |
| [x] | TASK-06 | docs | Add test-assertion-weakening anti-pattern and synchronize .cursorrules, .windsurfrules, and .clinerules with EGM commands | `.specs/knowledge/anti-patterns/test-assertion-weakening.md`, `.cursorrules`, `.windsurfrules` | TASK-05 | Added test-assertion-weakening.md and synced .cursorrules & .windsurfrules |
| [x] | TASK-07 | feat | Synchronize .clinerules, AGENTS.md, and package.json test suite with antigravity-harness-v2 | `.clinerules`, `AGENTS.md`, `package.json` | TASK-02, TASK-03, TASK-04, TASK-06 | Synced .clinerules, AGENTS.md, and package.json (55/55 tests passing) |
| [x] | TASK-08 | feat | Update setup.ps1, setup.sh, and auto-discover.js to bootstrap .specs/knowledge/ and Antigravity hooks in target projects | `setup.ps1`, `setup.sh`, `.agents/scripts/auto-discover.js` | TASK-07 | Updated setup.ps1, setup.sh, and auto-discover.js with update-safe .specs/knowledge/ seeding |
| [x] | TASK-09 | docs | Synchronize README.md, ROADMAP.md, codebase maps, and re-export docs/index.html | `README.md`, `.specs/project/ROADMAP.md`, `docs/index.html` | TASK-08 | Synced README.md, ROADMAP.md, codebase maps, and exported docs/index.html (167 KB) |
| [x] | TASK-10 | review | Execute full SDD review gate, semantic drift report, and record verification evidence | `.specs/features/antigravity-harness-v2/tasks.md`, `tests/antigravity-harness-v2.test.js` | TASK-08, TASK-09 | Verified 10/10 tasks and 56/56 tests passing with 0 drift |

## Schema Dictionary
- **Status**: `[ ]` (Pending) | `[-]` (In Progress) | `[x]` (Verified Complete).
- **ID**: `TASK-01`, `TASK-02`, etc.
- **Type**: `test` | `feat` | `fix` | `refactor` | `docs` | `review`.
- **Target Files**: Concrete relative file paths (1–3 files per task).
- **Dependencies**: Comma-separated preceding task IDs or `None`.
- **Evidence**: Commit hash (`git rev-parse --short HEAD`) + sensor output snippet.
