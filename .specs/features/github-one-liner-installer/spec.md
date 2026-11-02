# Specification: GitHub One-Liner Installer & Quickstart Docs

## 1. User Stories
- **US-1**: As a developer starting a new project or working on an existing repository, I want to install and initialize the AI-SDD Framework using a single command directly from GitHub, so that I never have to manually copy-paste folders or `.md` files.
- **US-2**: As a developer updating an existing SDD project, I want to run the installer again without losing my domain specifications in `.specs/` or past memory graph records, so that I can stay up to date with new sensors and Cockpit features safely.
- **US-3**: As an open-source user landing on the repository, I want clear, step-by-step instructions in the README explaining how to bootstrap new or existing projects in any language, so that I can adopt the framework with minimal cognitive overhead.

## 2. Business Rules & Invariants
- **BR-1 (Zero External Host Dependencies)**: The host project must not require any npm packages or third-party binaries beyond standard Node.js (v18+) and Git.
- **BR-2 (Preservation Invariance)**: The installer must NEVER overwrite or delete existing `.specs/` content, ADR files, or `.agents/memory/memory_graph.jsonl`.
- **BR-3 (Selective Extraction)**: The installer must only extract runtime governance assets (`.agents/`, `AGENTS.md`, `DESIGN.md`, rule files), and never extract internal development artifacts (such as `node_modules`, `packages/dashboard/src/`, internal test suites).
- **BR-4 (Automatic Git & Sensor Setup)**: If `.git` is absent, the installer must run `git init`. It must also execute `install-hooks.js` to activate the pre-commit sensor gate.
- **BR-5 (Stack Agnosticism)**: If project manifests (e.g., `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`) are detected, the installer must trigger `auto-discover.js` to map the codebase. If none exist, it triggers `verify-sdd-integrity.js --bootstrap`.

## 3. Acceptance Criteria (BDD)

### Happy Path (Success Scenarios)
- **AC-1: Greenfield Initialization via One-Liner**
  - **Given** an empty project directory with Node.js and Git installed
  - **When** the one-liner installer (`setup.ps1` or `setup.sh`) is executed
  - **Then** `.agents/`, `AGENTS.md`, `DESIGN.md`, and agent rule files are placed in the root
  - **And** `git init` is executed if `.git` was absent
  - **And** `verify-sdd-integrity.js --bootstrap` and `install-hooks.js` execute with exit code 0
  - **And** temporary download artifacts are cleaned up.

- **AC-2: Brownfield Discovery via One-Liner**
  - **Given** an existing repository containing code and manifest files (e.g. `package.json` or `pyproject.toml`)
  - **When** the one-liner installer is executed
  - **Then** the framework core files are installed
  - **And** `auto-discover.js` executes, generating `.specs/codebase/` maps and updating `.specs/project/CONTEXT.md`
  - **And** git pre-commit hooks are installed in `.git/hooks/pre-commit`.

- **AC-3: Idempotent Upgrade Safety**
  - **Given** a repository with pre-existing `.specs/features/` and custom `.agents/memory/memory_graph.jsonl` entries
  - **When** the installer is executed again in the same directory
  - **Then** the core scripts and rules in `.agents/` are updated
  - **And** pre-existing `.specs/` files and `memory_graph.jsonl` are completely preserved without loss or overwrite.

### Input & Validation Scenarios
- **AC-4: Custom Branch and Repo URL Override**
  - **Given** user passes custom parameters (e.g. `-Repo "owner/repo"` or `-Branch "feature-branch"` in PowerShell / env vars in Bash)
  - **When** the installer runs
  - **Then** it fetches the archive from the specified repository and branch.

### Edge Cases & Exceptions (Resilience)
- **AC-5: Network Failure or Invalid Archive Handling**
  - **Given** no internet connection or GitHub download failure
  - **When** the installer attempts to download the archive
  - **Then** it terminates with a clear, descriptive error message without corrupting the working tree.

- **AC-6: Missing Unzip Tool Graceful Fallback (POSIX)**
  - **Given** a POSIX environment where `unzip` is not installed
  - **When** `setup.sh` attempts extraction
  - **Then** it falls back to Python `tarfile`/`zipfile` or tar if available, or notifies the user with exact installation steps.

## 4. Test Data & Boundary Matrix
| Parameter / Field | Valid Inputs (Happy) | Invalid / Boundary Inputs (Edge) |
|---|---|---|
| Repository URL / Slug | `KlebersonCollab/ai-sdd-framework` | `invalid/non-existent-repo-999` |
| Branch | `main`, `v1.0.0` | `invalid-branch-name-404` |
| Target Directory | Current directory `.`, empty folder, brownfield repo | Read-only directory |

## 5. Verification Sensors
| Sensor | Command / Target | Success Threshold |
|---|---|---|
| Linter / Syntax | `node --check tests/installer.test.js` | 0 syntax errors |
| Test Suite | `npm test` | 100% passing tests (including `tests/installer.test.js`) |
| SDD Integrity | `node .agents/scripts/verify-sdd-integrity.js` | 100% pass |
| Spec Drift | `node .agents/scripts/check-spec-drift.js --working-tree` | 0 drifted files |
| Review Runner | `node .agents/scripts/run-sdd-review.js github-one-liner-installer` | VERDICT: APPROVED |
