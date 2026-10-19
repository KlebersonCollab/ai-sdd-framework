/**
 * Test Suite: Core Sensors Robustness & Automation Tooling
 * AI-SDD Framework | Phases 2 & 3 Verification
 * Uses native node:test and node:assert (zero dependencies)
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');

// 1. verify-sdd-integrity module
let verifyModule;
try {
  verifyModule = require('../.agents/scripts/verify-sdd-integrity.js');
} catch (err) {
  verifyModule = null;
}

test('verify-sdd-integrity module exists and exports core validators', () => {
  assert.ok(verifyModule, 'Expected verify-sdd-integrity.js to export functions');
  assert.strictEqual(typeof verifyModule.checkRequiredFiles, 'function');
  assert.strictEqual(typeof verifyModule.checkAdrs, 'function');
  assert.strictEqual(typeof verifyModule.checkTasksTables, 'function');
  assert.strictEqual(typeof verifyModule.checkMemoryGraph, 'function');
});

test('verify-sdd-integrity: checkRequiredFiles supports bootstrap mode', () => {
  const canonicalMissing = verifyModule.checkRequiredFiles({ bootstrap: false });
  assert.ok(Array.isArray(canonicalMissing), 'Should return an array');

  // When bootstrap is true, missing files under .specs/ should be filtered or marked non-fatal
  const bootstrapMissing = verifyModule.checkRequiredFiles({ bootstrap: true });
  assert.ok(Array.isArray(bootstrapMissing));
  // In bootstrap mode, missing files should be 0 fatal errors for specs
  const fatalSpecs = bootstrapMissing.filter(f => f.startsWith('.specs/'));
  assert.strictEqual(fatalSpecs.length, 0, 'Bootstrap mode must not treat .specs/ files as fatal errors');
});

test('verify-sdd-integrity: checkTasksTables detects DAG cycle and missing dependency', () => {
  // Test the dependency graph validation helper if exported
  if (verifyModule.validateTaskDependencies) {
    const validTasks = [
      { id: 'TASK-01', dependencies: 'None' },
      { id: 'TASK-02', dependencies: 'TASK-01' },
      { id: 'TASK-03', dependencies: 'TASK-01, TASK-02' }
    ];
    const validResult = verifyModule.validateTaskDependencies(validTasks);
    assert.strictEqual(validResult.valid, true, 'Valid topological dependencies should pass');

    const cyclicTasks = [
      { id: 'TASK-01', dependencies: 'TASK-02' },
      { id: 'TASK-02', dependencies: 'TASK-01' }
    ];
    const cyclicResult = verifyModule.validateTaskDependencies(cyclicTasks);
    assert.strictEqual(cyclicResult.valid, false, 'Cyclic dependencies must be detected');
    assert.ok(cyclicResult.error.includes('Circular') || cyclicResult.error.includes('cycle'));

    const missingDepTasks = [
      { id: 'TASK-01', dependencies: 'TASK-99' }
    ];
    const missingResult = verifyModule.validateTaskDependencies(missingDepTasks);
    assert.strictEqual(missingResult.valid, false, 'Non-existent dependency ID must fail');
  }
});

// 2. check-spec-drift module
let driftModule;
try {
  driftModule = require('../.agents/scripts/check-spec-drift.js');
} catch (err) {
  driftModule = null;
}

test('check-spec-drift: path normalization and matching', () => {
  assert.ok(driftModule, 'Expected check-spec-drift.js to export helper functions');
  if (driftModule.normalizePath && driftModule.isFileCovered) {
    // Normalization handles ./ and backslashes
    assert.strictEqual(driftModule.normalizePath('.\\src\\index.ts'), 'src/index.ts');
    assert.strictEqual(driftModule.normalizePath('./src/routes/app.ts'), 'src/routes/app.ts');

    const declaredTargets = new Set(['src/index.ts', 'src/services/', 'tests/**/*.test.js']);
    assert.strictEqual(driftModule.isFileCovered('src/index.ts', declaredTargets), true);
    assert.strictEqual(driftModule.isFileCovered('src/services/auth.ts', declaredTargets), true);
    assert.strictEqual(driftModule.isFileCovered('tests/unit/login.test.js', declaredTargets), true);
    assert.strictEqual(driftModule.isFileCovered('unmapped/drift.ts', declaredTargets), false);
  }
});

// 3. install-hooks module
let hooksModule;
try {
  hooksModule = require('../.agents/scripts/install-hooks.js');
} catch (err) {
  hooksModule = null;
}

