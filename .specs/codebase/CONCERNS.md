# Critical Risks & Technical Debt

## High-Risk Areas
- **Cross-platform path normalization**: Windows backslashes vs POSIX slashes in sensor scripts and path matching.
- **Spec Drift Blindspot**: Internal framework scripts under `.agents/scripts/` were previously excluded from drift checking in the framework repo itself.

## Identified Gaps & Opportunities
- **Comprehensive Living Documentation**: The Cockpit currently renders only features and the memory graph. Project vision (`PROJECT.md`, `ROADMAP.md`), brownfield architecture (`.specs/codebase/`), decisions (`ADRs/`), and governance rules (`.agents/rules/`) are not yet rendered visually.
- **Empty Knowledge Base**: `.specs/knowledge/patterns/` and `.specs/knowledge/anti-patterns/` are empty, preventing automated pattern recall by agents during boot.
- **Standalone Static Export**: Need a zero-server single-file HTML exporter (`export-docs.js`) so specifications can be shared and reviewed offline or hosted statically.
