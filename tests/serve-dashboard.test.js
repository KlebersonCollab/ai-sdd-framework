/**
 * Test Suite & Sensor for Specs Dashboard
 * Tests markdown parsing and HTTP server endpoints using node:test and node:assert.
 */

const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const path = require('node:path');

// Target module to be implemented in TASK-02 and TASK-03
let serveDashboard;
try {
  serveDashboard = require('../.agents/scripts/serve-dashboard.js');
} catch (err) {
  serveDashboard = null;
}

test('Module existence', () => {
  assert.ok(serveDashboard, 'Expected .agents/scripts/serve-dashboard.js to exist and export functionality');
});

test('Parser: parseTasksTable extracts 7-column MetaGPT tasks correctly', (t) => {
  if (!serveDashboard || !serveDashboard.parseTasksTable) {
    assert.fail('serveDashboard.parseTasksTable function is not defined');
  }

  const sampleMarkdown = `
| Status | ID | Type | Description | Target Files | Dependencies | Evidence |
|---|---|---|---|---|---|---|
| [x] | TASK-01 | test | Setup test harness | \`tests/example.test.js\` | None | git-abc1234 |
| [ ] | TASK-02 | feat | Implement core logic | \`src/core.js\` | TASK-01 | |
`;

  const tasks = serveDashboard.parseTasksTable(sampleMarkdown);
  assert.strictEqual(tasks.length, 2, 'Should parse exactly 2 tasks');

  assert.strictEqual(tasks[0].status, 'done');
  assert.strictEqual(tasks[0].id, 'TASK-01');
  assert.strictEqual(tasks[0].type, 'test');
  assert.strictEqual(tasks[0].description, 'Setup test harness');
  assert.strictEqual(tasks[0].dependencies, 'None');
  assert.strictEqual(tasks[0].evidence, 'git-abc1234');

  assert.strictEqual(tasks[1].status, 'pending');
  assert.strictEqual(tasks[1].id, 'TASK-02');
  assert.strictEqual(tasks[1].type, 'feat');
});

test('Parser: parseFeature parses specs-dashboard feature directory', (t) => {
  if (!serveDashboard || !serveDashboard.parseFeature) {
    assert.fail('serveDashboard.parseFeature function is not defined');
  }

  const featureDir = path.resolve(__dirname, '../.specs/features/specs-dashboard');
  const feature = serveDashboard.parseFeature(featureDir);

  assert.ok(feature, 'Feature object should be returned');
  assert.strictEqual(feature.id, 'specs-dashboard');
  assert.ok(feature.title, 'Feature should have a parsed title');
  assert.ok(Array.isArray(feature.userStories), 'userStories should be an array');
  assert.ok(Array.isArray(feature.acceptanceCriteria), 'acceptanceCriteria should be an array');
  assert.ok(Array.isArray(feature.tasks), 'tasks should be an array');
  assert.ok(typeof feature.completionRate === 'number', 'completionRate should be a number');
});

test('HTTP Server: GET / and GET /api/features', async (t) => {
  if (!serveDashboard || !serveDashboard.startServer) {
    assert.fail('serveDashboard.startServer function is not defined');
  }

  const serverInstance = await serveDashboard.startServer(0); // Random available port
  const port = serverInstance.address().port;

  try {
    // 1. Test GET /api/features
    const apiRes = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/api/features`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      }).on('error', reject);
    });

    assert.strictEqual(apiRes.status, 200, 'GET /api/features should return 200');
    assert.ok(apiRes.headers['content-type'].includes('application/json'));
    const parsedApi = JSON.parse(apiRes.body);
    assert.ok(Array.isArray(parsedApi.features), 'API should return features array');

    // 2. Test GET /
    const htmlRes = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      }).on('error', reject);
    });

    assert.strictEqual(htmlRes.status, 200, 'GET / should return 200');
    assert.ok(htmlRes.headers['content-type'].includes('text/html'));
    assert.ok(htmlRes.body.includes('Specs Dashboard'), 'HTML should contain title');
    assert.ok(htmlRes.body.includes('bootstrap'), 'HTML should reference bootstrap');
  } finally {
    await new Promise((resolve) => serverInstance.close(resolve));
  }
});

test('Enhanced Parser: parseUserStory decomposes role, action, and benefit', () => {
  if (!serveDashboard.parseUserStory) {
    assert.fail('serveDashboard.parseUserStory function is not defined');
  }

  const rawUS = '- **US-1**: As a developer, I want to launch a local dashboard, so that I can visually track SDD feature progress.';
  const parsed = serveDashboard.parseUserStory(rawUS);

  assert.strictEqual(parsed.id, 'US-1');
  assert.ok(parsed.role.toLowerCase().includes('developer'));
  assert.ok(parsed.action.toLowerCase().includes('launch a local dashboard'));
  assert.ok(parsed.benefit.toLowerCase().includes('track sdd feature progress'));
});

test('Enhanced Parser: parsePlanSections extracts problem, inScope, outOfScope', () => {
  if (!serveDashboard.parsePlanSections) {
    assert.fail('serveDashboard.parsePlanSections function is not defined');
  }

  const samplePlan = `
# Plan: Sample
## 1. Problem Statement & Motivation
Need better visibility.
## 2. Scope & Boundaries
- **In Scope**:
  - Item Alpha
  - Item Beta
- **Out of Scope**:
  - Item Gamma
## 3. High-Level Approach
Step 1 then Step 2.
`;

  const plan = serveDashboard.parsePlanSections(samplePlan);
  assert.ok(plan.problemStatement.includes('Need better visibility'));
  assert.strictEqual(plan.inScope.length, 2);
  assert.strictEqual(plan.inScope[0], 'Item Alpha');
  assert.strictEqual(plan.outOfScope.length, 1);
  assert.strictEqual(plan.outOfScope[0], 'Item Gamma');
  assert.ok(plan.approach.includes('Step 1'));
});

test('Enhanced Parser: parseAcceptanceCriteria decomposes Gherkin Given/When/Then clauses', () => {
  if (!serveDashboard.parseAcceptanceCriteria) {
    assert.fail('serveDashboard.parseAcceptanceCriteria function is not defined');
  }

  const sampleSpec = `
## 3. Acceptance Criteria (BDD)
### Happy Path (Success Scenarios)
- **AC-1: Server Start**
  - **Given** server is installed
  - **When** start command runs
  - **Then** port 3000 opens
  - **And** returns 200 OK
`;

  const criteria = serveDashboard.parseAcceptanceCriteria(sampleSpec);
  assert.strictEqual(criteria.length, 1);
  assert.strictEqual(criteria[0].id, 'AC-1');
  assert.strictEqual(criteria[0].category, 'Happy Path');
  assert.strictEqual(criteria[0].clauses.length, 4);
  assert.strictEqual(criteria[0].clauses[0].keyword, 'GIVEN');
  assert.strictEqual(criteria[0].clauses[1].keyword, 'WHEN');
  assert.strictEqual(criteria[0].clauses[2].keyword, 'THEN');
  assert.strictEqual(criteria[0].clauses[3].keyword, 'AND');
});

