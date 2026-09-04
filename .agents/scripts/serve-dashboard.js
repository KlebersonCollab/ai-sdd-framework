#!/usr/bin/env node

/**
 * Specs Dashboard — Real-Time Visual Documentation & Cascade Viewer
 * AI-SDD Framework | Spec Driven Development Lifecycle
 * 
 * Zero-dependency native Node.js HTTP server.
 * Renders .specs/features in a cascading hierarchy: Feature -> US -> BDD -> Tasks.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../..');
const SPECS_FEATURES_DIR = path.join(REPO_ROOT, '.specs', 'features');

/**
 * Parses a 7-column or 5-column MetaGPT tasks table from Markdown
 * @param {string} content
 * @returns {Array<object>}
 */
function parseTasksTable(content) {
  if (!content) return [];
  const lines = content.split('\n');
  const tasks = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.includes('Target Files') || trimmed.includes('---')) continue;
    const columns = trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());

    if (columns.length < 5) continue;

    // 7-column schema: Status (0), ID (1), Type (2), Description (3), Target Files (4), Dependencies (5), Evidence (6)
    // 5-column schema: Status (0), ID (1), Description (2), Target Files (3), Evidence (4)
    let rawStatus = columns[0] || '';
    let id = columns[1] || '';
    let type = 'task';
    let description = '';
    let targetFiles = '';
    let dependencies = 'None';
    let evidence = '';

    if (columns.length >= 7) {
      type = columns[2] || 'task';
      description = columns[3] || '';
      targetFiles = columns[4] || '';
      dependencies = columns[5] || 'None';
      evidence = columns[6] || '';
    } else {
      description = columns[2] || '';
      targetFiles = columns[3] || '';
      evidence = columns[4] || '';
    }

    let status = 'pending';
    if (/^\[x\]/i.test(rawStatus)) {
      status = 'done';
    } else if (/^\[-\.\]/i.test(rawStatus)) {
      status = 'in_progress';
    }

    tasks.push({
      status,
      rawStatus,
      id,
      type,
      description,
      targetFiles,
      dependencies,
      evidence
    });
  }

  return tasks;
}

/**
 * Extracts sections, user stories and acceptance criteria from Markdown files
 * @param {string} featureDir
 * @returns {object}
 */
function parseFeature(featureDir) {
  const featureId = path.basename(featureDir);
  const planPath = path.join(featureDir, 'plan.md');
  const specPath = path.join(featureDir, 'spec.md');
  const tasksPath = path.join(featureDir, 'tasks.md');

  let title = featureId;
  let problemStatement = '';
  let userStories = [];
  let acceptanceCriteria = [];
  let businessRules = [];
  let tasks = [];

  // 1. Parse plan.md
  if (fs.existsSync(planPath)) {
    const planContent = fs.readFileSync(planPath, 'utf8');
    const titleMatch = planContent.match(/^#\s+Plan:\s*(.+)$/m) || planContent.match(/^#\s+(.+)$/m);
    if (titleMatch) title = titleMatch[1].trim();

    const problemMatch = planContent.match(/##\s+1\.\s+Problem Statement[\s\S]*?(?=##|$)/i);
    if (problemMatch) {
      problemStatement = problemMatch[0].replace(/##\s+1\.\s+Problem Statement.*?\n/i, '').trim();
    }
  }

  // 2. Parse spec.md
  if (fs.existsSync(specPath)) {
    const specContent = fs.readFileSync(specPath, 'utf8');
    if (title === featureId) {
      const specTitleMatch = specContent.match(/^#\s+Specification:\s*(.+)$/m) || specContent.match(/^#\s+(.+)$/m);
      if (specTitleMatch) title = specTitleMatch[1].trim();
    }

    // Extract User Stories: - **US-X**: ...
    const usMatches = specContent.match(/-\s+\*\*US-[^:]+\*\*:\s*.+/g);
    if (usMatches) {
      userStories = usMatches.map(m => m.replace(/^-\s+/, '').trim());
    }

    // Extract Business Rules: - **BR-X**: ...
    const brMatches = specContent.match(/-\s+\*\*BR-[^:]+\*\*:\s*.+/g);
    if (brMatches) {
      businessRules = brMatches.map(m => m.replace(/^-\s+/, '').trim());
    }

    // Extract Acceptance Criteria: - **AC-X: ...**
    const acRegex = /-\s+\*\*(AC-\d+:[^*]+)\*\*([\s\S]*?)(?=-\s+\*\*AC-\d+:|##|$)/g;
    let match;
    while ((match = acRegex.exec(specContent)) !== null) {
      const acTitle = match[1].trim();
      const acDetails = match[2].trim()
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('-') || l.startsWith('*'))
        .map(l => l.replace(/^[-*]\s+/, ''));
      acceptanceCriteria.push({
        id: acTitle.split(':')[0].trim(),
        title: acTitle,
        details: acDetails
      });
    }
  }

  // 3. Parse tasks.md
  if (fs.existsSync(tasksPath)) {
    const tasksContent = fs.readFileSync(tasksPath, 'utf8');
    tasks = parseTasksTable(tasksContent);
  }

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return {
    id: featureId,
    title,
    problemStatement,
    userStories,
    businessRules,
    acceptanceCriteria,
    tasks,
    totalTasks: tasks.length,
    completedTasks: completedCount,
    completionRate
  };
}

/**
 * Retrieves and parses all features under .specs/features/
 * @returns {Array<object>}
 */
function getAllFeatures() {
  if (!fs.existsSync(SPECS_FEATURES_DIR)) return [];
  const entries = fs.readdirSync(SPECS_FEATURES_DIR, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => parseFeature(path.join(SPECS_FEATURES_DIR, entry.name)));
}

/**
 * Starts the native HTTP server serving the dashboard and /api/features endpoint
 * @param {number} port
 * @returns {Promise<http.Server>}
 */
function startServer(port = 3000) {
  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // CORS & Common headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && pathname === '/api/features') {
      try {
        const features = getAllFeatures();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ features, count: features.length, timestamp: new Date().toISOString() }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
      const html = renderDashboardHtml();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  });

  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      resolve(server);
    });
    server.on('error', reject);
  });
}

function renderDashboardHtml() {
  return `<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Specs Dashboard — AI-SDD Framework</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
  <div class="container py-4">
    <h1>Specs Dashboard</h1>
  </div>
</body>
</html>`;
}

module.exports = {
  parseTasksTable,
  parseFeature,
  getAllFeatures,
  startServer
};

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  startServer(PORT).then(server => {
    const actualPort = server.address().port;
    console.log(`\n🚀 [SPECS DASHBOARD] Servidor ativo em http://localhost:${actualPort}\n`);
  });
}
