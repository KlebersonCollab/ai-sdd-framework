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
    assert.ok(htmlRes.body.includes('statProgressBar'), 'HTML should contain overall progress bar element');
    assert.ok(htmlRes.body.includes('height: 100%'), 'HTML should style progress-bar-custom with height: 100%');
    assert.ok(htmlRes.body.includes('vis-network'), 'HTML should load vis-network CDN');
    assert.ok(htmlRes.body.includes('navTabMemory'), 'HTML should contain Memory Graph tab');
    assert.ok(htmlRes.body.includes('memoryGraphCanvas'), 'HTML should contain graph canvas');
    assert.ok(htmlRes.body.includes('nodeInspector'), 'HTML should contain node inspector drawer');
    assert.ok(htmlRes.body.includes('function switchView('), 'HTML should define switchView function');
    assert.ok(htmlRes.body.includes('function renderVisMemoryGraph('), 'HTML should define renderVisMemoryGraph function');

    const faviconRes = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/favicon.ico`, (res) => {
        resolve({ status: res.statusCode });
      }).on('error', reject);
    });
    assert.strictEqual(faviconRes.status, 204, 'GET /favicon.ico should return 204');
  } finally {
    await new Promise((resolve) => serverInstance.close(resolve));
  }
});

test('Parser: parseTasksTable handles [x], [X], and spaced variations', () => {
  const sample = `
| Status | ID | Type | Description | Target Files | Dependencies | Evidence |
|---|---|---|---|---|---|---|
| [ x ] | TASK-A | test | Spaced done | \`test.js\` | None | ev1 |
| [X] | TASK-B | feat | Capital done | \`feat.js\` | TASK-A | ev2 |
| [ ] | TASK-C | docs | Pending | \`doc.md\` | TASK-B | |
| [-] | TASK-D | feat | In progress dash | \`wip.js\` | TASK-C | |
| [.] | TASK-E | feat | In progress dot | \`wip2.js\` | TASK-D | |
`;
  const tasks = serveDashboard.parseTasksTable(sample);
  assert.strictEqual(tasks[0].status, 'done');
  assert.strictEqual(tasks[1].status, 'done');
  assert.strictEqual(tasks[2].status, 'pending');
  assert.strictEqual(tasks[3].status, 'in_progress');
  assert.strictEqual(tasks[4].status, 'in_progress');
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

test('Memory Graph: parseMemoryGraph parses entities, relations, observations, and infers nodes', () => {
  if (!serveDashboard.parseMemoryGraph) {
    assert.fail('serveDashboard.parseMemoryGraph function is not defined');
  }

  const sampleJsonl = `
{"type":"entity","name":"core-service","entityType":"service","role":"architecture","status":"active","observations":["Main business logic"]}
{"type":"entity","name":"auth-module","entityType":"module","role":"security","status":"active","observations":["JWT authentication"]}
{"type":"relation","from":"core-service","to":"auth-module","predicate":"DEPENDS_ON","weight":1}
{"type":"relation","from":"core-service","to":"redis-cache","predicate":"USES_CACHE","weight":0.8}
{"type":"observation","entityName":"core-service","content":"Handles user payments"}
`;

  const graph = serveDashboard.parseMemoryGraph(sampleJsonl);
  assert.ok(graph, 'Graph object must be returned');
  assert.strictEqual(graph.nodes.length, 3, 'Should contain 2 declared + 1 inferred entity');

  const coreNode = graph.nodes.find(n => n.id === 'core-service');
  assert.ok(coreNode, 'core-service node must exist');
  assert.strictEqual(coreNode.entityType, 'service');
  assert.strictEqual(coreNode.observations.length, 2, 'Should aggregate inline and separate observations');
  assert.ok(coreNode.observations.includes('Handles user payments'));

  const inferredNode = graph.nodes.find(n => n.id === 'redis-cache');
  assert.ok(inferredNode, 'redis-cache must be inferred');
  assert.strictEqual(inferredNode.entityType, 'inferred');

  assert.strictEqual(graph.edges.length, 2, 'Should have 2 edges');
  assert.strictEqual(graph.edges[0].from, 'core-service');
  assert.strictEqual(graph.edges[0].to, 'auth-module');
  assert.strictEqual(graph.edges[0].label, 'DEPENDS_ON');
  assert.strictEqual(graph.edges[1].to, 'redis-cache');
  assert.strictEqual(graph.edges[1].label, 'USES_CACHE');

  assert.ok(graph.stats, 'Graph stats must be present');
  assert.strictEqual(graph.stats.totalNodes, 3);
  assert.strictEqual(graph.stats.totalEdges, 2);
});

test('HTTP Server: GET /api/memory returns graph data', async () => {
  const serverInstance = await serveDashboard.startServer(0);
  const port = serverInstance.address().port;

  try {
    const memoryRes = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/api/memory`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      }).on('error', reject);
    });

    assert.strictEqual(memoryRes.status, 200, 'GET /api/memory should return 200');
    assert.ok(memoryRes.headers['content-type'].includes('application/json'));
    const parsed = JSON.parse(memoryRes.body);
    assert.ok(Array.isArray(parsed.nodes), 'Memory API should return nodes array');
    assert.ok(Array.isArray(parsed.edges), 'Memory API should return edges array');
    assert.ok(parsed.stats, 'Memory API should return stats');
  } finally {
    await new Promise((resolve) => serverInstance.close(resolve));
  }
});


