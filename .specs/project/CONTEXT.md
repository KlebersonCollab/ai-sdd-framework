# Project Context & Domain Glossary

## Domain Terms
- **SDD (Spec Driven Development)**: Software development lifecycle where executable and audited specifications precede code implementation.
- **Feature Cascade**: The top-down hierarchy: Feature (Epic/Capability) -> Plan / User Stories (Intent) -> Spec / Acceptance Criteria (BDD) -> Tasks (Atomic execution).
- **Spec Drift**: Divergence between actual repository code modifications and declared feature tasks.
- **Sensor Gate**: Automated command-line checks (linter, unit tests, build, drift detection) that must pass before task completion or commit approval.
- **Memory Graph**: JSONL-based persistent associative memory tracking entities, relations, and observations across sessions.
- **Rule Bridge**: Lightweight adapter configuration files tailoring AGENTS.md governance to specific AI IDEs/agents.
- **Feature Dashboard**: An interactive visual presentation tool parsing .specs/features/ to display feature progress, user stories, acceptance criteria, and task tables.
