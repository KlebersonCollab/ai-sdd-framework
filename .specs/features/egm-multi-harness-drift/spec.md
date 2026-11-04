# Specification: Canonical EGM Lifecycle, Agent Skills Convention & Semantic Drift Sensor

## 1. User Stories
- **US-1 (Universal Agent Skill Discovery)**: As an engineer using Anthropic Claude Code, OpenAI Codex, or Google Antigravity, I want the Goldfish reviewer packaged as a canonical Agent Skill under `.agents/skills/sdd-spec-review/`, so that my active IDE auto-discovers and triggers stateless reviews without vendor-specific directory clutter.
- **US-2 (Pre-Code Spec Review)**: As a developer/architect, I want an automated spec review tool (`run-spec-review.js`) that audits specifications cold for ambiguities, unstated assumptions, and missing edge cases, so that I catch design flaws before writing production code.
- **US-3 (Semantic Drift Detection — Video 4:13–4:38)**: As an engineering lead, I want a semantic drift detector (`generate-drift-report.js`) that compares `spec.md` against actual codebase implementations and diffs, so that omitted business rules, incomplete models, and shortcuts/gambiarras are surfaced immediately.
- **US-4 (One-Liner Installer Distribution)**: As a developer onboarding a new project via `setup.ps1` or `setup.sh`, I want all new EGM skills, scripts, and npm shortcuts to be installed automatically out of the box inside `.agents/`.
- **US-5 (Unified Review Gate Integration)**: As an SDD Reviewer agent, I want the semantic drift sensor integrated into `run-sdd-review.js` so that formal verification reports require zero semantic drift for approval.

## 2. Business Rules & Invariants
- **BR-1 (Zero-Code Upstream Rule)**: The Elephant agent MUST NOT generate production implementation code during the Bootstrap, Brainstorm, Draft, or Spec Review phases.
- **BR-2 (Stateless Goldfish Invariance)**: Goldfish reviewer agents/subagents MUST evaluate specifications cold, using only project files without conversational bias or assumptions from prior brainstorming sessions.
- **BR-3 (Quad-Category Drift Taxonomy)**: All semantic drift detections MUST be classified into one of four standard categories:
  - `MISSING_FEATURES`: Business rules (`BR-X`) or scenarios (`AC-X`) declared in `spec.md` with no matching implementation in code.
  - `INCOMPLETE_MODELS`: Data structures, schemas, or models missing fields or types specified in design.
  - `LOGIC_SHORTCUTS`: Code containing `// TODO`, `// FIXME`, hardcoded mock responses, stubs, or unhandled rejection paths.
  - `ARCHITECTURAL_DIVERGENCE`: Modifications deviating from declared patterns or introducing unapproved dependencies.
- **BR-4 (Open Standards Compliance)**: Subagent skills MUST adhere to Anthropic's Agent Skills specification (`.agents/skills/<skill-name>/SKILL.md`), and global multi-agent directives MUST reside in `AGENTS.md`. No proprietary vendor folders (`.claude/`, `.codex/`) shall be created.
- **BR-5 (Update-Safe Distribution)**: The one-liner installers (`setup.ps1` and `setup.sh`) MUST package and deploy `.agents/` into target projects without overwriting existing `.specs/` or `memory_graph.jsonl`.
- **BR-6 (Zero Host Package Pollution)**: All sensor and review scripts MUST run using native Node.js (v18+) core APIs with 0 external npm dependencies.

## 3. Acceptance Criteria (BDD)

### Happy Path (Success Scenarios)
- **AC-1: Semantic Drift Detection — Clean Implementation (Zero Drift)**
  - **Given** an approved feature specification in `.specs/features/<feature-id>/spec.md` with declared `BR-X` rules and `AC-X` scenarios
  - **When** `node .agents/scripts/generate-drift-report.js <feature-id>` is executed on fully implemented and conforming code
  - **Then** the script exits with code 0, outputs `DRIFT STATUS: PASS (0 discrepancies detected)`, and generates `.specs/features/<feature-id>/drift-report.md` with status `APPROVED`.

