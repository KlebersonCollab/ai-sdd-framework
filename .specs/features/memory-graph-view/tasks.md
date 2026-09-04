# Task List: Memory Graph Visualization (Interactive Knowledge Graph)

## Sequence Guidelines (MetaGPT SOP)
- **Strict Sequential Order**: Tasks must be executed top-to-bottom without reordering.
- **Atomic File Boundaries**: Each task modifies at most 1–3 specific target files.
- **Decoupled Test Setup**: Test definition / scaffolding tasks (`Type: test`) MUST precede implementation tasks (`Type: feat`).
- **Sensor Evidence Gate**: Mark complete `[x]` ONLY after passing test sensors with recorded commit/test evidence.

## Implementation Tasks

| Status | ID | Type | Description | Target Files | Dependencies | Evidence |
|---|---|---|---|---|---|---|
| [ ] | TASK-01 | test | Add unit test assertions for parseMemoryGraph and GET /api/memory endpoint in serve-dashboard.test.js | `tests/serve-dashboard.test.js` | None | |
| [ ] | TASK-02 | feat | Implement parseMemoryGraph() in serve-dashboard.js extracting nodes, edges, observations, and inferred entities | `.agents/scripts/serve-dashboard.js` | TASK-01 | |
| [ ] | TASK-03 | feat | Expose GET /api/memory REST endpoint and expand fs.watch to monitor .agents/memory/ in serve-dashboard.js | `.agents/scripts/serve-dashboard.js` | TASK-02 | |
| [ ] | TASK-04 | feat | Add top navbar tabs ([Specifications] / [Memory Graph]), vis-network CDN, and graph canvas to dashboard template | `.agents/scripts/serve-dashboard.js` | TASK-03 | |
| [ ] | TASK-05 | feat | Implement interactive Neo4j-style side inspector drawer displaying node details and observations | `.agents/scripts/serve-dashboard.js` | TASK-04 | |
| [ ] | TASK-06 | review | Run full sensor audit (tests, drift, memory) for memory graph visualization | `tests/serve-dashboard.test.js`, `.agents/scripts/serve-dashboard.js` | TASK-05 | |

## Schema Dictionary
- **Status**: `[ ]` (Pending) | `[x]` (Verified Complete).
- **ID**: Sequential traceable identifier (`TASK-01` to `TASK-06`).
- **Type**: `test` | `feat` | `docs` | `review`.
- **Target Files**: Concrete relative file paths.
- **Dependencies**: Explicit predecessor IDs or `None`.
- **Evidence**: Test sensor execution output.
