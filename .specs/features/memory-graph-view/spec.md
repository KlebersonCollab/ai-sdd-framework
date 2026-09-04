# Specification: Memory Graph Visualization

## 1. User Stories
- **US-1**: As a developer, I want to toggle to a "Memory Graph" tab in the dashboard so that I can visually inspect the persistent memory accumulated by AI agents.
- **US-2**: As a developer, I want entities to appear as interactive circular nodes colored by `entityType` (e.g. framework, feature, service) and relationships as directed labeled edges.
- **US-3**: As a developer, I want to click on any node to open an Inspector drawer showing its role, status, namespace, confidence, connected edges, and all associated observations.
- **US-4**: As a developer, I want the memory graph to automatically reload via Live Sync (SSE) whenever an agent saves new entities or observations to disk.
- **US-5**: As a developer, I want search and filter controls to quickly isolate specific entities or entity types in the graph.

## 2. Business Rules & Invariants
- **BR-1 (Zero Dependencies)**: The server and parser MUST use only Node.js standard library modules. No external `node_modules` may be introduced. Vis-network is loaded via CDN.
- **BR-2 (Read-Only Safety)**: The memory endpoint MUST be strictly read-only (`GET`). It must never modify, append, or truncate `memory_graph.jsonl`.
- **BR-3 (Resilience & Auto-Inference)**: If a relation references an entity that lacks an explicit `type: "entity"` record, the parser MUST automatically synthesize a node with `entityType: "inferred"` so the edge is never dropped.
- **BR-4 (Design System Compliance)**: Styling for canvas background (`#010102`), nodes, inspector drawer (`#0f1011`), badges, and borders MUST conform to `DESIGN.md` Linear Dark tokens.

## 3. Acceptance Criteria (BDD)

### Happy Path (Success Scenarios)
- **AC-1: Memory API Endpoint Response**
  - **Given** `.agents/memory/memory_graph.jsonl` contains valid entities, relations, and observations
  - **When** a client requests `GET /api/memory`
  - **Then** the server responds with HTTP 200 and `Content-Type: application/json`
  - **And** the payload contains `nodes`, `edges`, and `stats` objects.

- **AC-2: Entity Parsing & Observation Aggregation**
  - **Given** an entity with inline observations and separate `type: "observation"` records
  - **When** `parseMemoryGraph()` processes the file
  - **Then** all observations referencing that entity are aggregated into the node's `observations` array.

- **AC-3: Inferred Node Synthesis**
  - **Given** a relation record `{"from": "nodeA", "to": "nodeB"}` where `nodeB` has no entity declaration
  - **When** `parseMemoryGraph()` processes the file
  - **Then** `nodeB` is created with `entityType: "inferred"` and the edge correctly connects `nodeA` to `nodeB`.

- **AC-4: Interactive Graph UI & Inspector Drawer**
  - **Given** the user navigates to the Memory Graph tab
  - **When** the graph loads and a user clicks a node
  - **Then** the side inspector drawer displays the node's details and chronological observations.

### Edge Cases & Exceptions (Resilience)
- **AC-5: Missing or Empty Memory File**
  - **Given** `.agents/memory/memory_graph.jsonl` does not exist or is 0 bytes
  - **When** `GET /api/memory` is requested
  - **Then** the server returns `{ nodes: [], edges: [], stats: { totalNodes: 0, totalEdges: 0 } }` without crashing.

- **AC-6: Live Sync on Memory Persistence**
  - **Given** the dashboard is open with Live Sync connected
  - **When** an agent appends to `.agents/memory/memory_graph.jsonl`
  - **Then** an SSE event is triggered and the memory graph refreshes seamlessly.

## 4. Test Data & Boundary Matrix
| Parameter / Field | Valid Inputs (Happy) | Invalid / Boundary Inputs (Edge) |
|---|---|---|
| Memory file state | Populated `memory_graph.jsonl` | Missing file, empty file, trailing empty lines |
| Relation target | Target entity declared | Target entity undeclared (inferred) |
| Observation content | String `content`, array `contents` | Missing content, empty string |

## 5. Verification Sensors
| Sensor | Command / Target | Success Threshold |
|---|---|---|
| Sensor Test Suite | `node tests/serve-dashboard.test.js` | 100% pass (0 failures) |
| Spec Drift Sensor | `node .agents/scripts/check-spec-drift.js` | 0 unmapped files |
| Memory Compactor | `node .agents/scripts/compact-memory.js` | 0 schema warnings |

## 6. UI & Design System Tokens (DESIGN.md Alignment)
- **Graph Canvas Background**: `#010102`
- **Node Colors by Entity Type**:
  - `framework`: `#5e6ad2` (Lavender)
  - `feature`: `#0ea5e9` (Sky Blue)
  - `service` / `module`: `#d97706` (Amber)
  - `inferred` / `unknown`: `#8a8f98` (Muted Gray)
- **Edge Color**: `rgba(255, 255, 255, 0.2)` with active highlight `#828fff`
- **Inspector Drawer**: `#0f1011` surface with `#23252a` hairline border.
