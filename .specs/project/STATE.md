# Project State & Context

## 🏁 Session Status
- **Current Task**: Completed Pre-Commit Spec Drift Sensor & Constitutional SDD (`feat-spec-drift-precommit`)
- **Progress**: 100% complete (Pre-commit hook, sensor script, and sdd-review integration verified)
- **Next Steps**: Framework fully protected against Spec-Code Drift before commit execution

## 💡 Decisions Log
- **[2026-08-28] - [Security Audit]**: Full security audit completed; PDF report generated in `docs/security-audit/`.
- **[2026-08-28] - [Issue 1 Resolved]**: Implemented canonical `.gitignore` with 6 exclusion categories.
- **[2026-08-28] - [Issue 2 Resolved]**: Upgraded `sdd-memory` with `namespace` and `tenantId` support.
- **[2026-08-28] - [Issue 3 Resolved]**: Added `escape_bibtex` to `arxiv/SKILL.md` to sanitize special TeX characters and prevent injection.
- **[2026-08-28] - [MetaGPT SOPs]**: Formalized 7-column schema contract for `tasks.md` and dependency ordering in `sdd-planner`.
- **[2026-08-28] - [AgentCoder Test Immutability]**: Added PROHIBITION 9 and review gate forbidding test assertion dilution during execution.
- **[2026-08-28] - [SWE-agent ACI]**: Added PROHIBITION 8 and coding principles mandating surgical contiguous replacements and bounded reading.
- **[2026-08-28] - [Constitutional SDD / Spec Drift Hook]**: Implemented local git pre-commit hook (`.agents/scripts/check-spec-drift.js`) to block unmapped code changes before repository commit.

## 🚧 Active Blockers
- None.

## ❄️ Deferred Ideas / Icebox
- None.

## ⚠️ Known Technical Debts
- None. Pre-commit hooks for spec drift and governance are now actively configured.
