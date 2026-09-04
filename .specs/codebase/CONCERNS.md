# Critical Risks & Technical Debt

## High-Risk Areas
- Cross-platform path normalization (Windows backslashes vs POSIX slashes in sensor scripts).

## Identified Gaps & Opportunities
- **Human Visibility Gap**: Specifications are stored across nested Markdown files, which are ideal for LLMs but require effort for human leads/stakeholders to visualize at a glance.
- **Dashboard Opportunity**: A lightweight, zero-dependency HTML dashboard rendering features cascading into user stories and tasks directly solves this gap.
