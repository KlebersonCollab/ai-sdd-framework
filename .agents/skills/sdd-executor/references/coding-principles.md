# Implementation & Coding Principles

## 1. Safety Valve Protocol
- **Stop & Replan**: If an atomic task unexpectedly touches >3 files, hits legacy risk areas, or requires changing architectural boundaries, PAUSE immediately and request replanning from `sdd-planner`.

## 2. Test-Driven Implementation (TDD)
1. Write a failing test matching the Acceptance Criteria (AC).
2. Run test sensor to observe the failure reason.
3. Write the minimal clean implementation to make the test pass.
4. Refactor if needed while keeping tests green.

## 3. Atomic Commits & Evidence
- Keep commits small, descriptive, and linked to task IDs:
  `feat(auth): validate session token before renewal (TASK-02)`
- Record the commit hash or test sensor output in the `Evidence` column of `tasks.md`.

## 4. Design System Fidelity (UI / Frontend Tasks)
- When implementing UI components, CSS, or templates, load `DESIGN.md`.
- Strictly use defined tokens (colors, typography, spacing, border radii, components). Never hardcode arbitrary visual values.
