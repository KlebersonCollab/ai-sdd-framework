# Claude Code Guidelines — Spec Driven Development (SDD)

This repository strictly adheres to the **Spec Driven Development (SDD)** lifecycle and AI Agent Governance standard.
Before executing ANY task, analyzing code, or modifying files, you MUST read and comply with the canonical instructions and rules:

## 🏛️ Master Directives & Rules
1. **Master Operating Manual**: [AGENTS.md](AGENTS.md)
2. **Tier 1 Absolute Prohibitions**: [.agents/rules/TIER1_PROHIBITIONS.md](.agents/rules/TIER1_PROHIBITIONS.md) (No shortcuts, no stubs, no unauthorized file deletions/git destruction, strict sequential execution)
3. **Quality & Testing Enforcement**: [.agents/rules/QUALITY_ENFORCEMENT.md](.agents/rules/QUALITY_ENFORCEMENT.md) (No test bypassing, test evidence required)
4. **Token Optimization**: [.agents/rules/TOKEN_OPTIMIZATION.md](.agents/rules/TOKEN_OPTIMIZATION.md)

## 🔄 SDD Mandatory Execution Flow
```text
0. sdd-memory   ──► Load persistent graph (.agents/memory/memory_graph.jsonl)
1. sdd-explorer ──► Brownfield mapping (.specs/codebase/)
2. sdd-planner  ──► Requirements, BDD specs, atomic tasks & ADRs (.specs/features/<id>/, .specs/project/)
3. sdd-executor ──► Atomic TDD implementation, sensor logs & task evidence
4. sdd-review   ──► Sensor audit, acceptance criteria verification & formal verdict
```

## ⚠️ Hard Rules for Claude Code
- **Never guess**: Search and research before proposing code changes.
- **Never write stubs or TODOs**: Implement every function, edge case, and error path completely (Prohibition 1).
- **Never blind-overwrite files**: Use surgical chunk replacements (`replace_file_content`) and windowed line slices (Prohibition 8 - SWE-agent ACI).
- **Never weaken test assertions**: Fix production code to pass tests, never alter tests to mask defects (Prohibition 9 - AgentCoder).
- **Never commit with Spec Drift**: Ensure all modified files are mapped in `.specs/features/<id>/tasks.md` and pass `check-spec-drift.js`.
- **Never skip or modify specs during execution**: If complexity drift occurs (>3 files or high-risk path), pause and replan.
- **Follow Design System**: All UI/Frontend work must strictly follow [DESIGN.md](DESIGN.md) tokens.
