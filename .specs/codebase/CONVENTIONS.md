# Code Conventions & Idioms

## Naming Standards
- Governance Scripts: `kebab-case.js`
- Architecture & Project Artifacts: `UPPERCASE.md` (e.g. `STACK.md`, `CONTEXT.md`)
- Feature Specifications: `plan.md`, `spec.md`, `tasks.md` in kebab-case feature folders
- Task Identifiers: `TASK-01`, `TASK-02`, ...
- Requirements & ACs: `FR-XX`, `BR-XX`, `AC-XX`

## Task Schema Contract (MetaGPT SOP)
- Strict 7-column table: Status | ID | Type | Description | Target Files | Dependencies | Evidence

## Quality Invariants
- Zero shortcuts, stubs, or placeholder implementations.
- Surgical contiguous block edits over whole-file rewrites.
