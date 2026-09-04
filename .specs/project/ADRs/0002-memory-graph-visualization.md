# ADR 0002: Vis-Network Graph Engine & REST API for Long-Term Memory Visualization

## Status
Accepted

## Date
2026-09-03

## Context
The AI-SDD Framework maintains persistent long-term memory in `.agents/memory/memory_graph.jsonl` containing `entity`, `relation`, and `observation` records across development sessions (MemGPT / TiM protocol).
Developers and operators need an interactive visual tool to explore the memory graph, inspect relationships, examine entity observations, and observe real-time agent memory ingestion.

We evaluated three visualization approaches:
1. **Vis-Network (vis.js) via CDN with Native Node.js Parser**: Interactive physics-based canvas graph with zero npm dependencies and side inspector panel.
2. **Heavy SPA Graph Library (e.g. Cytoscape / React-Flow + Webpack/Vite)**: Requires node_modules and build pipelines.
3. **Static SVG Graph Generator (Graphviz/Mermaid only)**: Non-interactive, rigid layout without physics or node drill-down.

## Decision
We chose **Option 1: Vis-Network via CDN with Native Node.js Parser (`GET /api/memory`)** integrated into the existing unified Specs Dashboard (`.agents/scripts/serve-dashboard.js`).

### Key Architectural Choices:
- **Zero New Dependencies**: Consumes `vis-network.min.js` via CDN, preserving the strict invariant of zero `node_modules`.
- **Unified Dashboard Tabs**: Top navbar navigation toggling between `[📋 Specifications]` and `[🧠 Memory Graph]` without separate servers or port conflicts.
- **REST Endpoint (`GET /api/memory`)**: Reads `.agents/memory/memory_graph.jsonl`, parses entities into graph nodes, relations into directed edges, and aggregates observations into node properties.
- **Resilient Auto-Inference**: If a relation references an entity that has not yet been declared explicitly, the parser infers a placeholder node (`entityType: "inferred"`) to prevent broken edges.
- **Neo4j Bloom-style Inspector Drawer**: Clicking any node opens a right-hand sidebar displaying entity metadata (role, status, confidence, namespace) and all chronological observations.
- **Live Sync Continuity**: The existing `fs.watch` is extended to watch both `.specs/` and `.agents/memory/`, triggering live updates when agents record new memories.
- **Design System Invariance**: Styled strictly using `DESIGN.md` Linear Dark tokens (Canvas `#010102`, Surface `#0f1011`, Accent `#5e6ad2`, Success `#27a644`).

## Consequences
### Positive
- Interactive graph database experience (drag, zoom, physics, inspector).
- Seamless integration with the existing server and watch runtime.
- Real-time updates as agents converse and persist memory.
- Completely adheres to BR-1 (Zero Dependencies) and BR-4 (Linear Dark Design).

### Trade-offs / Mitigations
- Large graphs (>1000 nodes) can stress browser canvas physics (mitigated by physics stabilization timeout and optional hierarchical layout).
