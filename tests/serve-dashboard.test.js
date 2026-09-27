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
    assert.ok(htmlRes.body.includes('id="app"'), 'HTML should contain Vue 3 mount element #app');
    assert.ok(htmlRes.body.includes('/assets/index-'), 'HTML should reference compiled Vite assets');
    assert.ok(!htmlRes.body.includes('bootstrap.min.css'), 'Legacy Bootstrap CSS CDN must be removed');
    assert.ok(!htmlRes.body.includes('bootstrap.bundle.min.js'), 'Legacy Bootstrap JS CDN must be removed');

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

test('Task Mutation: updateTaskInMarkdown modifies status and records feedback in Markdown table', () => {
  if (!serveDashboard || !serveDashboard.updateTaskInMarkdown) {
    assert.fail('serveDashboard.updateTaskInMarkdown function is not defined');
  }

  const initialMarkdown = `
| Status | ID | Type | Description | Target Files | Dependencies | Evidence |
|---|---|---|---|---|---|---|
| [ ] | TASK-01 | feat | First task | \`file1.js\` | None | |
| [x] | TASK-02 | test | Second task | \`file2.js\` | TASK-01 | git-abc |
`;

  // 1. Move TASK-01 from pending to in_progress
  const updatedInProgress = serveDashboard.updateTaskInMarkdown(initialMarkdown, 'TASK-01', 'in_progress');
  assert.ok(updatedInProgress.includes('| [-] | TASK-01 | feat | First task | `file1.js` | None | |'), 'Should update TASK-01 to [-]');

  // 2. Move TASK-02 from done back to pending with feedback
  const updatedFeedback = serveDashboard.updateTaskInMarkdown(initialMarkdown, 'TASK-02', 'pending', 'Revision: tests need edge cases');
  assert.ok(updatedFeedback.includes('| [ ] | TASK-02 | test | Second task | `file2.js` | TASK-01 | [Reverted] Revision: tests need edge cases |'), 'Should update TASK-02 to [ ] and append feedback');

  // 3. Move TASK-01 to done with evidence
  const updatedDone = serveDashboard.updateTaskInMarkdown(initialMarkdown, 'TASK-01', 'done', 'git-99999');
  assert.ok(updatedDone.includes('| [x] | TASK-01 | feat | First task | `file1.js` | None | git-99999 |'), 'Should update TASK-01 to [x] with evidence');
});

test('HTTP Server: PATCH /api/features/:featureId/tasks/:taskId modifies tasks.md and returns updated task', async () => {
  const fs = require('node:fs');
  const serverInstance = await serveDashboard.startServer(0);
  const port = serverInstance.address().port;

  // Create temporary test feature directory
  const testFeatureDir = path.resolve(__dirname, '../.specs/features/_test-temp-feature');
  if (!fs.existsSync(testFeatureDir)) fs.mkdirSync(testFeatureDir, { recursive: true });

  const tempTasksFile = path.join(testFeatureDir, 'tasks.md');
  const tempTasksMd = `
| Status | ID | Type | Description | Target Files | Dependencies | Evidence |
|---|---|---|---|---|---|---|
| [ ] | TASK-TEMP | feat | Temporary task | \`src/temp.js\` | None | |
`;
  fs.writeFileSync(tempTasksFile, tempTasksMd, 'utf8');

  try {
    const payload = JSON.stringify({ status: 'in_progress' });
    const patchRes = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: '/api/features/_test-temp-feature/tasks/TASK-TEMP',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    assert.strictEqual(patchRes.status, 200, 'PATCH /api/features/:id/tasks/:id should return 200');
    const resBody = JSON.parse(patchRes.body);
    assert.strictEqual(resBody.success, true);
    assert.strictEqual(resBody.task.id, 'TASK-TEMP');
    assert.strictEqual(resBody.task.status, 'in_progress');

    // Verify physical file on disk was modified
    const modifiedOnDisk = fs.readFileSync(tempTasksFile, 'utf8');
    assert.ok(modifiedOnDisk.includes('| [-] | TASK-TEMP |'), 'Physical tasks.md should have [-] checkbox');
  } finally {
    if (fs.existsSync(testFeatureDir)) {
      fs.rmSync(testFeatureDir, { recursive: true, force: true });
    }
    await new Promise((resolve) => serverInstance.close(resolve));
  }
});

