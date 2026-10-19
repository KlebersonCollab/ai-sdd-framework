# Plan: Core Sensors Robustness & Automation Tooling

## 1. Problem Statement & Motivation
The AI-SDD Framework core runtime relies on strict sensors (`verify-sdd-integrity.js` and `check-spec-drift.js`) and git hooks (`install-hooks.js`). However, several critical operational friction points exist:
1. **Bootstrap Deadlock**: Running `verify-sdd-integrity.js` in a freshly installed repository fails immediately with exit code 1 because canonical `.specs/` files do not exist yet, preventing agents from reaching the Auto-Discovery stage.
2. **Spec Drift Sensor Blindspot**: `check-spec-drift.js` only checks staged files (`git diff --cached`). If run during active development without staging, it returns a false-positive success. Furthermore, it lacks path normalization for `./` prefixes and glob support.
3. **Fragile Git Hook Installation**: `install-hooks.js` assumes `.git` is always a directory, which fails in git worktrees and submodules where `.git` is a reference file. Additionally, the pre-commit hook only verifies spec drift, leaving SDD structural integrity unvalidated.
4. **Token-Heavy Manual Tasks**: Agents spend significant token budget running exploratory commands to identify project stacks, author boilerplate feature specifications, and run multi-sensor review checklists. Deterministic CLI automation scripts will save >70% of setup tokens.

## 2. Scope & Boundaries
- **In Scope (Phases 2 & 3)**:
  - **Phase 2 (Sensor & Hook Robustness)**:
    - Update `verify-sdd-integrity.js` to support `--bootstrap` mode and DAG dependency validation in `tasks.md`.
    - Update `check-spec-drift.js` to support working tree checks (`--working-tree` or auto-fallback when staging is empty), path normalization (`./`), and glob matching.
    - Update `install-hooks.js` to use `git rev-parse --git-path hooks` for worktree compatibility, and install a composite hook running both integrity and drift sensors.
  - **Phase 3 (Productivity Automation Tooling)**:
    - Create `.agents/scripts/auto-discover.js` for deterministic, zero-token brownfield discovery and specs population.
    - Create `.agents/scripts/create-feature.js` for automated scaffolding of `.specs/features/<feature-id>/` (`plan.md`, `spec.md`, `tasks.md`).
    - Create `.agents/scripts/run-sdd-review.js` for unified 5-stage sensor auditing and automatic Verification Report generation.
    - Expose script entries in `package.json` (`npm run auto-discover`, `npm run create-feature`, `npm run review`).
    - Add comprehensive automated integration tests in `tests/core-sensors-automation.test.js`.
    - Document ADR 0006 capturing these architectural invariants.
- **Out of Scope**:
  - CI/CD workflow YAML authoring (reserved for Phase 4).
  - Populating `.specs/knowledge/` patterns and anti-patterns (reserved for Phase 4).
  - Refactoring Cockpit Vue 3 components.

## 3. High-Level Approach
All scripts remain **100% zero-dependency**, utilizing exclusively Node.js standard libraries (`fs`, `path`, `child_process`). We follow the strict SDD lifecycle:
1. Author formal planning and BDD specifications under `.specs/features/core-sensors-and-automation/`.
2. Record ADR 0006 in `.specs/project/ADRs/0006-core-sensors-robustness-and-automation-tooling.md`.
3. Implement test harness in `tests/core-sensors-automation.test.js` asserting all new behaviors and edge cases.
4. Incrementally implement each script and sensor improvement following TDD.
5. Run full regression suite (`npm test`) and audit via `sdd-review`.

## 4. Dependencies & Prerequisites
- Node.js LTS (>= 18.0.0).
- Git version control.
- Existing core sensors in `.agents/scripts/`.

## 5. Architectural Decision Records (ADRs)
- Recorded as [ADR 0006: Core Sensors Robustness and Automation Tooling](file:///F:/Projetos/ai-sdd-framework/.specs/project/ADRs/0006-core-sensors-robustness-and-automation-tooling.md).
