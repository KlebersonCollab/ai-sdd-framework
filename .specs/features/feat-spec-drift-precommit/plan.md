# Feature Plan: Pre-Commit Spec Drift Sensor (Constitutional SDD)

## 1. Executive Summary
Implements automated Spec Drift detection as a local Pre-Commit Hook and Review Sensor. Prevents AI agents and human developers from committing code changes that are not declared in active feature specifications (`.specs/features/<id>/tasks.md`).

## 2. Problem Statement
- Code often drifts from specifications when agents implement ad-hoc modifications, unmapped helper files, or undocumented logic.
- Post-commit CI/CD detection is too late; detecting drift before `git commit` prevents polluted git history and context rot.

## 3. Scope Boundaries
- **In-Scope**:
  - Cross-platform pre-commit sensor script (`.agents/scripts/check-spec-drift.js` and `.sh`).
  - Git pre-commit hook installation script (`.agents/scripts/install-hooks.js`).
  - Upgraded `sdd-review` skill with Pre-Commit Spec Drift audit sensor.
  - Updated `QUALITY_ENFORCEMENT.md` with Spec Drift Invariance.
  - Direct installation into `.git/hooks/pre-commit`.
- **Out-of-Scope**:
  - Cloud CI/CD pipeline triggers (focus is local pre-commit).

## 4. Architectural Strategy
1. Read staged files via `git diff --cached --name-only`.
2. Extract declared `Target Files` across all active `.specs/features/**/tasks.md`.
3. Validate that every staged source file is either: (a) declared in an active feature task, or (b) an exempted governance/documentation file.
4. Abort commit with exit code 1 and actionable remediation instructions if orphaned/drifting files are detected.