# Specification: Robustness Enhancements (MetaGPT, AgentCoder, SWE-agent)

## 1. Functional Requirements

### FR-1: MetaGPT Standardized Operating Procedures (SOP) & Task Schema
- **Requirement**: Task lists in `tasks.md` MUST adhere to a strict 7-column schema: `Status`, `ID`, `Type`, `Description`, `Target Files`, `Dependencies`, `Evidence`.
- **Validation**: Every task must declare explicit dependencies (`TASK-XX` or `None`) and target file paths.

### FR-2: AgentCoder Test Decoupling & Test Immutability Protocol
- **Requirement**: Test suites generated in Phase 2/TDD are immutable for the `sdd-executor` agent.
- **Validation**: If an executor modifies an existing assertion in a test file to pass a test suite without an approved replan, the `sdd-review` audit MUST reject the change with verdict `REQUESTS CHANGES`.

### FR-3: SWE-agent Agent-Computer Interface (ACI) Protocol
- **Requirement**: Agents MUST use windowed reading (`view_file` slice) and contiguous block editing (`replace_file_content`).
- **Validation**: Whole-file blind overwrites on existing project files are strictly prohibited unless creating a brand-new file.

## 2. BDD Acceptance Criteria

```gherkin
Scenario: MetaGPT Task Schema Enforcement
  Given a new feature is planned in sdd-planner
  When tasks.md is generated
  Then it must contain the strict columns: Status | ID | Type | Description | Target Files | Dependencies | Evidence
  And all task IDs must follow sequential format TASK-01, TASK-02

Scenario: AgentCoder Test Immutability Enforcement
  Given an executor is running a TDD cycle for a feature
  When a test failure occurs due to buggy code logic
  Then the executor must modify only the production code to satisfy the test
  And the executor is strictly prohibited from altering test assertions or removing tests

Scenario: SWE-agent ACI Surgical Protocol Enforcement
  Given an agent needs to edit an existing source file
  When making changes
  Then it must use contiguous block replacement targeting verified line ranges
  And it must never blind-overwrite the entire file
```
