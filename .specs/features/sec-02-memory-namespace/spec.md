# Specification: Multi-Tenant and Namespace Segregation in Memory Graph (sec-02-memory-namespace)

## 1. User Stories
- **US-1**: As a developer or AI agent in a multi-user/multi-tenant codebase, I want memory entities and observations scoped to specific namespaces or tenant IDs, so that private user preferences and sensitive session states are not leaked to other operators.

## 2. Acceptance Criteria (BDD)

### AC-1: Schema Extension for Namespace & Tenant
- **Given** the `sdd-memory` specification file `.agents/skills/sdd-memory/SKILL.md`
- **When** the record schemas for `entity`, `relation`, and `observation` are reviewed
- **Then** all three record types must include `namespace` (e.g., `"global"`, `"project"`, `"user:<id>"`, `"tenant:<id>"`) and optional `tenantId`.

### AC-2: Identification & Partitioning Protocol
- **Given** an agent initializing a session via `sdd-memory`
- **When** multi-operator or multi-tenant context is present
- **Then** the skill instructions must guide the agent to separate shared project architecture from user/tenant-scoped data, using partitioned file paths (`.agents/memory/tenants/<tenantId>/` or `*.local.jsonl`) where applicable.

### AC-3: Backward Compatibility
- **Given** existing single-user repositories with legacy unpartitioned records
- **When** records omit `namespace`
- **Then** the memory manager treats them as `namespace: "global"` without breaking parse or graph traversal.

## 3. Verification Sensors
| Sensor | Command / Target | Success Threshold |
|---|---|---|
| Sensor-1 (Schema Validation) | Verify JSON schemas in `SKILL.md` for `namespace` and `tenantId` | Present in entity, relation, and observation definitions |
| Sensor-2 (Partitioning Instructions) | Verify multi-user/tenant isolation guidelines in `SKILL.md` | Clear instructions for partitioned storage & filtering |
| Sensor-3 (Markdown & Format Integrity) | Verify `SKILL.md` frontmatter & syntax | Clean markdown, valid YAML frontmatter |

## 4. UI & Design System Tokens
- Not applicable.