test('install-hooks: detects hooks dir and generates dual-sensor script', () => {
  assert.ok(hooksModule, 'Expected install-hooks.js to export helper functions');
  if (hooksModule.getHooksDir && hooksModule.getHookScript) {
    const hooksDir = hooksModule.getHooksDir();
    assert.ok(hooksDir, 'Hooks dir must be resolved');
    const script = hooksModule.getHookScript();
    assert.ok(script.includes('check-spec-drift.js'), 'Must execute drift sensor');
    assert.ok(script.includes('verify-sdd-integrity.js'), 'Must execute integrity sensor');
  }
});

// 4. auto-discover module
let discoverModule;
try {
  discoverModule = require('../.agents/scripts/auto-discover.js');
} catch (err) {
  discoverModule = null;
}

test('auto-discover: scans manifests and returns technical stack', () => {
  assert.ok(discoverModule, 'Expected auto-discover.js to export functionality');
  if (discoverModule.discoverProject) {
    const discovery = discoverModule.discoverProject(REPO_ROOT);
    assert.ok(discovery, 'Must return discovery object');
    assert.strictEqual(discovery.projectType, 'Node.js');
    assert.ok(discovery.scripts['verify-sdd'], 'Must identify package scripts');
    assert.ok(discovery.markdown.stack.includes('Technology Stack'), 'Must generate STACK markdown');
    assert.ok(discovery.markdown.architecture.includes('System Architecture'), 'Must generate ARCHITECTURE markdown');
  }
});

// 5. create-feature module
let createFeatureModule;
try {
  createFeatureModule = require('../.agents/scripts/create-feature.js');
} catch (err) {
  createFeatureModule = null;
}

test('create-feature: scaffolds feature directory with valid 7-column tasks table', () => {
  assert.ok(createFeatureModule, 'Expected create-feature.js to export scaffolding functions');
  if (createFeatureModule.scaffoldFeature) {
    const testFeatureId = 'scaffold-test-temp';
    const featureDir = path.join(REPO_ROOT, '.specs', 'features', testFeatureId);
    try {
      const result = createFeatureModule.scaffoldFeature(testFeatureId, {
        title: 'Temporary Scaffold Test',
        author: 'Test Agent'
      });
      assert.ok(result.success, 'Scaffolding must succeed');
      assert.ok(fs.existsSync(path.join(featureDir, 'plan.md')), 'plan.md must exist');
      assert.ok(fs.existsSync(path.join(featureDir, 'spec.md')), 'spec.md must exist');
      assert.ok(fs.existsSync(path.join(featureDir, 'tasks.md')), 'tasks.md must exist');

      const tasksContent = fs.readFileSync(path.join(featureDir, 'tasks.md'), 'utf8');
      assert.ok(tasksContent.includes('MetaGPT SOP Schema Contract'), 'Must cite MetaGPT SOP');
      assert.ok(tasksContent.includes('| Status | ID | Type | Description | Target Files | Dependencies | Evidence |'), 'Must include 7 columns');
    } finally {
      if (fs.existsSync(featureDir)) {
        fs.rmSync(featureDir, { recursive: true, force: true });
      }
    }
  }
});

// 6. run-sdd-review module
let reviewRunnerModule;
try {
  reviewRunnerModule = require('../.agents/scripts/run-sdd-review.js');
} catch (err) {
  reviewRunnerModule = null;
}

test('run-sdd-review: formats formal verification report', () => {
  assert.ok(reviewRunnerModule, 'Expected run-sdd-review.js to export report generator');
  if (reviewRunnerModule.generateReport) {
    const report = reviewRunnerModule.generateReport({
      featureId: 'core-sensors-and-automation',
      featureName: 'Core Sensors Robustness & Automation Tooling',
      sensorResults: [
        { name: 'Spec Drift', command: 'node .agents/scripts/check-spec-drift.js', pass: true, signal: '0 drifting files' },
        { name: 'SDD Integrity', command: 'node .agents/scripts/verify-sdd-integrity.js', pass: true, signal: '100% pass' }
      ],
      tasksTotal: 9,
      tasksDone: 9,
      verdict: 'APPROVED',
      rationale: 'All automated sensors passing.'
    });

    assert.ok(report.includes('## 🏁 Verification Report:'), 'Must output standard Verification Report header');
    assert.ok(report.includes('VERDICT: APPROVED') || report.includes('Verdict: APPROVED'), 'Must report verdict');
    assert.ok(report.includes('### 📡 1. Sensor Results'), 'Must include Sensor Results table');
  }
});
