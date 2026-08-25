---
name: sdd-memory
version: 1.1.0
description: "Memory manager for Spec Driven Development. Manages persistent long-term memory graph (entities, relations, observations) across sessions in .agents/memory/memory_graph.jsonl."
last_update: "2026-08-25"
category: project-codebase-memory
keywords: ["sdd", "memory", "sdd-memory", "knowledge-graph", "spec-driven-development", "context-retention", "long-term-memory"]
---

Follow these steps strictly for each interaction:

1. User & Project Identification
   - Assume the default interaction is with `default_user` unless explicit context proves otherwise.
   - Proactively identify the current project scope, repository name, and target specification standards (SDD).

2. Memory Retrieval
   - Immediately reconstruct the active state of the codebase and user preferences by reading the memory artifact at `.agents/memory/memory_graph.jsonl` (one JSON object per line). If the file does not exist yet, treat memory as empty and start fresh. Always refer to this system as your **"memory"**.

3. Information Gathering (What to track)
   While conversing and analyzing code, actively listen for and extract information into two core categories:

   a) Technical & Project Context (SDD)
      - **Architecture & Design:** Structural patterns, boundaries, and dependencies.
      - **Specifications:** Rules, requirements, endpoints, and data models.
      - **Tech Stack:** Frameworks, languages, database versions, and ecosystem constraints.

   b) User Profile Context
      - **Identity & Role:** Job title, technical expertise level, and project permissions.
      - **Preferences:** Coding style, preferred documentation formats, and communication tone.
      - **Goals:** Active tasks, sprint deadlines, and architectural aspirations.

4. Memory Update Rules
   At the end of every interaction, if new insights were uncovered, persist them to the artifact using these atomic principles:
   - **Entities:** Create dedicated nodes for microservices, modules, external integrations, key design patterns, and stakeholders.
   - **Relations:** Connect entities using active-voice verbs (e.g., `COMPLIES_WITH`, `DEPENDS_ON`, `IMPLEMENTS`).
   - **Observations:** Append immutable facts or versioned technical states as observations to specific entities.

---

## Artifact & Memory Graph Operations

> **IMPORTANT — File-based JSONL storage.**
> Memory is maintained directly on disk as a **JSONL artifact**. No external graph databases or third-party graph tools are required.

### Storage location
- All memory is stored as a single append-friendly JSONL file: **`.agents/memory/memory_graph.jsonl`**
- One JSON object per line. Each line is one of three record types: `entity`, `relation`, or `observation`.
- This file is the **single source of truth** for long-term recall.

### Record schemas

**Entity** (one line):
```json
{"type":"entity","name":"string (Entity identifier)","entityType":"string (Type classification)","observations":["string (Associated observations)"],"role":"architecture|user_profile|episodic|rule|decision|preference|project_state|feedback","state":"current|historical|transition","confidence":"high|medium|low|tentative","access_count":0,"last_accessed":"ISO8601|null"}
```

**Relation** (one line):
```json
{"type":"relation","from":"string (Source entity)","to":"string (Target entity)","relationType":"string (Active voice relation)","state":"current|historical|transition","superseded_by":"<relation signature>|null"}
```

**Observation** (append-only note to an existing entity; one line):
```json
{"type":"observation","entityName":"string","contents":["string (New facts to add)"],"state":"current|historical|transition","confidence":"high|medium|low|tentative"}
```

### Write operations (how to perform them as file edits)

- **create_entities** → Append one `entity` line per entity to `.agents/memory/memory_graph.jsonl`.
  Ignore duplicates by checking existing `name` values already present in the file before appending.
- **create_relations** → Append one `relation` line per relation. Skip duplicates (same `from`+`to`+`relationType`).
- **add_observations** → Append one `observation` line referencing an existing entity `name`. If the
  entity does not yet exist, first append its `entity` line, then the `observation` line.
- **supersede** → When a fact changes (user moves, plan revised, decision reversed), NEVER blind-overwrite.
  Instead: (1) update the old record's line to `"state":"historical"`; (2) append the new record with
  `"state":"current"`; (3) link them with a relation `{"type":"relation","from":"<old name>","to":"<new name>","relationType":"SUPERSEDED_BY","state":"historical"}`.

### Read operations (how to perform them)

- **read_graph** → Read `.agents/memory/memory_graph.jsonl` using `view_file` and parse each line as JSON.
- **search_nodes** → Search patterns using `grep_search` or line filtering in `.agents/memory/memory_graph.jsonl`.

### Example artifact content
```jsonl
{"type":"entity","name":"ai-sdd-framework","entityType":"Framework","observations":["Spec Driven Development agent framework","Enforces strict lifecycle: Memory -> Explorer -> Planner -> Executor -> Review"]}
{"type":"entity","name":"specs/","entityType":"Directory","observations":["Houses brownfield codebase maps and active feature specifications"]}
{"type":"relation","from":"ai-sdd-framework","to":"specs/","relationType":"CONTAINS"}
{"type":"observation","entityName":"ai-sdd-framework","contents":["Rules located in .agents/rules/","Skills located in .agents/skills/"]}
```
