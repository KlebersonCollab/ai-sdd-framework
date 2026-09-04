# Technology Stack

## Core Language & Runtime
- **Language / Runtime**: Node.js (>= 18 LTS) — Standard Library CommonJS
- **Document Formats**: Markdown (GitHub Flavored), JSON Lines (.jsonl), YAML frontmatter
- **Package Manager**: Zero-dependency architecture (pure native standard library)

## Dependencies
- **Production**: Zero runtime dependencies (native fs, path, child_process)
- **Development & Tooling**: Git version control, 13+ AI Agent Harness Bridges

## Testing & Sensor Infrastructure
- **Spec Drift Sensor**: `node .agents/scripts/check-spec-drift.js`
- **Memory Compactor & Linter**: `node .agents/scripts/compact-memory.js`
- **Pre-commit Hook Installer**: `node .agents/scripts/install-hooks.js`