- **AC-2: Semantic Drift Detection — Surfaces Logic Shortcuts & Gambiarras**
  - **Given** target implementation files containing `// TODO: implement`, hardcoded placeholder values, or bypassed error handling
  - **When** `node .agents/scripts/generate-drift-report.js <feature-id>` is executed
  - **Then** the sensor flags `LOGIC_SHORTCUTS`, details file paths and line matches in `drift-report.md`, and exits with code 1.

- **AC-3: Semantic Drift Detection — Surfaces Missing Features & Incomplete Models**
  - **Given** a `spec.md` declaring business rules (`BR-1`, `BR-2`) or data model fields that have no implementation in code
  - **When** `node .agents/scripts/generate-drift-report.js <feature-id>` is executed
  - **Then** the sensor flags `MISSING_FEATURES` or `INCOMPLETE_MODELS`, lists the unfulfilled IDs, and exits with code 1.

- **AC-4: Pre-Code Goldfish Spec Review Audit**
  - **Given** a feature `plan.md` or `spec.md` containing ambiguous language (e.g. "make it fast", "robust", "simple") or missing BDD Given/When/Then blocks
  - **When** `node .agents/scripts/run-spec-review.js <feature-id>` is executed
  - **Then** the tool outputs an adversarial audit report detailing unstated assumptions, ambiguous terms, and missing edge cases.

- **AC-5: Canonical Agent Skill Manifest & Standards Compliance**
  - **Given** the framework repository or a project bootstrapped with the installer
  - **When** checking `.agents/skills/sdd-spec-review/SKILL.md`
  - **Then** the file exists with valid YAML frontmatter matching Anthropic's Agent Skills specification (`name: sdd-spec-review`, lowercase alphanumeric with hyphens, description, read-only boundaries).

- **AC-6: One-Liner Installer Distribution & Package Script Registration**
  - **Given** a project directory with `package.json`
  - **When** checking npm scripts after running installer or setup
  - **Then** `npm run drift-report` and `npm run spec-review` execute the corresponding `.agents/scripts/` runners cleanly.

- **AC-7: Unified Review Gate Integration**
  - **Given** a completed feature audit executed via `node .agents/scripts/run-sdd-review.js <feature-id>`
  - **When** the sensor suite runs
  - **Then** the output Verification Report includes a dedicated `Semantic Drift` row displaying the verdict from `generate-drift-report.js`.

### Input & Validation Scenarios
- **AC-8: Missing Feature ID or Non-Existent Feature**
  - **Given** `generate-drift-report.js` or `run-spec-review.js` is invoked without a feature ID or with an invalid path
  - **When** the command executes
  - **Then** the script displays available feature directories, emits a descriptive error message, and exits with code 1.

## 4. Test Data & Boundary Matrix
| Parameter / Field | Valid Inputs (Happy) | Invalid / Boundary Inputs (Edge) |
|---|---|---|
| `featureId` | Existing folder under `.specs/features/` (e.g. `egm-multi-harness-drift`) | `""`, `"non-existent-feature"`, `null`, `../../path-traversal` |
| `tasks.md Target Files` | Concrete files: `["src/api.js", "tests/api.test.js"]` | Empty target files, glob patterns without matching files |
| `spec.md Rules & ACs` | Formatted `BR-1`, `BR-2`, `AC-1: Given/When/Then` | Empty file, unformatted plain text without IDs |
| `Shortcuts Patterns` | Clean code without `// TODO`, `// FIXME`, `// HACK`, hardcoded mocks | `// TODO later`, `return "mock"`, `// hack bypass` |

## 5. Verification Sensors
| Sensor | Command / Target | Success Threshold |
|---|---|---|
| SDD Integrity | `node .agents/scripts/verify-sdd-integrity.js` | 100% pass, 0 violations |
| Spec Drift (File-level) | `node .agents/scripts/check-spec-drift.js --working-tree` | 0 drifting files |
| Semantic Drift Sensor | `node .agents/scripts/generate-drift-report.js egm-multi-harness-drift` | 0 semantic discrepancies |
| Unit & Integration Tests | `npm test` | 100% pass across all test suites |
| Review Runner | `npm run review egm-multi-harness-drift` | VERDICT: APPROVED |
