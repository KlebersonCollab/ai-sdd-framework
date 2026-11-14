# Technology Stack

## Core Language & Runtime
- **Language / Runtime**: Node.js (>= 18 LTS) — Standard Library CommonJS
- **Document Formats**: Markdown (GitHub Flavored), JSON Lines (.jsonl), YAML frontmatter
- **Package Manager**: Zero-dependency architecture (pure native standard library)

## Dependencies
- **Production**: Zero runtime dependencies (native fs, path, child_process)
- **Development & Tooling**: Git version control, 13+ AI Agent Harness Bridges

## Testing & Sensor Infrastructure
- **Test Runner**: Node.js Native Test Runner (`node:test` & `node:assert`) — 55 tests across 6 test suites
- **SDD Integrity Sensor**: `node .agents/scripts/verify-sdd-integrity.js`
- **Spec Drift Sensor**: `node .agents/scripts/check-spec-drift.js`
- **Semantic Drift Engine**: `node .agents/scripts/generate-drift-report.js`
- **Goldfish Spec Reviewer**: `node .agents/scripts/run-spec-review.js`
- **Antigravity Lifecycle Hooks**: `.agents/hooks.json` -> `node .agents/scripts/sdd-hook.js`
- **Memory Compactor & Linter**: `node .agents/scripts/compact-memory.js`
- **Pre-commit Hook Installer**: `node .agents/scripts/install-hooks.js`
