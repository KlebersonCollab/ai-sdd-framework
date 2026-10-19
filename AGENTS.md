# AGENTS.md

## Purpose

This document defines the mandatory execution workflow for all agents and skills used during task execution.
The objective is to enforce a **Spec Driven Development (SDD)** lifecycle and prevent uncontrolled execution.

---

# CRITICAL: Project Context Loading — BLOCKING GATE

**This is a HARD GATE. No implementation action may proceed until context is established.**

**MANDATORY**: At the START of every session, execute this sequence:

1. **Memory Recall**: Load persistent memory via `sdd-memory` from `.agents/memory/memory_graph.jsonl`.
2. **Read Project Context & Glossary**: Check `.specs/project/CONTEXT.md` (Domain Glossary) and `.specs/codebase/` (Technical Map).
3. **Operational State & Roadmap**: Read `.specs/project/STATE.md` and `.specs/project/ROADMAP.md` to identify active blockers, pending feature tasks, and current milestone targets.
4. **ADR Consistency & Decision Tree**: Inspect `.specs/project/ADRs/` to verify active vs. superseded architectural decisions. Never alter or contradict structural decisions without an ADR.
5. **Run SDD Integrity Sensor**: Run `node .agents/scripts/verify-sdd-integrity.js` (use `node .agents/scripts/verify-sdd-integrity.js --bootstrap` if initializing a new repository) to ensure 100% structural, DAG dependency, and schema integrity across the specification tree.
6. **Check Knowledge Base & Design System**: Read `.specs/knowledge/<type>s/<slug>.md` for known patterns/anti-patterns. If the task touches UI/Frontend, read `DESIGN.md` at project root.
7. **Evaluate Context State**:
   - **If `.specs/project/CONTEXT.md` does not exist or has empty placeholders `<!-- PREENCHER ...`**:
     → Trigger **Auto-Discovery Protocol** via `node .agents/scripts/auto-discover.js` (or `npm run auto-discover`).
   - **If context is complete and sensor passes**:
     → Proceed with standard SDD lifecycle.

---

## Auto-Discovery Protocol (MANDATORY when context is missing/incomplete)

When `.specs/project/CONTEXT.md` is missing or contains unfilled placeholders, execute this sequence:

### Step A: Run Automated Discovery Engine
1. **Execute Auto-Discover Tool**: Run `node .agents/scripts/auto-discover.js` (or `npm run auto-discover`).
   - Scans project manifests (`package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, etc.).
   - Maps folder organization and entry points.
   - Detects language, frameworks, linters, and test runners.
   - Generates or updates `.specs/codebase/` (`STACK.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `CONCERNS.md`, `TECHNICAL-MAP.md`) and `.specs/project/CONTEXT.md`.

### Step B: Validate with User
2. **Present Discovery Summary**: Show the user what was discovered and confirm domain/technical assumptions before proceeding to feature planning.

---

## Specification & Artifact Architecture

Artifacts are strictly partitioned across 4 distinct layers:

```
.
├── .agents/
│   ├── memory/
│   │   └── memory_graph.jsonl      # Cross-session recall (entities, relations, observations)
│   ├── rules/                      # System rules (Tier 1 Prohibitions, Quality Enforcement, Token Opt)
│   ├── scripts/                    # Governance & sensor scripts (serve-dashboard.js, check-spec-drift.js, install-hooks.js)
│   └── skills/                     # Specialized agent capabilities
├── .specs/
│   ├── codebase/                   # Brownfield reality (STACK, ARCHITECTURE, CONVENTIONS, CONCERNS, TECHNICAL-MAP)
│   ├── project/                    # Vision & domain context (PROJECT, ROADMAP, STATE, CONTEXT, ADRs/)
│   ├── features/<feature-id>/      # Active feature specs (plan.md, spec.md, tasks.md)
│   └── knowledge/                  # Curated patterns/ and anti-patterns/
```

---

# Complete Capabilities & Skill Routing Matrix

Use this matrix to route every user request to the appropriate skill:

