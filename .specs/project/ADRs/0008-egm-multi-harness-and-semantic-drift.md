# ADR 0008: Canonical EGM Lifecycle, Agent Skills Convention & Semantic Drift Engine

## Status
Accepted

## Date
2026-11-03

## Context
As AI coding assistants have evolved, our existing SDD runtime (`ai-sdd-framework`) effectively solved structural integrity, pre-commit file boundaries (`check-spec-drift.js`), and long-term memory (`memory_graph.jsonl`). However, modern engineering with autonomous agents introduces critical challenges highlighted by Google's Elephant-Goldfish Model (EGM) and Dave Rensin's research:

1. **Conversational Sycophancy & Context Degradation**:
   When a single AI session brainstorms, specifies, and audits its own plans, it develops conversational bias—glossing over its own ambiguities and unstated assumptions. Solving this requires strict role decoupling:
   - **The Elephant**: Context-rich, long-horizon session for ideation and formal specifications. Strictly **writes zero production code**.
   - **The Goldfish Swarm**: Stateless, zero-context subagents with fresh context windows that attack the specification cold before implementation begins.

2. **File Boundary Drift vs. Semantic Requirement Drift (Video 4:13–4:38)**:
   Our existing `check-spec-drift.js` validates that modified files were declared in `tasks.md`. While critical for file-boundary discipline, it does not analyze **semantic requirement compliance**:
   - Missing features and omitted acceptance criteria.
   - Incomplete data models and interface schemas.
   - Logic shortcuts (hardcoded stubs, unhandled error branches, temporary mocks).
   - Architectural divergences from the design contract.

3. **Vendor Fragmentation vs. Open `.agents/` Standard**:
   Different tools historically proposed proprietary directories (e.g. `.claude/`, `.codex/`, `.cursor/`). However, Anthropic's open **Agent Skills specification** ([agentskills.io](https://agentskills.io)) and the Linux Foundation's **`AGENTS.md` standard** establish `.agents/` as the universal single source of truth across all modern AI coding assistants (Claude Code, OpenAI Codex, Antigravity, Cursor, Windsurf, Copilot). Introducing tool-specific folders would violate the framework's core architectural principle of Zero Vendor Pollution.

## Decision

We adopt a **Unified EGM Lifecycle & Semantic Drift Architecture** built entirely on the open `.agents/` and `AGENTS.md` conventions:

### 1. 5-Phase SDD Lifecycle Formalization
We standardize the SDD lifecycle across all harnesses into 5 sequential phases documented in `AGENTS.md`:
1. **Bootstrap**: Spatial repository mapping via `auto-discover.js` and `sdd-explorer`.
2. **Brainstorm**: Conceptual exploration under strict **Zero-Code Invariance** with Goldfish adversarial shootdowns.
3. **Draft**: Progressive specification authoring (`plan.md`, `spec.md`, `tasks.md`) with explicit section checkpoints.
4. **Review (Pre-Implementation)**: Cold-context Goldfish review swarm auditing for unstated assumptions and edge cases before coding.
5. **Drift Report (Post-Implementation)**: Deep semantic analysis comparing `spec.md` vs. actual code diffs to classify divergences.

### 2. Single Source of Truth: `.agents/skills/sdd-spec-review/`
Rather than creating fragmented vendor directories, we implement the Goldfish adversarial reviewer as a canonical Agent Skill following Anthropic's open standard:
- `.agents/skills/sdd-spec-review/SKILL.md`: Declarative metadata frontmatter, strict read-only tool boundaries, and adversarial audit instructions.
- Auto-discovered natively by Claude Code, Codex, Antigravity, and Cursor from `.agents/skills/`.
- In `AGENTS.md`, we provide explicit multi-harness invocation guidelines for:
  - **Antigravity**: via `invoke_subagent` (`Role: "Goldfish Spec Reviewer"`, `TypeName: "research"`).
  - **Claude Code**: natively via the Agent Skills discovery in `.agents/skills/` and `Task` tool.
  - **OpenAI Codex**: natively via `AGENTS.md` and multi-thread execution.
  - **Universal CLI Fallback**: Standalone runner `node .agents/scripts/run-spec-review.js [feature-id]` (and `npm run spec-review`).

### 3. Native Zero-Dependency Semantic Drift Engine
We implement `node .agents/scripts/generate-drift-report.js [feature-id]` (and `npm run drift-report [feature-id]`):
- Parses `spec.md` to extract declared Business Rules (`BR-X`), BDD scenarios (`AC-X`), data models, and constraints.
- Inspects repository diffs (`git diff` or working tree) on declared `Target Files`.
- Generates an actionable markdown report `.specs/features/<feature-id>/drift-report.md` categorizing discrepancies into:
  - `MISSING_FEATURES`
  - `INCOMPLETE_MODELS`
  - `LOGIC_SHORTCUTS`
  - `ARCHITECTURAL_DIVERGENCE`
- Integrates directly into `run-sdd-review.js` as an automated sensor gate.

### 4. Installer Distribution Guarantee
The one-liner installers (`setup.ps1` and `setup.sh`) already package and distribute `.agents/` as the canonical payload. By keeping all skills inside `.agents/skills/` and scripts inside `.agents/scripts/`, the installer automatically guarantees that every new or upgraded project receives the complete EGM infrastructure without requiring separate vendor folders.

## Consequences

### Positive
- **Zero Tool Pollution**: No `.claude/`, `.codex/`, or proprietary directory sprawl in user repositories.
- **Open Standard Compliance**: Aligns with Anthropic's Agent Skills specification and Linux Foundation's `AGENTS.md`.
- **Zero Sycophancy**: Goldfish subagents eliminate confirmation bias before implementation begins.
- **Deep Quality Enforcement**: Semantic drift report catches bugs, missing scenarios, and shortcuts that pass linter and file-drift checks.
- **Seamless Distribution**: `setup.ps1` and `setup.sh` require zero extra directory handling—all new capabilities reside natively in `.agents/`.

### Trade-offs / Mitigations
- Generating a semantic drift report on large features requires scanning multiple files. *Mitigation*: The engine scopes analysis strictly to the `Target Files` declared in `tasks.md`, maintaining execution under 100ms for deterministic checks.
