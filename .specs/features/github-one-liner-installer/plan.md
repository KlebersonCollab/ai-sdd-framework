# Plan: GitHub One-Liner Installer & Quickstart Docs

## 1. Problem Statement & Motivation
Adopting the AI-SDD Framework across existing (brownfield) and new (greenfield) projects previously required manually copying and pasting the `.agents/` folder, `AGENTS.md`, and assorted markdown files into the project root. This manual workflow introduces critical friction:
- **High cognitive load and friction**: Developers must remember which folders and files to copy and how to wire scripts and hooks.
- **Multi-stack repo pollution**: For non-Node projects (Python, Go, Rust, Java, C#), manual pasting causes confusion and inconsistent setups.
- **Update drift**: As the core framework runtime, sensors, and Cockpit evolve, downstream projects have no straightforward mechanism to pull updates without manual folder diffs.

## 2. Scope & Boundaries
- **In Scope**:
  - `setup.ps1`: Native PowerShell one-liner installer for Windows (`irm ... | iex`).
  - `setup.sh`: Native Bash one-liner installer for Linux, macOS, WSL, and Git Bash (`curl ... | bash`).
  - Remote archive fetching directly from GitHub (`KlebersonCollab/ai-sdd-framework/archive/refs/heads/main.zip`).
  - Selective extraction of core governance runtime (`.agents/`, `AGENTS.md`, `DESIGN.md`, `.cursorrules`, `.windsurfrules`, `.clinerules`) without framework development artifacts (`node_modules`, `packages/dashboard/src`, internal tests).
  - Idempotent and update-safe behavior (never overwrite existing `.specs/` or `memory_graph.jsonl`).
  - Automatic detection: Git init if `.git` is absent, `auto-discover.js` if brownfield manifests exist, or `verify-sdd-integrity.js --bootstrap` for greenfield.
  - Automatic installation of git pre-commit hooks via `install-hooks.js`.
  - Comprehensive automated tests in `tests/installer.test.js`.
  - Detailed Quickstart documentation in `README.md` with explicit workflows for new and existing projects.
  - ADR 0007 documenting the installer architecture.
- **Out of Scope**:
  - Publishing packages to the public npm registry (distribution is 100% GitHub-native).
  - External package manager dependencies in host projects.

## 3. High-Level Approach
1. Provide single-line installation commands that fetch the latest release/branch zip from GitHub to a temporary directory.
2. Unpack runtime governance files into the current working directory (`process.cwd()`).
3. If `.specs/` or `memory_graph.jsonl` exist in the target directory, leave them untouched to preserve project context.
4. Execute platform-appropriate initialization: `git init` if needed, `auto-discover.js` for brownfield codebases, `verify-sdd-integrity.js --bootstrap` for greenfield codebases, and `install-hooks.js`.
5. Clean up temporary archives and output actionable confirmation messages.

## 4. Dependencies & Prerequisites
- Node.js (v18+) installed on the host system to run the framework's native zero-dependency scripts.
- Git installed on the host system.

## 5. Architectural Decision Records (ADRs)
- Recorded in `.specs/project/ADRs/0007-github-one-liner-installer-architecture.md`.