| Intent / Request Type | Primary Skill | Supporting Skills & Tools | Target Artifacts |
| :--- | :--- | :--- | :--- |
| **Cross-Session Memory** | `sdd-memory` | `view_file`, `replace_file_content` | `.agents/memory/memory_graph.jsonl` |
| **Codebase Mapping & Research** | `sdd-explorer` | `auto-discover.js`, `search`, `arxiv`, `read_url_content` | `.specs/codebase/` (`STACK.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `CONCERNS.md`, `TECHNICAL-MAP.md`) |
| **Feature Planning & Scoping** | `sdd-planner` | `create-feature.js`, `grill-me` (Phase 0 Align) | `.specs/features/<id>/` (`plan.md`, `spec.md`, `tasks.md`), `.specs/project/ADRs/` |
| **Stress-testing Requirements** | `grill-me` | `ask_question`, `view_file` | Direct interactive interview → Feeds `sdd-planner` |
| **Feature Implementation (TDD)** | `sdd-executor` | `refactor`, `debug`, `check-spec-drift.js --working-tree` | Source code, test files, `tasks.md` (Evidence column) |
| **Bug Investigation / Diagnosis** | `debug` | `search`, `run_command` | Root cause analysis → Feeds `sdd-planner` if replan needed |
| **Code Restructuring / Clean Code** | `refactor` | `sdd-executor` | Source code with non-regression tests |
| **Specification & Quality Audit** | `sdd-review` | `run-sdd-review.js`, test runner, linter, build sensors | Formal Verification Report with Verdict in chat |
| **UI / Frontend / Design System** | `sdd-executor` / `sdd-planner` | `DESIGN.md`, `view_file` | Source code matching `DESIGN.md` tokens |
| **Specs & Feature Dashboard** | `sdd-executor` / `sdd-planner` | `serve-dashboard.js`, `DESIGN.md` | Interactive UI at `http://localhost:3000` |
| **Symbol & Pattern Lookup** | `search` | `grep_search`, `find_by_name` | Direct file:line references |
| **Scientific / Algorithmic Papers** | `arxiv` | `read_url_content`, curl | Paper summaries and BibTeX |
| **Skill Authoring & Extension** | `write-a-skill` | — | `.agents/skills/<skill-name>/SKILL.md` |

---

# Global Execution Rules (Strict SDD Lifecycle)

## Priority Order & Execution Flow

```text
0. sdd-memory   (Load at session start; persist insights at session end)
1. sdd-explorer (Brownfield discovery via auto-discover.js & codebase mapping)
2. sdd-planner  (Feature planning: scaffold via create-feature.js; plan.md, spec.md, tasks.md)
3. sdd-executor (Atomic TDD implementation, SWE-agent ACI & AgentCoder test immutability)
4. sdd-review   (Sensor audit via run-sdd-review.js, Spec Drift check, AC verification & verdict)
```

---

## Rule 1 — Exploration and Knowledge Tasks
If a task involves research, investigation, comparative analysis, or architecture exploration:
* **MUST USE**: `skill: sdd-explorer` (supported by `node .agents/scripts/auto-discover.js`, `search` or `arxiv`).
* **Responsibilities**: Map code reality, produce findings in `.specs/codebase/`, reduce uncertainty. Use `npm run auto-discover` to generate brownfield baselines deterministically.
* **Reference Guide**: Consult [Brownfield Mapping Guide](.agents/skills/sdd-explorer/references/brownfield-mapping.md).
* **Forbidden**: Writing production code or modifying project implementation files during exploration.

---

## Rule 2 — Planning is Mandatory Before Development (MetaGPT SOP)
If a task involves writing code, refactoring, feature implementation, bug fixing, or API changes:
* **MUST FIRST USE**: `skill: sdd-planner` (supported by `grill-me` in Phase 0).
* **Responsibilities**: Define scope (`plan.md`), BDD acceptance criteria with sensors (`spec.md`), and strict 7-column atomic tasks with DAG dependency mapping (`tasks.md`) under `.specs/features/<feature-id>/`. Create numbered ADRs in `.specs/project/ADRs/` for structural choices.
* **Automation**: Scaffold canonical feature directories using `node .agents/scripts/create-feature.js <feature-id> --title "<Feature Title>"` (or `npm run create-feature <id>`).
* **Reference Templates**: Consult [plan-template.md](.agents/skills/sdd-planner/references/plan-template.md), [spec-template.md](.agents/skills/sdd-planner/references/spec-template.md), [task-template.md](.agents/skills/sdd-planner/references/task-template.md), [grilling-session.md](.agents/skills/sdd-planner/references/grilling-session.md).
* **Forbidden**: Direct execution without approved planning (`User Request → sdd-executor` is strictly invalid).

---

## Rule 3 — Execution Requires Approved Planning (SWE-agent ACI & AgentCoder Decoupling)
Only after planning is established may implementation proceed:
* **MUST USE**: `skill: sdd-executor` (supported by `refactor` and `debug`).
* **Responsibilities**: Follow `tasks.md` sequentially, apply TDD cycle, use surgical contiguous block replacement (`replace_file_content`), run sensors (lint, test, build, `node .agents/scripts/check-spec-drift.js --working-tree`), record commit/test evidence.
* **Test Immutability**: The executor is strictly forbidden from weakening, altering, or commenting out test assertions to pass failing tests (Prohibition 9).
* **Reference Principles**: Consult [Coding Principles](.agents/skills/sdd-executor/references/coding-principles.md).
* **Safety Valve**: If a task touches >3 files unexpectedly or hits critical risk paths, PAUSE and request a replan from `sdd-planner`.
* **Forbidden**: Modifying `plan.md` or `spec.md` directly; blind-overwriting entire files (Prohibition 8); marking tasks complete without sensor evidence.

---

## Rule 4 — Review is Mandatory After Development (Pre-Commit Spec Drift Sensor)
After any implementation activity:
* **MUST USE**: `skill: sdd-review`.
* **Responsibilities**: Run the unified Review Sensor Gate via `node .agents/scripts/run-sdd-review.js <feature-id>` (or `npm run review <feature-id>`), which automatically executes all sensors (Spec Drift Sensor, Linter, Test Suite, Build), audits test diff integrity against assertion tampering, audits each AC against concrete code lines (`file:///...`), and generates the formal Verification Report with Verdict (`APPROVED` / `REQUESTS CHANGES`).
* **Reference Standards**: Consult [BDD Guide](.agents/skills/sdd-review/references/bdd-guide.md).
* **Forbidden**: Approving work without sensor evidence, approving when spec drift is detected, or skipping edge-case checks.

---

# Canonical Script & Tooling Reference (`.agents/scripts/`)

All agents across any AI harness MUST leverage these zero-dependency native scripts for deterministic execution:

| Command / Script | Purpose | When to Use |
| :--- | :--- | :--- |
| `node .agents/scripts/verify-sdd-integrity.js [--bootstrap]` | Audits required files, ADR lifecycles, and DAG dependency acyclicity | Session boot (Gate 5) & Pre-commit. Use `--bootstrap` for fresh repos. |
| `node .agents/scripts/check-spec-drift.js [--working-tree]` | Detects undeclared code modifications against active `tasks.md` | Pre-commit hook & after every implementation task in Executor. |
| `node .agents/scripts/auto-discover.js [--dry-run]` | Deterministically scans manifests & directory layouts to populate `.specs/codebase/` | Gate 7 Auto-Discovery & initial project bootstrapping. |
| `node .agents/scripts/create-feature.js <id> [--title "..."]` | Scaffolds `.specs/features/<id>/` (`plan.md`, `spec.md`, `tasks.md`) | Starting a new feature plan in Planner (Rule 2). |
| `node .agents/scripts/run-sdd-review.js [id]` | Unified sensor runner & test immutability audit producing Verification Report | Feature completion audit in Reviewer (Rule 4). |
| `node .agents/scripts/install-hooks.js` | Installs worktree-resilient dual-sensor (`verify-sdd` + `check-drift`) hook | Project setup & onboarding. |
| `node .agents/scripts/serve-dashboard.js` | Launches native Cockpit server (port 3000) with SSE live-sync | Visualizing cascade, living docs, and terminal. |
| `node .agents/scripts/export-docs.js` | Compiles 100% of `.specs/` and rules into standalone `docs/index.html` | Offline distribution and static documentation hosting. |
| `node .agents/scripts/compact-memory.js [--compact]` | Audits and archives superseded records in `memory_graph.jsonl` | Session maintenance and long-term memory hygiene. |

---

# Subagent Delegation Strategy

When handling complex tasks, use subagents strategically:

1. **Subagent `research` (Read-only)**:
   - Use for extensive codebase exploration, searching external documentation, or surveying large modules.
   - Keeps the main context clean from intermediate search dumps.
2. **Subagent `self` (Full capability)**:
   - Use for isolated iterative TDD loops in `sdd-executor` or heavy refactoring sub-tasks.
3. **Main Context Execution**:
   - Use for planning alignment (`sdd-planner`, `grill-me`), interactive review verdicts (`sdd-review`), and user communications.

---

# Core Directives & Quality Standards

1. **Research Before Implementing — Never Guess**:
   - State what you KNOW, what you DON'T KNOW, research the unknown, and only then implement.
   - *"Source X does Y at file:line, we do Z, the difference causes W"* is the required standard.
2. **Zero Code Duplication**: Search existing modules before implementing new logic.
3. **No Shortcuts, Stubs, or Placeholders**: Never write TODOs, stubs, or mock assertions to pass tests.
4. **Governed Deletions**: Never delete project files without explicit user approval (see `.agents/rules/TIER1_PROHIBITIONS.md`).
5. **Clean Scripts & Scratchpad**: Use isolated scratch directories for ephemeral tests and clean them up immediately.
6. **Design System Invariance**: Whenever writing UI code, CSS, or frontend components, strictly adhere to tokens, typography, colors, and layout scales defined in `DESIGN.md`. Never invent arbitrary hex codes or uncalibrated styles.
7. **Constitutional Spec Drift Invariance**: Every production code modification must be explicitly mapped in an active `.specs/features/<id>/tasks.md` and validated by the pre-commit spec drift sensor (`check-spec-drift.js`).
