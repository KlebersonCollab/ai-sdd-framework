# ADR 0006: Core Sensors Robustness, Dual-Mode Verification & Productivity Automation Tooling

## Status
Accepted

## Date
2026-10-18

## Context
As the AI-SDD Framework expanded across multiple codebases and agent harnesses, four core operational challenges emerged:
1. **Bootstrap Deadlock in Canonical Integrity**: The SDD Integrity Sensor (`verify-sdd-integrity.js`) enforced presence of all 11 core files, which blocked the Auto-Discovery protocol when initializing a fresh project before `.specs/` was generated.
2. **Spec Drift False-Negative in Working Tree**: `check-spec-drift.js` strictly inspected `git diff --cached` (staged files). During rapid agent development before `git add` was invoked, drift checks returned false-positive passes.
3. **Fragile Pre-commit Installation Across Worktrees**: `install-hooks.js` assumed `.git` was always a folder, failing on git worktrees and submodules where `.git` is a reference file. Furthermore, the pre-commit hook only checked spec drift, omitting integrity sensor verification.
4. **Token-Heavy Manual Boilerplate**: Agents burned thousands of prompt tokens repeatedly inspecting project manifests to deduce tech stacks, scaffolding feature files from scratch, and manually assembling verification report tables.

## Decision
We adopt **Core Sensors Robustness & Productivity Automation Tooling**:

1. **Dual-Mode SDD Integrity Sensor (`verify-sdd-integrity.js`)**:
   - Introduce `--bootstrap` flag.
   - When `--bootstrap` is supplied, absence of `.specs/` files is logged as informational initialization targets rather than triggering fatal exit code 1.
   - Introduce DFS-based Directed Acyclic Graph (DAG) cycle and missing-ID validator (`validateTaskDependencies`) verifying task dependency integrity across all active features.

2. **Working-Tree Aware Spec Drift Sensor (`check-spec-drift.js`)**:
   - Introduce `--working-tree` mode and automatic working-tree fallback when staging is empty.
   - Implement porcelain regex parsing and path normalization (stripping `./` and backslashes).
   - Implement glob matching (e.g. `tests/**/*.test.js`, `src/*.ts`).

3. **Worktree-Resilient Pre-commit Hook (`install-hooks.js`)**:
   - Query `git rev-parse --git-path hooks` to support standard repos, worktrees, and submodules.
   - Install a dual-sensor pre-commit hook enforcing both `verify-sdd-integrity.js` and `check-spec-drift.js`.

4. **Productivity Automation Tooling**:
   - **`auto-discover.js`**: Deterministic manifest scanner (Node.js, Python, Rust, Go) generating `STACK.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `CONCERNS.md`, and `TECHNICAL-MAP.md` with zero LLM inference token consumption.
   - **`create-feature.js`**: Instant scaffolding of `.specs/features/<feature-id>/` (`plan.md`, `spec.md`, `tasks.md`) with valid MetaGPT 7-column schema.
   - **`run-sdd-review.js`**: Automated sensor runner for Reviewer agent executing drift, integrity, and test sensors with git test diff immutability auditing and markdown Verification Report generation.

## Consequences
### Positive
- **Instant Project Bootstrapping**: Eliminates the bootstrap paradox; projects can run integrity validation safely during initialization.
- **Continuous Drift Protection**: Unstaged and staged code modifications are audited reliably.
- **Git Worktree Compatibility**: Hooks install seamlessly across worktrees and submodules.
- **Massive Token Reduction**: Scaffolding, tech stack discovery, and review reporting are executed in <100ms via native Node.js scripts without burning LLM inference tokens.

### Trade-offs / Mitigations
- Pre-commit hook runs two sensors instead of one. *Mitigation*: Both sensors run in <70ms combined, ensuring zero perceptible latency during git commit operations.
