# Task List: Specs Dashboard (Visual Documentation & Cascade Viewer)

## Sequence Guidelines (MetaGPT SOP)
- **Strict Sequential Order**: Tasks must be executed top-to-bottom without reordering.
- **Atomic File Boundaries**: Each task modifies at most 1–3 specific target files.
- **Decoupled Test Setup**: Test definition / scaffolding tasks (`Type: test`) MUST precede implementation tasks (`Type: feat`).
- **Sensor Evidence Gate**: Mark complete `[x]` ONLY after passing test sensors with recorded commit/test evidence.

## Implementation Tasks

| Status | ID | Type | Description | Target Files | Dependencies | Evidence |
|---|---|---|---|---|---|---|
| [x] | TASK-01 | test | Create automated sensor test suite validating markdown parser and HTTP server endpoints | `tests/serve-dashboard.test.js` | None | c16a7b4 (Red phase verified: 4 fails) |
| [x] | TASK-02 | feat | Implement Markdown parsing utility in serve-dashboard.js extracting features, US, BDD, and tasks table | `.agents/scripts/serve-dashboard.js` | TASK-01 | b3af876 (Parser: 3/4 tests passed) |
| [x] | TASK-03 | feat | Implement native Node.js HTTP server and REST endpoint /api/features in serve-dashboard.js | `.agents/scripts/serve-dashboard.js` | TASK-02 | 5319dd1 (4/4 passed) |
| [x] | TASK-04 | feat | Build responsive frontend UI template with Bootstrap 5 CDN and DESIGN.md Linear Dark styling | `.agents/scripts/serve-dashboard.js` | TASK-03 | 43c57d6 (4/4 passed) |
| [x] | TASK-05 | docs | Add dashboard launch instructions to README.md, AGENTS.md, and package npm scripts | `README.md`, `AGENTS.md`, `package.json` | TASK-04 | 5d86ad3 (4/4 passed) |
| [x] | TASK-06 | review | Audit acceptance criteria against sensor test suite and verify spec drift compliance | `tests/serve-dashboard.test.js`, `.agents/scripts/serve-dashboard.js` | TASK-05 | tests 4/4 pass, drift 0, memory 0 errors |
| [x] | TASK-07 | test | Add unit test assertions for rich Plan parsing, structured User Stories, and BDD Given/When/Then tokens | `tests/serve-dashboard.test.js` | TASK-06 | c3d9d99 (Red phase: 3 new tests failing) |
| [ ] | TASK-08 | feat | Implement deep parsing for plan.md (problem, in/out scope, approach) and structured User Stories in serve-dashboard.js | `.agents/scripts/serve-dashboard.js` | TASK-07 | |
| [ ] | TASK-09 | feat | Implement structured BDD parser extracting Given, When, Then, And clauses with category tags | `.agents/scripts/serve-dashboard.js` | TASK-08 | |
| [ ] | TASK-10 | feat | Redesign UI to true vertical cascading sections (1. Plan & Scope, 2. US Cards, 3. BDD Gherkin Badges, 4. Tasks) | `.agents/scripts/serve-dashboard.js` | TASK-09 | |
| [ ] | TASK-11 | review | Verify all sensor suites and test immutability for enhanced cascading dashboard | `tests/serve-dashboard.test.js`, `.agents/scripts/serve-dashboard.js` | TASK-10 | |

## Schema Dictionary
- **Status**: `[ ]` (Pending) | `[x]` (Verified Complete).
- **ID**: Sequential traceable identifier (`TASK-01` to `TASK-06`).
- **Type**: `test` | `feat` | `docs` | `review`.
- **Target Files**: Concrete relative file paths.
- **Dependencies**: Explicit predecessor IDs or `None`.
- **Evidence**: Test sensor execution output.
