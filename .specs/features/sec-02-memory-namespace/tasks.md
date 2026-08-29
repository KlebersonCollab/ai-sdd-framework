# Task List: Multi-Tenant and Namespace Segregation in Memory Graph (sec-02-memory-namespace)

## Sequence Guidelines
- Tasks must be executed in exact sequential order.
- Each task must be atomic (1-2 files changed).
- Mark complete `[x]` ONLY after sensor verification.

## Implementation Tasks

| Status | ID | Description | Target Files | Evidence |
|---|---|---|---|---|
| [x] | TASK-01 | Update `.agents/skills/sdd-memory/SKILL.md` with namespace/tenantId schema fields, partitioned storage rules, and query isolation protocols | `.agents/skills/sdd-memory/SKILL.md` | Schema updated in `SKILL.md` L55-70; storage partition rules added L48-54 |
| [x] | TASK-02 | Validate schema consistency, JSON example correctness, and markdown integrity | `.agents/skills/sdd-memory/SKILL.md` | `SKILL.md` L93-99 validated with valid JSONL examples and backward compatibility rule L89-91 |
