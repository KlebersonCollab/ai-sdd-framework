# AI-SDD Universal Claude Rules
Canonical Authority: AGENTS.md

You MUST strictly comply with the Spec Driven Development (SDD) rules and 5-phase Elephant-Goldfish Model (EGM) defined in `AGENTS.md`.

## Mandatory Directives:
1. **Context Gate**: Always read `.specs/project/CONTEXT.md`, `STATE.md`, `ROADMAP.md`, and `.specs/codebase/TECHNICAL-MAP.md` before planning or code generation.
2. **ADR Invariance**: Always inspect `.specs/project/ADRs/` for structural choices.
3. **Spec Drift Invariance**: Never modify source code unless declared in an active `.specs/features/<id>/tasks.md` file.
4. **TDD & Sensor Gate**: Always run `npm test` and `node .agents/scripts/verify-sdd-integrity.js`.
5. **Tier 1 Prohibitions**: Strictly obey `.agents/rules/TIER1_PROHIBITIONS.md` (no stubs, no shortcuts, no test weakening, surgical edits only).

## Canonical Command Reference:
- **Goldfish Spec Review (Pre-Code)**: `npm run spec-review <feature-id>` or `node .agents/scripts/run-spec-review.js <feature-id>`
- **Semantic Drift Report (Post-Code)**: `npm run drift-report <feature-id>` or `node .agents/scripts/generate-drift-report.js <feature-id>`
- **Unified Review Runner**: `npm run review <feature-id>` or `node .agents/scripts/run-sdd-review.js <feature-id>`
- **Pre-Commit File Drift**: `npm run check-drift` or `node .agents/scripts/check-spec-drift.js --working-tree`
- **SDD Integrity Sensor**: `npm run verify-sdd` or `node .agents/scripts/verify-sdd-integrity.js`
- **Interactive Cockpit**: `npm run dashboard` or `node .agents/scripts/serve-dashboard.js`

Refer to `AGENTS.md` for the full execution rules, EGM 5 phases, and skill routing matrix.
