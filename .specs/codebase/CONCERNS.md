# Critical Risks & Technical Debt

## High-Risk Areas
- **Cross-platform path normalization**: Windows backslashes vs POSIX slashes in sensor scripts and path matching (guarded by `normalizePath` in `check-spec-drift.js`).
- **Synchronous Hook Execution**: Google Antigravity executes `.agents/hooks.json` handlers synchronously (`timeout: 10s`); `sdd-hook.js` must remain zero-dependency and complete in `< 100ms`.

## Resolved Gaps
- **Comprehensive Living Documentation**: Implemented via 360° Cockpit API and `export-docs.js` (`docs/index.html`) (ADR 0004).
- **Knowledge Base Seeding**: Populated foundational patterns (`zero-host-pollution`, `antigravity-lifecycle-hooks`) and anti-patterns (`blind-file-overwrite`, `test-assertion-weakening`) in `.specs/knowledge/` (ADR 0009).
- **Active Task Scope Drift**: Closed historical feature bleed via `activeOnly` task filtering in `check-spec-drift.js` (ADR 0009).

