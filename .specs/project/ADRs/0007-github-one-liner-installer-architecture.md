# ADR 0007: GitHub One-Liner Installer Architecture & Update-Safe Distribution

## Status
Accepted

## Date
2026-11-02

## Context
Adopting the AI-SDD Framework across existing (brownfield) and new (greenfield) projects previously required manually copying and pasting the `.agents/` directory, `AGENTS.md`, `DESIGN.md`, and rule files. This workflow caused significant friction:
1. **Manual Overhead & Onboarding Friction**: Developers had to navigate folder trees, manually copy assets, and configure hooks and scripts by hand.
2. **Multi-Stack Project Clutter**: In non-Node projects (Python, Rust, Go, Java, C#), manual pasting created ambiguity around what was engine code versus project code.
3. **Update Drift & Maintenance Friction**: Downstream projects could not receive framework enhancements, sensor bugfixes, or Cockpit updates without manual directory diffing and re-copying.

## Decision
We adopt a **Zero-Dependency One-Liner Installer Architecture** distributed directly from GitHub:

1. **Dual-Platform Shell Launchers**:
   - `setup.ps1` for Windows PowerShell (`irm ... | iex`).
   - `setup.sh` for POSIX environments (`curl -fsSL ... | bash`).

2. **Native GitHub Archive Ingestion**:
   - Downloads the latest branch or release zipball from `https://github.com/KlebersonCollab/ai-sdd-framework/archive/refs/heads/main.zip` directly into a temporary folder using platform standard utilities (`Invoke-WebRequest` / `curl` / `wget`).
   - Extracts runtime files using native platform tools (`Expand-Archive` / `unzip` / `python3 -m zipfile`).

3. **Selective Runtime Extraction**:
   - Copies runtime governance assets: `.agents/` (scripts, rules, skills, and pre-compiled `.agents/dashboard/dist/`), `AGENTS.md`, `DESIGN.md`, and agent directives (`.cursorrules`, `.windsurfrules`, `.clinerules`, `.github/copilot-instructions.md`).
   - Omits framework internal development artifacts (`node_modules/`, `packages/dashboard/src/`, internal test files, docs, git metadata).

4. **Update-Safe & Preservation Invariance**:
   - The installer is fully idempotent. If `.specs/` or `.agents/memory/memory_graph.jsonl` exist in the target project, they are strictly protected and never overwritten. Users can run the installer repeatedly to upgrade the framework without losing business specifications or memory.

5. **Intelligent Greenfield & Brownfield Bootstrapping**:
   - Automatically executes `git init` if `.git` is absent.
   - If existing project manifests (`package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, etc.) are detected, triggers `node .agents/scripts/auto-discover.js` to map the codebase.
   - If clean greenfield, triggers `node .agents/scripts/verify-sdd-integrity.js --bootstrap`.
   - Installs pre-commit drift and integrity hooks via `node .agents/scripts/install-hooks.js`.

## Consequences
### Positive
- **Single-Command Onboarding**: Bootstraps full SDD governance into any repository in seconds.
- **Zero Host Package Pollution**: Requires zero host npm dependencies.
- **Seamless Upgrades**: Safe re-execution enables instant upstream upgrades.
- **Universal Multi-Agent Support**: Installs canonical rules for Antigravity, Cursor, Windsurf, Cline, and Copilot.

### Trade-offs / Mitigations
- Requires Node.js (v18+) and Git on the host machine. *Mitigation*: Node.js and Git are industry standards; framework sensors execute in <70ms with zero host npm dependencies.
