# Feature Plan: Robustness Architecture from Academic SOTA (MetaGPT, AgentCoder, SWE-agent)

## 1. Executive Summary
This feature enhances the core SDD framework by embedding mathematical/empirical guardrails from 3 peer-reviewed SOTA papers:
1. **MetaGPT (ICLR 2024)**: Standardized Operating Procedures (SOPs) and Strict Schema Validation in `sdd-planner`.
2. **AgentCoder (2023)**: Decoupled Multi-Agent Testing & Test Immutability in `sdd-executor` and `sdd-review`.
3. **SWE-agent (Princeton 2024)**: Agent-Computer Interface (ACI) Protocol for surgical, bounded file manipulation in `TIER1_PROHIBITIONS.md` and `sdd-executor`.

## 2. User Stories & Value Proposition
- **US-1 (MetaGPT)**: As an AI Planner, I want structured task schemas with typed columns and dependency graphs, so that downstream executors never hallucinate requirements or skip dependencies.
- **US-2 (AgentCoder)**: As an Engineering Lead, I want test suites to be authored independently and immutable during execution, so that agents cannot alter tests to mask bugs.
- **US-3 (SWE-agent)**: As a Developer, I want AI agents to use surgical block replacements and bounded line views, so that files are never corrupted by blind overwrites or context exhaustion.

## 3. Scope & Target Artifacts
- **Tier 1 Rules**: `.agents/rules/TIER1_PROHIBITIONS.md` (Add PROHIBITION 8: ACI Protocol & PROHIBITION 9: Test Immutability Gate).
- **Planner Skill & References**: `.agents/skills/sdd-planner/SKILL.md`, `references/task-template.md`, `references/plan-template.md`, `references/spec-template.md`.
- **Executor Skill & Principles**: `.agents/skills/sdd-executor/SKILL.md`, `references/coding-principles.md`.
- **Reviewer Skill**: `.agents/skills/sdd-review/SKILL.md`.
- **State Tracking**: `.specs/project/STATE.md`.
