# Specification: Pre-Commit Spec Drift Detection

## 1. Functional Requirements

### FR-1: Staged File Analysis
- The script MUST inspect all staged files (`git diff --cached --name-only`).
- If no files are staged, fallback to inspecting uncommitted working directory changes.

### FR-2: Spec Coverage Matching
- Parse all `.specs/features/**/tasks.md` files and collect declared file paths from the `Target Files` column.
- Compare modified project implementation files against the collected target paths.

### FR-3: Drift Rejection & Actionable Report
- If any modified file is not mapped in `tasks.md`, reject the commit (exit code 1).
- Print a clear error message: `[SPEC DRIFT DETECTED] File X is not mapped in any active tasks.md. Please update your specification before committing.`

## 2. BDD Acceptance Criteria

```gherkin
Scenario: Staged code matches declared feature tasks
  Given a developer stages file 'src/services/auth.ts'
  And 'src/services/auth.ts' is listed in .specs/features/feat-auth/tasks.md
  When pre-commit hook runs
  Then check-spec-drift passes with exit code 0
  And the commit is allowed

Scenario: Staged code has orphaned modifications (Spec Drift)
  Given a developer stages file 'src/utils/hack.ts'
  And 'src/utils/hack.ts' is NOT listed in any .specs/features/**/tasks.md
  When pre-commit hook runs
  Then check-spec-drift fails with exit code 1
  And the commit is aborted with actionable drift report
```