# Plan: Memory Graph Visualization (Interactive Knowledge Graph)

## 1. Problem Statement & Motivation
The AI-SDD Framework manages long-term memory across sessions in `.agents/memory/memory_graph.jsonl` using the MemGPT / TiM protocol. While this memory is organized as a property graph (entities, relations, observations, namespaces, lifecycle states), human developers currently have to inspect raw JSONL files or terminal output to understand the agent's mental model.

There is no interactive graphical view to:
- Visually explore the knowledge graph and discover relationships between framework components, features, and user preferences.
- Inspect the chronological observations and evidence accumulated for any specific entity.
- Audit real-time memory persistence during live agent pair-programming sessions.

## 2. Scope & Boundaries
- **In Scope**:
  - Backend: REST endpoint `GET /api/memory` in `.agents/scripts/serve-dashboard.js` extracting nodes, edges, observations, and lifecycle statistics.
  - Parsing resilience: Auto-inference of undeclared entities referenced in relations, normalization of observation fields (`content` vs `contents`), and predicate fields (`predicate` vs `relationType`).
  - Live Sync expansion: Extend server file watcher to watch `.agents/memory/` in addition to `.specs/`.
  - Frontend integration: Top navbar tab switcher toggling between `[📋 Specifications]` and `[🧠 Memory Graph]` on the unified dashboard at `http://localhost:3000`.
  - Interactive canvas: Vis-network force-directed physics graph with zoom, pan, drag, node coloring by `entityType`, and edge labels.
  - Side Inspector Drawer (Neo4j Bloom style): Clicking a node opens a slide-over panel displaying entity role, namespace, status, confidence, connected relations, and full observation history.
  - Controls: Search node by name, filter by entity type, and reset/fit camera view.
- **Out of Scope**:
  - Direct browser editing/deletion of memory nodes (Dashboard remains strictly read-only per BR-2).
  - External graph database instances (e.g. Neo4j Bolt, Memgraph).

## 3. High-Level Approach
1. Implement `parseMemoryGraph()` in `.agents/scripts/serve-dashboard.js` parsing `memory_graph.jsonl`.
2. Expose `GET /api/memory` and expand `startFileWatcher()` to monitor `.agents/memory/`.
3. Update the embedded dashboard HTML with vis-network CDN, top navigation tabs, graph canvas, and inspector sidebar.
4. Verify with automated sensor tests in `tests/serve-dashboard.test.js` and ensure zero spec drift.

## 4. Dependencies & Prerequisites
- Native Node.js standard library (`http`, `fs`, `path`, `url`).
- Vis-Network v9.1.9 via CDN (no npm packages).
- Bootstrap 5 and Linear Dark tokens from `DESIGN.md`.

## 5. Architectural Decision Records (ADRs)
- [ADR 0002: Vis-Network Graph Engine & REST API for Long-Term Memory Visualization](../../project/ADRs/0002-memory-graph-visualization.md)