test('HTTP Server: Static Asset Serving serves from dist directory when present', async () => {
  const fs = require('node:fs');
  const serverInstance = await serveDashboard.startServer(0);
  const port = serverInstance.address().port;

  const distDir = path.resolve(__dirname, '../.agents/dashboard/dist');
  const testAssetDir = path.join(distDir, 'assets');
  if (!fs.existsSync(testAssetDir)) fs.mkdirSync(testAssetDir, { recursive: true });

  const testJsFile = path.join(testAssetDir, 'test-bundle.js');
  fs.writeFileSync(testJsFile, 'console.log("Cockpit SPA");', 'utf8');

  try {
    const assetRes = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/assets/test-bundle.js`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      }).on('error', reject);
    });

    assert.strictEqual(assetRes.status, 200, 'Should serve static asset with 200');
    assert.ok(assetRes.headers['content-type'].includes('javascript'), 'Content type should be javascript');
    assert.strictEqual(assetRes.body, 'console.log("Cockpit SPA");');
  } finally {
    if (fs.existsSync(testJsFile)) fs.unlinkSync(testJsFile);
    await new Promise((resolve) => serverInstance.close(resolve));
  }
});

test('HTTP Server: Terminal WebSocket upgrades on /api/terminal', async () => {
  const serverInstance = await serveDashboard.startServer(0);
  const port = serverInstance.address().port;

  try {
    const upgradeRes = await new Promise((resolve, reject) => {
      const req = http.request({
        port,
        path: '/api/terminal',
        headers: {
          'Connection': 'Upgrade',
          'Upgrade': 'websocket',
          'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
          'Sec-WebSocket-Version': '13'
        }
      });
      req.on('upgrade', (res, socket, head) => {
        socket.destroy();
        resolve({ status: res.statusCode, headers: res.headers });
      });
      req.on('response', (res) => {
        resolve({ status: res.statusCode, headers: res.headers });
      });
      req.on('error', reject);
      req.end();
    });

    assert.strictEqual(upgradeRes.status, 101, 'WebSocket upgrade should return 101 Switching Protocols');
    assert.strictEqual(upgradeRes.headers['upgrade'].toLowerCase(), 'websocket');
  } finally {
    await new Promise((resolve) => serverInstance.close(resolve));
  }
});

test('HTTP Server: GET /api/terminal-config returns detected OS terminal font and shell', async () => {
  const serverInstance = await serveDashboard.startServer(0);
  const port = serverInstance.address().port;

  try {
    const configRes = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/api/terminal-config`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      }).on('error', reject);
    });

    assert.strictEqual(configRes.status, 200, 'GET /api/terminal-config should return 200');
    const parsed = JSON.parse(configRes.body);
    assert.ok(parsed.fontFamily, 'Must return fontFamily');
    assert.ok(parsed.shell, 'Must return shell');
    if (process.platform === 'win32') {
      assert.ok(parsed.shell.includes('powershell'), 'Shell on Windows must be powershell');
    }
  } finally {
    await new Promise((resolve) => serverInstance.close(resolve));
  }
});

test('HTTP Server: GET /api/project returns parsed project vision, roadmap, state, context, and ADRs', async () => {
  const serverInstance = await serveDashboard.startServer(0);
  const port = serverInstance.address().port;

  try {
    const res = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/api/project`, (r) => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => resolve({ status: r.statusCode, headers: r.headers, body: data }));
      }).on('error', reject);
    });

    assert.strictEqual(res.status, 200, 'GET /api/project should return 200');
    assert.ok(res.headers['content-type'].includes('application/json'));
    const parsed = JSON.parse(res.body);
    assert.ok(parsed.project, 'Must contain project vision');
    assert.ok(parsed.roadmap, 'Must contain roadmap');
    assert.ok(parsed.state, 'Must contain state');
    assert.ok(parsed.context, 'Must contain context');
    assert.ok(Array.isArray(parsed.adrs), 'Must contain adrs array');
    assert.ok(parsed.adrs.length >= 3, 'Must contain at least 3 ADRs');
    const adr0001 = parsed.adrs.find(a => a.id.includes('0001'));
    assert.ok(adr0001, 'ADR 0001 must exist');
    assert.strictEqual(adr0001.status, 'superseded', 'ADR 0001 status must be superseded');
  } finally {
    await new Promise((resolve) => serverInstance.close(resolve));
  }
});

test('HTTP Server: GET /api/codebase returns technical map, stack, architecture, conventions, and concerns', async () => {
  const serverInstance = await serveDashboard.startServer(0);
  const port = serverInstance.address().port;

  try {
    const res = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/api/codebase`, (r) => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => resolve({ status: r.statusCode, headers: r.headers, body: data }));
      }).on('error', reject);
    });

    assert.strictEqual(res.status, 200, 'GET /api/codebase should return 200');
    const parsed = JSON.parse(res.body);
    assert.ok(parsed.stack, 'Must contain stack');
    assert.ok(parsed.architecture, 'Must contain architecture');
    assert.ok(parsed.conventions, 'Must contain conventions');
    assert.ok(parsed.concerns, 'Must contain concerns');
    assert.ok(parsed.technicalMap, 'Must contain technicalMap');
  } finally {
    await new Promise((resolve) => serverInstance.close(resolve));
  }
});

test('HTTP Server: GET /api/rules returns tier 1 prohibitions, quality enforcement, and token optimization', async () => {
  const serverInstance = await serveDashboard.startServer(0);
  const port = serverInstance.address().port;

  try {
    const res = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/api/rules`, (r) => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => resolve({ status: r.statusCode, headers: r.headers, body: data }));
      }).on('error', reject);
    });

    assert.strictEqual(res.status, 200, 'GET /api/rules should return 200');
    const parsed = JSON.parse(res.body);
    assert.ok(parsed.prohibitions, 'Must contain prohibitions');
    assert.ok(parsed.quality, 'Must contain quality');
    assert.ok(parsed.tokenOptimization, 'Must contain tokenOptimization');
  } finally {
    await new Promise((resolve) => serverInstance.close(resolve));
  }
});

test('HTTP Server: GET /api/knowledge returns patterns and anti-patterns', async () => {
  const serverInstance = await serveDashboard.startServer(0);
  const port = serverInstance.address().port;

  try {
    const res = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/api/knowledge`, (r) => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => resolve({ status: r.statusCode, headers: r.headers, body: data }));
      }).on('error', reject);
    });

    assert.strictEqual(res.status, 200, 'GET /api/knowledge should return 200');
    const parsed = JSON.parse(res.body);
    assert.ok(Array.isArray(parsed.patterns), 'Must contain patterns array');
    assert.ok(Array.isArray(parsed.antiPatterns), 'Must contain antiPatterns array');
  } finally {
    await new Promise((resolve) => serverInstance.close(resolve));
  }
});


