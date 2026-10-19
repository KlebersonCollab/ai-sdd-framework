# Specification: Core Sensors Robustness & Automation Tooling

## 1. User Stories
- **US-1**: As an AI Agent or Developer booting a new project, I want `verify-sdd-integrity.js --bootstrap` to succeed without fatal exits when specs are not yet created, so that the Auto-Discovery protocol can proceed smoothly.
- **US-2**: As an SDD Reviewer or Developer, I want `check-spec-drift.js` to inspect working tree changes (even if unstaged) and normalize paths with `./` and globs, so that uncommitted drifts are caught during active authoring.
- **US-3**: As a DevOps Engineer using git worktrees, I want `install-hooks.js` to detect git paths dynamically via `git rev-parse` and install a dual-sensor pre-commit hook (`verify-sdd` + `check-drift`).
- **US-4**: As an AI Agent in Phase 1 (Explorer), I want `auto-discover.js` to deterministically scan package manifests and directory layouts to generate brownfield `.specs/codebase/` maps without burning LLM inference tokens.
- **US-5**: As an AI Agent in Phase 2 (Planner), I want `create-feature.js <feature-id> --title "Title"` to scaffold `plan.md`, `spec.md`, and `tasks.md` with valid MetaGPT 7-column tables and Given/When/Then contracts.
- **US-6**: As an AI Agent in Phase 4 (Reviewer), I want `run-sdd-review.js <feature-id>` to run all automated sensors, detect test assertion tampering, and output a formatted Verification Report Markdown table ready for review sign-off.

## 2. Business Rules & Invariants
- **BR-1**: In canonical mode (no `--bootstrap`), `verify-sdd-integrity.js` MUST exit with code 1 if any of the 11 required core files are missing.
- **BR-2**: In bootstrap mode (`--bootstrap`), `verify-sdd-integrity.js` MUST NOT exit with code 1 for missing `.specs/` files, but MUST warn and list missing files as initialization targets.
- **BR-3**: `verify-sdd-integrity.js` MUST validate that all task dependencies declared in `tasks.md` exist and form a Directed Acyclic Graph (DAG) with zero circular dependencies.
- **BR-4**: `check-spec-drift.js` MUST evaluate unstaged working tree modifications when `--working-tree` is provided or when `git diff --cached` is empty.
- **BR-5**: `install-hooks.js` MUST use `git rev-parse --git-path hooks` to support standard repositories, submodules, and git worktrees.
- **BR-6**: All automation scripts MUST remain 100% zero-dependency (native Node.js CommonJS stdlib only).

## 3. Acceptance Criteria (BDD)

### Happy Path (Success Scenarios)
- **AC-1: Bootstrap Verification Pass**
  - **Given** a directory structure where `.specs/project/` or `.specs/codebase/` files are absent
  - **When** executing `node .agents/scripts/verify-sdd-integrity.js --bootstrap`
  - **Then** the process exits with code 0 and outputs an informational message indicating bootstrap mode.

- **AC-2: Working Tree Drift Detection**
  - **Given** an unstaged modified production file not declared in any active `tasks.md`
  - **When** executing `node .agents/scripts/check-spec-drift.js --working-tree`
  - **Then** the sensor exits with code 1 and lists the undeclared file as a spec drift violation.

- **AC-3: Worktree-Aware Hook Installation**
  - **Given** a git repository or worktree environment
  - **When** executing `node .agents/scripts/install-hooks.js`
  - **Then** the pre-commit hook file is created at the correct hooks path and executes both `verify-sdd-integrity.js` and `check-spec-drift.js`.

- **AC-4: Deterministic Brownfield Auto-Discovery**
  - **Given** a repository with a `package.json` defining dependencies and scripts
  - **When** executing `node .agents/scripts/auto-discover.js --dry-run` or with target directory
  - **Then** it accurately detects Node.js, dependencies, scripts, and produces structured markdown definitions for `STACK.md` and `ARCHITECTURE.md`.

- **AC-5: Feature Scaffolding Generation**
  - **Given** a feature ID `test-feature`
  - **When** executing `node .agents/scripts/create-feature.js test-feature --title "Test Feature"`
  - **Then** files `.specs/features/test-feature/plan.md`, `spec.md`, and `tasks.md` are created adhering to the 7-column schema.

- **AC-6: Unified Reviewer Runner Execution**
  - **Given** an active feature ID
  - **When** executing `node .agents/scripts/run-sdd-review.js <feature-id>`
  - **Then** it runs all 4 hard sensors, checks test diffs, and prints a structured markdown Verification Report.

### Input & Validation Scenarios
- **AC-7: Missing Feature ID in Scaffolder**
  - **Given** no feature ID argument passed to `create-feature.js`
  - **When** the script is executed
  - **Then** it exits with code 1 and prints usage instructions.

- **AC-8: Circular Dependency in Tasks Table**
  - **Given** a `tasks.md` where `TASK-01` depends on `TASK-02` and `TASK-02` depends on `TASK-01`
  - **When** running `verify-sdd-integrity.js`
  - **Then** it detects the circular dependency cycle and reports a schema error.

### Edge Cases & Exceptions (Resilience)
- **AC-9: Path Normalization with Leading Dot-Slash**
  - **Given** a `tasks.md` declaring `./src/index.ts`
  - **When** git reports `src/index.ts`
  - **Then** `check-spec-drift.js` normalizes both paths and treats them as matching.

## 4. Test Data & Boundary Matrix
| Parameter / Field | Valid Inputs (Happy) | Invalid / Boundary Inputs (Edge) |
|---|---|---|
| `--bootstrap` | Flag present (`process.argv`) | Missing flag in canonical audit |
| `tasks.md` Dependencies | `"TASK-01"`, `"TASK-01, TASK-02"`, `"None"` | Non-existent ID `"TASK-99"`, Self-reference `"TASK-01"`, Cycle `01->02->01` |
| Feature ID | `"auth-jwt"`, `"core-sensors-and-automation"` | `""`, `"Invalid/Slash"`, `"UPPERCASE_WITH_SPACES"` |
| Target Files | `"src/index.ts"`, `"./src/index.ts"`, `"`src/index.ts`"` | `""`, malformed table rows |

## 5. Verification Sensors
| Sensor | Command / Target | Success Threshold |
|---|---|---|
| Unit & Integration Tests | `node tests/core-sensors-automation.test.js` | 100% pass |
| Full Test Suite | `npm test` | 100% pass (all suites green) |
| SDD Integrity Sensor | `node .agents/scripts/verify-sdd-integrity.js` | 0 violations (code 0) |
| Spec Drift Sensor | `node .agents/scripts/check-spec-drift.js` | 0 drifting files (code 0) |
