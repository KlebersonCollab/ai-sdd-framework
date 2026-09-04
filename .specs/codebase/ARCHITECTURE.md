# System Architecture

## Directory Organization
- `.agents/`: Governance runtime, memory graph, system rules, sensor scripts, and skill definitions.
- `.specs/`: Living specifications partitioned across codebase reality, project vision, active features, and knowledge base.
- Rule Bridges: Root adapter files (AGENTS.md, CLAUDE.md, .cursorrules, .windsurfrules, .clinerules, etc.)

## Architectural Patterns
- **Spec Driven Development (SDD)**: Strict 5-stage lifecycle (Memory -> Explorer -> Planner -> Executor -> Reviewer).
- **File-First Single Source of Truth**: All operational state and memory reside in git-tracked Markdown and JSONL.
- **Sensor-Gated Verification**: Commits and approvals strictly gated by empirical sensor execution.

## Boundary Rules
- Zero external database or cloud service dependencies for core governance.
- Test immutability: tests cannot be weakened or commented out to force a pass.
- Spec drift invariance: all code changes must be mapped to active feature tasks.
