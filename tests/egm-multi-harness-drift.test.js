/**
 * Test Suite: Multi-Harness EGM Lifecycle & Semantic Drift Sensor
 * AI-SDD Framework | ADR 0008 Verification
 * Uses native node:test and node:assert (zero external dependencies)
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');

// 1. Module Imports (Dynamic/Safe Load)
let driftModule;
try {
  driftModule = require('../.agents/scripts/generate-drift-report.js');
} catch (err) {
  driftModule = null;
}

let specReviewModule;
try {
  specReviewModule = require('../.agents/scripts/run-spec-review.js');
} catch (err) {
  specReviewModule = null;
}

// ==============================================================================
// Test Suite 1: Semantic Drift Engine (generate-drift-report.js)
// ==============================================================================

test('generate-drift-report: module exists and exports core analysis functions', () => {
  assert.ok(driftModule, 'Expected generate-drift-report.js to export module');
  assert.strictEqual(typeof driftModule.analyzeSemanticDrift, 'function');
  assert.strictEqual(typeof driftModule.parseSpecContracts, 'function');
  assert.strictEqual(typeof driftModule.detectLogicShortcuts, 'function');
  assert.strictEqual(typeof driftModule.generateDriftReportMarkdown, 'function');
});

test('generate-drift-report: parseSpecContracts extracts BR-X, AC-X, and data models', () => {
  const sampleSpec = `
# Specification: Sample Feature

## 2. Business Rules & Invariants
- **BR-1 (Auth Guard)**: System must validate JWT tokens before dispatching requests.
- **BR-2 (Rate Limiting)**: Max 100 requests per minute per IP.

## 3. Acceptance Criteria (BDD)
- **AC-1: Valid Login**
  - **Given** valid credentials
  - **When** login is requested
  - **Then** return 200 with JWT token

## 4. Test Data & Boundary Matrix
| Parameter / Field | Valid Inputs |
|---|---|
| username | valid_user |
| email | user@domain.com |
`;

  const parsed = driftModule.parseSpecContracts(sampleSpec);
  assert.ok(parsed, 'Expected parsed contracts object');
  assert.strictEqual(parsed.businessRules.length, 2);
  assert.strictEqual(parsed.businessRules[0].id, 'BR-1');
  assert.ok(parsed.businessRules[0].title.includes('Auth Guard'));
  assert.strictEqual(parsed.acceptanceCriteria.length, 1);
  assert.strictEqual(parsed.acceptanceCriteria[0].id, 'AC-1');
  assert.ok(parsed.modelFields.includes('username'));
  assert.ok(parsed.modelFields.includes('email'));
});

test('generate-drift-report: detectLogicShortcuts flags TODOs, placeholders, and stubs', () => {
  const dirtyCode = `
function processPayment(amount) {
  // TODO: integrate real payment gateway
  return { status: "mock_success" }; // stub
}

function calculateDiscount() {
  // FIXME: handle edge case
  return 0; // HACK: bypass
}
`;

  const shortcuts = driftModule.detectLogicShortcuts(dirtyCode, 'src/payment.js');
  assert.ok(shortcuts.length >= 3, `Expected at least 3 shortcuts, got ${shortcuts.length}`);
  const types = shortcuts.map(s => s.pattern);
  assert.ok(types.some(t => t.includes('TODO')));
  assert.ok(types.some(t => t.includes('FIXME') || t.includes('HACK')));
  assert.strictEqual(shortcuts[0].file, 'src/payment.js');
  assert.ok(typeof shortcuts[0].line === 'number');
});

test('generate-drift-report: detectLogicShortcuts returns empty on clean production code', () => {
  const cleanCode = `
function processPayment(amount, gateway) {
  if (amount <= 0) {
    throw new Error('Invalid amount');
  }
  return gateway.charge({ amount });
}
`;

  const shortcuts = driftModule.detectLogicShortcuts(cleanCode, 'src/payment.js');
  assert.strictEqual(shortcuts.length, 0, 'Clean code should have 0 logic shortcuts');
});

test('generate-drift-report: analyzeSemanticDrift correctly categorizes discrepancies', () => {
  const contracts = {
    businessRules: [
      { id: 'BR-1', title: 'Auth Guard', text: 'JWT validate token' },
      { id: 'BR-2', title: 'Rate Limiting', text: 'Rate limit bucket tokens' }
    ],
    acceptanceCriteria: [
      { id: 'AC-1', title: 'Valid Login', text: 'return 200 with JWT' },
      { id: 'AC-2', title: 'Missing Scenario', text: 'unimplemented feature xyz' }
    ],
    modelFields: ['username', 'email', 'unimplementedField']
  };

  const fileContents = [
    {
      file: 'src/auth.js',
      content: `
        // BR-1 Auth Guard: JWT validate token implemented
        function login(username, email) {
          // TODO: complete later
          return { username, email, token: "jwt_123" };
        }
      `
    }
  ];

  const analysis = driftModule.analyzeSemanticDrift(contracts, fileContents);
  assert.ok(analysis);
  // Missing features: AC-2 and BR-2
  assert.ok(analysis.missingFeatures.some(m => m.id === 'AC-2' || m.id === 'BR-2'));
  // Incomplete models: unimplementedField
  assert.ok(analysis.incompleteModels.includes('unimplementedField'));
  // Logic shortcuts: TODO
  assert.ok(analysis.logicShortcuts.length > 0);
  assert.strictEqual(analysis.verdict, 'FAIL');
});

test('generate-drift-report: generateDriftReportMarkdown produces standard markdown report', () => {
  const sampleAnalysis = {
    featureId: 'sample-feature',
    verdict: 'APPROVED',
    discrepanciesCount: 0,
    missingFeatures: [],
    incompleteModels: [],
    logicShortcuts: [],
    architecturalDivergence: []
  };

  const md = driftModule.generateDriftReportMarkdown(sampleAnalysis);
  assert.ok(md.includes('## 🔍 Semantic Drift Report: sample-feature'));
  assert.ok(md.includes('DRIFT STATUS: PASS'));
  assert.ok(md.includes('0 discrepancies detected'));
});

// ==============================================================================
// Test Suite 2: Goldfish Spec Review Runner (run-spec-review.js)
// ==============================================================================

test('run-spec-review: module exists and exports audit functions', () => {
  assert.ok(specReviewModule, 'Expected run-spec-review.js to export module');
  assert.strictEqual(typeof specReviewModule.auditSpecCompleteness, 'function');
  assert.strictEqual(typeof specReviewModule.detectAmbiguities, 'function');
  assert.strictEqual(typeof specReviewModule.formatSpecReviewReport, 'function');
});

test('run-spec-review: detectAmbiguities catches fuzzy words without metrics', () => {
  const vagueSpec = `
  The system should be extremely fast, robust, and flexible.
  It must be easy to use and scale seamlessly.
  `;

  const ambiguities = specReviewModule.detectAmbiguities(vagueSpec);
  assert.ok(ambiguities.length >= 3, `Expected at least 3 ambiguous terms, got ${ambiguities.length}`);
  const words = ambiguities.map(a => a.word.toLowerCase());
  assert.ok(words.includes('fast'));
  assert.ok(words.includes('robust'));
  assert.ok(words.includes('flexible'));
});

test('run-spec-review: auditSpecCompleteness verifies BDD structure and acceptance criteria', () => {
  const validSpec = `
  ## 3. Acceptance Criteria (BDD)
  - **AC-1: Login**
    - **Given** user exists
    - **When** credentials posted
    - **Then** return 200
  `;

  const result = specReviewModule.auditSpecCompleteness(validSpec);
  assert.strictEqual(result.hasBddStructure, true);
  assert.strictEqual(result.criteriaCount, 1);
  assert.strictEqual(result.hasIncompleteScenarios, false);

  const brokenSpec = `
  ## 3. Acceptance Criteria (BDD)
  - **AC-1: Broken**
    - Just do something
  `;
  const brokenResult = specReviewModule.auditSpecCompleteness(brokenSpec);
  assert.strictEqual(brokenResult.hasIncompleteScenarios, true);
});

// ==============================================================================
// Test Suite 3: Canonical Agent Skill Manifest (.agents/skills/sdd-spec-review/)
// ==============================================================================

test('canonical agent skill manifest conforms to Anthropic Agent Skills specification', () => {
  const skillPath = path.join(REPO_ROOT, '.agents', 'skills', 'sdd-spec-review', 'SKILL.md');
  assert.ok(fs.existsSync(skillPath), 'Expected .agents/skills/sdd-spec-review/SKILL.md to exist');

  const content = fs.readFileSync(skillPath, 'utf8');
  assert.ok(content.startsWith('---'), 'SKILL.md must start with YAML frontmatter');

  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(frontmatterMatch, 'Valid YAML frontmatter required');

  const frontmatter = frontmatterMatch[1];
  assert.ok(/name:\s*sdd-spec-review/.test(frontmatter), 'Skill name must match directory name (sdd-spec-review)');
  assert.ok(/description:\s*.+/.test(frontmatter), 'Skill description must be declared');
  assert.ok(content.includes('Goldfish'), 'Skill body should describe Goldfish adversarial protocol');
});

// ==============================================================================
// Test Suite 4: Package Script Registration & Review Runner Integration
// ==============================================================================

test('package.json contains drift-report and spec-review npm scripts', () => {
  const pkgPath = path.join(REPO_ROOT, 'package.json');
  assert.ok(fs.existsSync(pkgPath), 'package.json must exist');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  assert.ok(pkg.scripts['drift-report'], 'package.json must contain drift-report script');
  assert.ok(pkg.scripts['spec-review'], 'package.json must contain spec-review script');
});

test('run-sdd-review includes semantic drift check in verification report', () => {
  const reviewScriptPath = path.join(REPO_ROOT, '.agents', 'scripts', 'run-sdd-review.js');
  assert.ok(fs.existsSync(reviewScriptPath));
  const content = fs.readFileSync(reviewScriptPath, 'utf8');

  assert.ok(content.includes('generate-drift-report'), 'run-sdd-review.js must integrate generate-drift-report.js');
  assert.ok(content.includes('Semantic Drift'), 'run-sdd-review.js report must include Semantic Drift row');
});
