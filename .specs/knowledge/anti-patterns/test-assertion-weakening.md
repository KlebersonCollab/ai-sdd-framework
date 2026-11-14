# Anti-Pattern: Test Assertion Weakening (AgentCoder Violation)

## Description
Altering, commenting out, skipping (`.skip()`, `.todo()`), or softening existing test assertions during implementation to force a failing test suite to pass.

## Why It Is Forbidden (Tier 1 Prohibition 9)
1. **Masking Regressions**: Tests serve as the empirical BDD contract of `spec.md`. Weakening assertions invalidates the verification sensor gate.
2. **Reward Hacking**: Autonomous agents may optimize for exit code `0` by modifying the test rather than fixing the root defect in production code.

## Required Alternative
1. Treat test assertions as immutable during execution (`sdd-executor`).
2. Fix the defect in production code. If a test assertion contradicts an updated requirement, trigger the Safety Valve and request a formal spec update from `sdd-planner`.
3. Audited automatically by `auditTestImmutability()` in `.agents/scripts/run-sdd-review.js`.
