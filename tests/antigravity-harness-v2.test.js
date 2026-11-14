/**
 * Test Suite: Antigravity Harness Lifecycle Hooks, Active Drift Scope & Sensors v2
 * AI-SDD Framework | ADR 0009 Verification
 * Uses native node:test and node:assert (zero external dependencies)
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..');

// Safe dynamic imports
function loadModule(relPath) {
  try {
    const fullPath = path.join(REPO_ROOT, relPath);
    delete require.cache[require.resolve(fullPath)];
    return require(fullPath);
  } catch (err) {
    return null;
  }
}

// ==============================================================================
// Test Suite 1: Antigravity Lifecycle Hooks (.agents/hooks.json & sdd-hook.js)
// ==============================================================================

test('AC-1: .agents/hooks.json exists and adheres to Google Antigravity hook schema', () => {
  const hooksJsonPath = path.join(REPO_ROOT, '.agents', 'hooks.json');
  assert.ok(fs.existsSync(hooksJsonPath), 'Expected .agents/hooks.json to exist');

  const hooksConfig = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8'));
  assert.ok(hooksConfig['sdd-context-gate'], 'Expected sdd-context-gate hook entry');
  assert.ok(Array.isArray(hooksConfig['sdd-context-gate'].SessionStart), 'Expected SessionStart array');

  assert.ok(hooksConfig['sdd-tier1-safety-gate'], 'Expected sdd-tier1-safety-gate hook entry');
  assert.ok(Array.isArray(hooksConfig['sdd-tier1-safety-gate'].PreToolUse), 'Expected PreToolUse array');
  assert.strictEqual(hooksConfig['sdd-tier1-safety-gate'].PreToolUse[0].matcher, 'run_command');

  assert.ok(hooksConfig['sdd-drift-stop-gate'], 'Expected sdd-drift-stop-gate hook entry');
  assert.ok(Array.isArray(hooksConfig['sdd-drift-stop-gate'].Stop), 'Expected Stop array');
});

test('AC-1: sdd-hook.js SessionStart injects STATE.md, memory, and knowledge base into systemMessage', () => {
  const hookMod = loadModule('.agents/scripts/sdd-hook.js');
  assert.ok(hookMod, 'Expected .agents/scripts/sdd-hook.js to exist and export handlers');
  assert.strictEqual(typeof hookMod.handleSessionStart, 'function');

  const res = hookMod.handleSessionStart({
    conversationId: 'test-conv-123',
    workspacePaths: [REPO_ROOT],
    modelName: 'auto'
  });

  assert.ok(res && Array.isArray(res.injectSteps), 'Expected injectSteps array in SessionStart response');
  assert.strictEqual(res.injectSteps.length, 1);
  const sysMsg = res.injectSteps[0].systemMessage && res.injectSteps[0].systemMessage.systemMessage;
  assert.ok(typeof sysMsg === 'string' && sysMsg.length > 20, 'Expected non-empty systemMessage string');
  assert.ok(sysMsg.includes('[SDD AUTO-REHYDRATION]'), 'Expected SDD auto-rehydration header');
  assert.ok(sysMsg.includes('Active Memory Entities'), 'Expected active memory entities summary');
});

test('AC-2: sdd-hook.js PreToolUse blocks Tier 1 prohibited commands and allows safe commands', () => {
  const hookMod = loadModule('.agents/scripts/sdd-hook.js');
  assert.ok(hookMod, 'Expected sdd-hook.js module');
  assert.strictEqual(typeof hookMod.handlePreToolUse, 'function');

  // 1. Block --no-verify
  const denyNoVerify = hookMod.handlePreToolUse({
    toolCall: {
      name: 'run_command',
      args: { CommandLine: 'git commit -m "wip" --no-verify' }
    }
  });
  assert.strictEqual(denyNoVerify.decision, 'deny');
  assert.ok(denyNoVerify.reason.includes('--no-verify') || denyNoVerify.reason.includes('Prohibition'));

  // 2. Block git reset --hard
  const denyReset = hookMod.handlePreToolUse({
    toolCall: {
      name: 'run_command',
      args: { CommandLine: 'git reset --hard HEAD~1' }
    }
  });
  assert.strictEqual(denyReset.decision, 'deny');

  // 3. Block git push --force
  const denyForcePush = hookMod.handlePreToolUse({
    toolCall: {
      name: 'run_command',
      args: { CommandLine: 'git push --force origin main' }
    }
  });
  assert.strictEqual(denyForcePush.decision, 'deny');

  // 4. Allow npm test
  const allowTest = hookMod.handlePreToolUse({
    toolCall: {
      name: 'run_command',
      args: { CommandLine: 'npm test' }
    }
  });
  assert.strictEqual(allowTest.decision, 'allow');
});

test('AC-3: sdd-hook.js Stop enforces single-turn anti-loop guardrail on drifting files', () => {
  const hookMod = loadModule('.agents/scripts/sdd-hook.js');
  assert.ok(hookMod, 'Expected sdd-hook.js module');
  assert.strictEqual(typeof hookMod.handleStop, 'function');

  // 1. First stop (executionNum: 1) with drifting files -> decision: "continue"
  const stopContinue = hookMod.handleStop(
    { terminationReason: 'NO_TOOL_CALL', executionNum: 1 },
    { mockDriftResult: { ok: false, driftingFiles: ['src/orphan.js'] } }
  );
  assert.strictEqual(stopContinue.decision, 'continue');
  assert.ok(stopContinue.reason.includes('src/orphan.js'));

  // 2. Second stop (executionNum: 2) even with drifting files -> anti-loop allows stop
  const stopAntiLoop = hookMod.handleStop(
    { terminationReason: 'NO_TOOL_CALL', executionNum: 2 },
    { mockDriftResult: { ok: false, driftingFiles: ['src/orphan.js'] } }
  );
  assert.strictEqual(stopAntiLoop.decision, 'allow');

  // 3. First stop with 0 drifting files -> decision: "allow"
  const stopClean = hookMod.handleStop(
    { terminationReason: 'NO_TOOL_CALL', executionNum: 1 },
    { mockDriftResult: { ok: true, driftingFiles: [] } }
  );
  assert.strictEqual(stopClean.decision, 'allow');
});

test('AC-7: sdd-hook.js CLI handles malformed or empty stdin payload gracefully with exit code 0', () => {
  const hookScript = path.join(REPO_ROOT, '.agents', 'scripts', 'sdd-hook.js');
  assert.ok(fs.existsSync(hookScript), 'Expected sdd-hook.js to exist');

  const proc = spawnSync(process.execPath, [hookScript, 'pre-tool-use'], {
    cwd: path.join(REPO_ROOT, '.agents'),
    input: 'not-valid-json{{{',
    encoding: 'utf8'
  });

  assert.strictEqual(proc.status, 0, 'Hook CLI must exit with code 0 on malformed stdin');
  const parsed = JSON.parse(proc.stdout.trim());
  assert.strictEqual(parsed.decision, 'allow');
});

// ==============================================================================
// Test Suite 2: Active Task Scope Filtering in check-spec-drift.js
// ==============================================================================

test('AC-4: check-spec-drift.js getDeclaredTargetFiles filters active tasks ([ ] and [-]) when activeOnly is true', () => {
  const driftMod = loadModule('.agents/scripts/check-spec-drift.js');
  assert.ok(driftMod, 'Expected check-spec-drift.js module');
  assert.strictEqual(typeof driftMod.extractTargetsFromTasksMarkdown, 'function');

  const sampleTasksMd = `
| Status | ID | Type | Description | Target Files | Dependencies | Evidence |
|---|---|---|---|---|---|---|
| [x] | TASK-01 | test | Completed test | \`tests/old-completed.test.js\` | None | done |
| [-] | TASK-02 | feat | In progress | \`src/in-progress.js\` | TASK-01 | |
| [ ] | TASK-03 | feat | Pending task | \`src/pending.js\` | TASK-02 | |
`;

  const activeSet = driftMod.extractTargetsFromTasksMarkdown(sampleTasksMd, { activeOnly: true });
  assert.strictEqual(activeSet.has('tests/old-completed.test.js'), false, 'Completed [x] task file must be excluded when activeOnly is true');
  assert.strictEqual(activeSet.has('src/in-progress.js'), true, 'In-progress [-] task file must be included');
  assert.strictEqual(activeSet.has('src/pending.js'), true, 'Pending [ ] task file must be included');

  const allSet = driftMod.extractTargetsFromTasksMarkdown(sampleTasksMd, { activeOnly: false });
  assert.strictEqual(allSet.has('tests/old-completed.test.js'), true, 'Completed task file included when activeOnly is false');
});

// ==============================================================================
// Test Suite 3: Sensors v2 (run-spec-review.js & generate-drift-report.js)
// ==============================================================================

test('AC-5: run-spec-review.js detects Portuguese ambiguities and audits tasks.md SOP compliance', () => {
  const reviewMod = loadModule('.agents/scripts/run-spec-review.js');
  assert.ok(reviewMod, 'Expected run-spec-review.js module');
  assert.strictEqual(typeof reviewMod.auditTasksSop, 'function');

  // 1. Portuguese ambiguity detection
  const ptSpec = 'O sistema deve ser muito rápido, robusto e simples de operar.';
  const ambiguities = reviewMod.detectAmbiguities(ptSpec);
  const detectedWords = ambiguities.map(a => a.word.toLowerCase());
  assert.ok(detectedWords.includes('rápido'), 'Must detect "rápido"');
  assert.ok(detectedWords.includes('robusto'), 'Must detect "robusto"');
  assert.ok(detectedWords.includes('simples'), 'Must detect "simples"');

  // 2. SOP Task Audit: feat before test and >3 target files
  const badTasksMd = `
| Status | ID | Type | Description | Target Files | Dependencies | Evidence |
|---|---|---|---|---|---|---|
| [ ] | TASK-01 | feat | Code before test | \`a.js\`, \`b.js\`, \`c.js\`, \`d.js\` | None | |
| [ ] | TASK-02 | test | Test after code | \`tests/a.test.js\` | TASK-01 | |
`;
  const sopAudit = reviewMod.auditTasksSop(badTasksMd);
  assert.strictEqual(sopAudit.valid, false, 'Expected SOP audit to fail on feat-before-test and >3 target files');
  assert.ok(sopAudit.issues.some(i => i.includes('TASK-01') && i.includes('4')), 'Must flag >3 target files');
  assert.ok(sopAudit.issues.some(i => i.toLowerCase().includes('test')), 'Must flag test-first ordering violation');
});

test('AC-6: generate-drift-report.js detects Architectural Divergence in zero-dependency scripts', () => {
  const semDriftMod = loadModule('.agents/scripts/generate-drift-report.js');
  assert.ok(semDriftMod, 'Expected generate-drift-report.js module');
  assert.strictEqual(typeof semDriftMod.detectArchitecturalDivergence, 'function');

  const files = [
    {
      file: '.agents/scripts/custom-sensor.js',
      content: `
        const fs = require('fs');
        const axios = require('axios');
        module.exports = {};
      `
    }
  ];

  const divergences = semDriftMod.detectArchitecturalDivergence(files);
  assert.ok(divergences.length > 0, 'Expected external package axios in .agents/scripts/ to be flagged');
  assert.ok(divergences[0].includes('axios'));
});

// ==============================================================================
// Test Suite 4: Knowledge Base & Multi-Harness Rule Parity
// ==============================================================================

test('BR-6: .specs/knowledge/ contains canonical patterns and anti-patterns and harness rules are synced', () => {
  const patternsDir = path.join(REPO_ROOT, '.specs', 'knowledge', 'patterns');
  const antiPatternsDir = path.join(REPO_ROOT, '.specs', 'knowledge', 'anti-patterns');

  const patterns = fs.readdirSync(patternsDir).filter(f => f.endsWith('.md'));
  const antiPatterns = fs.readdirSync(antiPatternsDir).filter(f => f.endsWith('.md'));

  assert.ok(patterns.length >= 2, `Expected at least 2 patterns, found ${patterns.length}`);
  assert.ok(antiPatterns.length >= 2, `Expected at least 2 anti-patterns, found ${antiPatterns.length}`);

  for (const ruleFile of ['.cursorrules', '.windsurfrules', '.clinerules']) {
    const content = fs.readFileSync(path.join(REPO_ROOT, ruleFile), 'utf8');
    assert.ok(content.includes('spec-review'), `${ruleFile} must reference spec-review command`);
    assert.ok(content.includes('drift-report'), `${ruleFile} must reference drift-report command`);
  }
});

test('Installer & Docs Sync: setup.ps1, setup.sh, README.md, and docs/index.html include Antigravity v2 & Knowledge Base', () => {
  const setupPs1 = fs.readFileSync(path.join(REPO_ROOT, 'setup.ps1'), 'utf8');
  const setupSh = fs.readFileSync(path.join(REPO_ROOT, 'setup.sh'), 'utf8');
  const readme = fs.readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8');
  const docsHtml = fs.readFileSync(path.join(REPO_ROOT, 'docs', 'index.html'), 'utf8');

  assert.ok(setupPs1.includes('knowledge\\patterns') || setupPs1.includes('knowledge/patterns'), 'setup.ps1 must seed .specs/knowledge/patterns');
  assert.ok(setupSh.includes('.specs/knowledge/patterns'), 'setup.sh must seed .specs/knowledge/patterns');
  assert.ok(readme.includes('hooks.json') && readme.includes('sdd-hook.js'), 'README.md must document hooks.json and sdd-hook.js');
  assert.ok(docsHtml.includes('ADR 0009') && docsHtml.includes('antigravity-harness-v2'), 'docs/index.html must include ADR 0009 and antigravity-harness-v2');
});

