# Pattern: Zero Host Pollution

## Context & Problem
When integrating Spec-Driven Development (SDD) tooling into a host project (which may be a Python, Go, Rust, or Node.js repository), installing third-party npm packages into the host's `package.json` or creating proprietary IDE directories (`.claude/`, `.codex/`) pollutes the repository and causes dependency conflicts.

## Canonical Solution
1. **Standard Library Runtime**: All governance, drift, and review scripts inside `.agents/scripts/` MUST use exclusively native Node.js v18+ built-in modules (`fs`, `path`, `http`, `crypto`, `child_process`).
2. **Pre-Compiled Static Assets**: Any UI bundle (such as the Vue 3 Cockpit in `packages/dashboard`) is pre-compiled into `.agents/dashboard/dist/` and served statically by `serve-dashboard.js`.
3. **Open `.agents/` Directory Standard**: Keep all skills (`.agents/skills/`), rules (`.agents/rules/`), hooks (`.agents/hooks.json`), and memory (`.agents/memory/memory_graph.jsonl`) consolidated under `.agents/`.

## Verification Sensor
- Enforced by `detectArchitecturalDivergence` in `.agents/scripts/generate-drift-report.js`.
