# Plan: Multi-Tenant and Namespace Segregation in Memory Graph (sec-02-memory-namespace)

## 1. Problem Statement & Motivation
The `sdd-memory` skill currently operates on a flat `.agents/memory/memory_graph.jsonl` file with all interactions attributed to a monolithic `default_user`. In multi-developer, multi-agent, or corporate shared environments, this leads to Cross-Session Context Pollution / Leakage, where user-specific preferences, episodic state, and private profile context are exposed globally across the repository.

## 2. Scope & Boundaries
- **In Scope**:
  - Update `sdd-memory/SKILL.md` to introduce explicit `namespace` and `tenantId` fields in JSONL schemas (`entity`, `relation`, `observation`).
  - Define clear operational protocols for shared vs. private context (e.g., project-level architecture vs. operator-level preferences).
  - Provide partitioned file storage patterns (`.agents/memory/tenants/<tenant>/` and local user session files `memory_graph.<user>.local.jsonl`).
  - Document query filtering and update protocols to enforce tenant and namespace boundaries.
- **Out of Scope**:
  - Implementing an external database (SQLite/Postgres) — storage remains lightweight file-based JSONL.

## 3. High-Level Approach
1. Enhance the identification phase in `sdd-memory` to determine `tenantId` and `namespace`.
2. Expand JSONL schemas to incorporate `namespace` (default: `"global"` / `"project"`) and optional `tenantId`.
3. Provide guidelines for partitioning private or user-specific records into local session files or tenant directories.
4. Update write and query instructions with boundary filtering.

## 4. Dependencies & Prerequisites
- Existing `.agents/skills/sdd-memory/SKILL.md`.
- `.gitignore` (already configured to ignore `*.local.jsonl`).

## 5. Architectural Decision Records (ADRs)
- Not required (backward-compatible schema extension).
