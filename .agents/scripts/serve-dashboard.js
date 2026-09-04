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
  return "<!DOCTYPE html>\n<html lang=\"en\" data-bs-theme=\"dark\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Specs Dashboard — AI-SDD Framework</title>\n  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n  <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n  <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap\" rel=\"stylesheet\">\n  <link href=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css\" rel=\"stylesheet\">\n  <style>\n    :root {\n      --canvas: #010102;\n      --surface-1: #0f1011;\n      --surface-2: #141516;\n      --surface-3: #18191a;\n      --hairline: #23252a;\n      --hairline-strong: #34343a;\n      --primary: #5e6ad2;\n      --primary-hover: #828fff;\n      --primary-focus: rgba(94, 106, 210, 0.25);\n      --ink: #f7f8f8;\n      --ink-muted: #8a8f98;\n      --ink-subtle: #62666d;\n      --semantic-success: #27a644;\n      --semantic-warning: #d97706;\n      --radius-sm: 6px;\n      --radius-md: 10px;\n      --radius-lg: 14px;\n    }\n\n    body {\n      background-color: var(--canvas);\n      color: var(--ink);\n      font-family: 'Inter', -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n      min-height: 100vh;\n      -webkit-font-smoothing: antialiased;\n    }\n\n    code, pre, .font-mono {\n      font-family: 'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace;\n    }\n\n    /* Navbar */\n    .navbar-custom {\n      background-color: rgba(15, 16, 17, 0.85);\n      backdrop-filter: blur(12px);\n      border-bottom: 1px solid var(--hairline);\n      position: sticky;\n      top: 0;\n      z-index: 1020;\n    }\n\n    .brand-accent {\n      color: var(--primary);\n      font-weight: 700;\n    }\n\n    .badge-framework {\n      background-color: rgba(94, 106, 210, 0.15);\n      color: var(--primary-hover);\n      border: 1px solid rgba(94, 106, 210, 0.35);\n      font-weight: 500;\n      font-size: 0.75rem;\n    }\n\n    /* Cards */\n    .feature-card {\n      background-color: var(--surface-1);\n      border: 1px solid var(--hairline);\n      border-radius: var(--radius-lg);\n      transition: border-color 0.2s ease, box-shadow 0.2s ease;\n      overflow: hidden;\n    }\n\n    .feature-card:hover {\n      border-color: var(--hairline-strong);\n    }\n\n    .feature-header {\n      padding: 1.25rem 1.5rem;\n      cursor: pointer;\n      user-select: none;\n    }\n\n    .feature-body {\n      border-top: 1px solid var(--hairline);\n      background-color: var(--surface-2);\n      padding: 1.5rem;\n    }\n\n    /* Progress bar */\n    .progress-custom {\n      height: 6px;\n      background-color: var(--surface-3);\n      border-radius: 999px;\n      overflow: hidden;\n    }\n\n    .progress-bar-custom {\n      background-color: var(--primary);\n      border-radius: 999px;\n      transition: width 0.4s ease;\n    }\n\n    /* Status Badges */\n    .badge-status-done {\n      background-color: rgba(39, 166, 68, 0.15);\n      color: #3dd660;\n      border: 1px solid rgba(39, 166, 68, 0.3);\n    }\n\n    .badge-status-progress {\n      background-color: rgba(94, 106, 210, 0.15);\n      color: var(--primary-hover);\n      border: 1px solid rgba(94, 106, 210, 0.3);\n    }\n\n    .badge-status-pending {\n      background-color: rgba(138, 143, 152, 0.15);\n      color: var(--ink-muted);\n      border: 1px solid rgba(138, 143, 152, 0.25);\n    }\n\n    /* Nav Tabs */\n    .nav-tabs-custom {\n      border-bottom: 1px solid var(--hairline);\n      gap: 0.5rem;\n    }\n\n    .nav-tabs-custom .nav-link {\n      color: var(--ink-muted);\n      border: none;\n      padding: 0.5rem 1rem;\n      border-radius: var(--radius-sm);\n      font-size: 0.875rem;\n      font-weight: 500;\n      transition: color 0.15s ease, background-color 0.15s ease;\n    }\n\n    .nav-tabs-custom .nav-link:hover {\n      color: var(--ink);\n      background-color: var(--surface-3);\n    }\n\n    .nav-tabs-custom .nav-link.active {\n      color: #ffffff;\n      background-color: var(--primary);\n    }\n\n    /* Table styling */\n    .table-custom {\n      --bs-table-bg: transparent;\n      --bs-table-color: var(--ink);\n      --bs-table-border-color: var(--hairline);\n      margin-bottom: 0;\n      font-size: 0.85rem;\n    }\n\n    .table-custom th {\n      color: var(--ink-muted);\n      font-weight: 600;\n      font-size: 0.75rem;\n      text-transform: uppercase;\n      letter-spacing: 0.05em;\n      border-bottom: 1px solid var(--hairline);\n      padding: 0.75rem 1rem;\n    }\n\n    .table-custom td {\n      padding: 0.75rem 1rem;\n      vertical-align: middle;\n      border-bottom: 1px solid var(--hairline);\n    }\n\n    .table-custom tr:last-child td {\n      border-bottom: none;\n    }\n\n    .badge-task-type {\n      background-color: var(--surface-3);\n      color: var(--ink);\n      border: 1px solid var(--hairline-strong);\n      font-size: 0.7rem;\n      padding: 0.25rem 0.5rem;\n    }\n\n    .search-input {\n      background-color: var(--surface-1);\n      border: 1px solid var(--hairline);\n      color: var(--ink);\n      border-radius: var(--radius-md);\n      padding: 0.5rem 1rem;\n      font-size: 0.875rem;\n    }\n\n    .search-input:focus {\n      background-color: var(--surface-2);\n      border-color: var(--primary);\n      box-shadow: 0 0 0 3px var(--primary-focus);\n      color: var(--ink);\n      outline: none;\n    }\n\n    .btn-custom-primary {\n      background-color: var(--primary);\n      color: #ffffff;\n      border: none;\n      border-radius: var(--radius-sm);\n      font-weight: 500;\n      font-size: 0.875rem;\n      padding: 0.45rem 0.9rem;\n      transition: background-color 0.15s ease;\n    }\n\n    .btn-custom-primary:hover {\n      background-color: var(--primary-hover);\n      color: #ffffff;\n    }\n\n    .metric-pill {\n      background-color: var(--surface-1);\n      border: 1px solid var(--hairline);\n      border-radius: var(--radius-md);\n      padding: 0.5rem 1rem;\n    }\n\n    .metric-pill .label {\n      font-size: 0.7rem;\n      color: var(--ink-muted);\n      text-transform: uppercase;\n      letter-spacing: 0.05em;\n    }\n\n    .metric-pill .value {\n      font-size: 1.1rem;\n      font-weight: 700;\n      color: var(--ink);\n    }\n  </style>\n</head>\n<body>\n  <!-- Navbar -->\n  <nav class=\"navbar navbar-custom py-2 mb-4\">\n    <div class=\"container-xl d-flex justify-content-between align-items-center\">\n      <div class=\"d-flex align-items-center gap-2\">\n        <span class=\"fs-5 brand-accent\">AI-SDD</span>\n        <span class=\"fs-6 text-white fw-semibold\">Specs Dashboard</span>\n        <span class=\"badge badge-framework\">Linear Dark v1.0</span>\n      </div>\n      <div class=\"d-flex align-items-center gap-2\">\n        <button id=\"refreshBtn\" class=\"btn btn-custom-primary d-flex align-items-center gap-2\" onclick=\"loadFeatures()\">\n          <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67\"/></svg>\n          Refresh\n        </button>\n      </div>\n    </div>\n  </nav>\n\n  <div class=\"container-xl pb-5\">\n    <!-- Top Metrics Overview -->\n    <div class=\"row g-3 mb-4\">\n      <div class=\"col-sm-6 col-md-3\">\n        <div class=\"metric-pill\">\n          <div class=\"label\">Total Features</div>\n          <div class=\"value\" id=\"statFeatures\">0</div>\n        </div>\n      </div>\n      <div class=\"col-sm-6 col-md-3\">\n        <div class=\"metric-pill\">\n          <div class=\"label\">Total Tasks</div>\n          <div class=\"value\" id=\"statTasks\">0</div>\n        </div>\n      </div>\n      <div class=\"col-sm-6 col-md-3\">\n        <div class=\"metric-pill\">\n          <div class=\"label\">Completed Tasks</div>\n          <div class=\"value\" id=\"statCompleted\">0</div>\n        </div>\n      </div>\n      <div class=\"col-sm-6 col-md-3\">\n        <div class=\"metric-pill\">\n          <div class=\"label\">Overall Progress</div>\n          <div class=\"value\" id=\"statProgress\">0%</div>\n        </div>\n      </div>\n    </div>\n\n    <!-- Controls Row -->\n    <div class=\"d-flex justify-content-between align-items-center mb-3\">\n      <h5 class=\"mb-0 fw-semibold\">Active Specifications (.specs/features)</h5>\n      <div class=\"w-25\">\n        <input type=\"text\" id=\"searchInput\" class=\"form-control search-input\" placeholder=\"Search features...\" onkeyup=\"filterFeatures()\">\n      </div>\n    </div>\n\n    <!-- Features Container -->\n    <div id=\"featuresList\" class=\"d-flex flex-column gap-3\">\n      <div class=\"text-center py-5 text-muted\">\n        <div class=\"spinner-border text-secondary mb-2\" role=\"status\"></div>\n        <div>Loading specifications...</div>\n      </div>\n    </div>\n  </div>\n\n  <script src=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js\"></script>\n  <script>\n    let allFeaturesData = [];\n\n    async function loadFeatures() {\n      const refreshBtn = document.getElementById('refreshBtn');\n      refreshBtn.disabled = true;\n      refreshBtn.innerHTML = '<span class=\"spinner-border spinner-border-sm\" role=\"status\"></span> Loading...';\n\n      try {\n        const res = await fetch('/api/features');\n        const data = await res.json();\n        allFeaturesData = data.features || [];\n        updateMetrics(allFeaturesData);\n        renderFeatures(allFeaturesData);\n      } catch (err) {\n        document.getElementById('featuresList').innerHTML = `\n          <div class=\"alert alert-danger feature-card p-4\">\n            <h5>Error loading specifications</h5>\n            <p class=\"mb-0 font-mono small\">${err.message}</p>\n          </div>`;\n      } finally {\n        refreshBtn.disabled = false;\n        refreshBtn.innerHTML = `<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67\"/></svg> Refresh`;\n      }\n    }\n\n    function updateMetrics(features) {\n      const totalFeatures = features.length;\n      let totalTasks = 0;\n      let completedTasks = 0;\n\n      features.forEach(f => {\n        totalTasks += (f.totalTasks || 0);\n        completedTasks += (f.completedTasks || 0);\n      });\n\n      const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;\n\n      document.getElementById('statFeatures').innerText = totalFeatures;\n      document.getElementById('statTasks').innerText = totalTasks;\n      document.getElementById('statCompleted').innerText = completedTasks;\n      document.getElementById('statProgress').innerText = overallProgress + '%';\n    }\n\n    function filterFeatures() {\n      const query = document.getElementById('searchInput').value.toLowerCase();\n      const filtered = allFeaturesData.filter(f => \n        f.id.toLowerCase().includes(query) || \n        f.title.toLowerCase().includes(query)\n      );\n      renderFeatures(filtered);\n    }\n\n    function renderFeatures(features) {\n      const container = document.getElementById('featuresList');\n      if (features.length === 0) {\n        container.innerHTML = `\n          <div class=\"feature-card p-5 text-center text-secondary\">\n            <h6>No features found under <code>.specs/features/</code></h6>\n            <p class=\"small mb-0\">Create new specifications using the <code>sdd-planner</code> skill.</p>\n          </div>`;\n        return;\n      }\n\n      container.innerHTML = features.map((f, idx) => {\n        const statusBadge = f.completionRate === 100 \n          ? '<span class=\"badge badge-status-done\">DONE</span>' \n          : f.completionRate > 0 \n            ? '<span class=\"badge badge-status-progress\">IN PROGRESS</span>' \n            : '<span class=\"badge badge-status-pending\">PENDING</span>';\n\n        return `\n          <div class=\"feature-card\">\n            <div class=\"feature-header d-flex justify-content-between align-items-center\" onclick=\"toggleCollapse('${f.id}')\">\n              <div class=\"d-flex align-items-center gap-3\">\n                <span class=\"fs-6 fw-bold text-white\">${escapeHtml(f.title)}</span>\n                <span class=\"badge bg-dark font-mono text-muted border border-secondary border-opacity-25\">${escapeHtml(f.id)}</span>\n                ${statusBadge}\n              </div>\n              <div class=\"d-flex align-items-center gap-4\">\n                <div style=\"width: 140px;\">\n                  <div class=\"d-flex justify-content-between small text-muted mb-1 font-mono\">\n                    <span>${f.completedTasks}/${f.totalTasks}</span>\n                    <span>${f.completionRate}%</span>\n                  </div>\n                  <div class=\"progress-custom\">\n                    <div class=\"progress-bar-custom\" style=\"width: ${f.completionRate}%\"></div>\n                  </div>\n                </div>\n                <button class=\"btn btn-sm btn-link text-muted p-0\" id=\"btn-toggle-${f.id}\">\n                  <svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>\n                </button>\n              </div>\n            </div>\n\n            <!-- Cascading Accordion Content -->\n            <div class=\"feature-body\" id=\"collapse-${f.id}\" style=\"display: none;\">\n              <ul class=\"nav nav-tabs nav-tabs-custom mb-3\" role=\"tablist\">\n                <li class=\"nav-item\">\n                  <button class=\"nav-link active\" data-bs-toggle=\"tab\" data-bs-target=\"#tab-tasks-${f.id}\">\n                    ⚙️ Tasks (${f.tasks.length})\n                  </button>\n                </li>\n                <li class=\"nav-item\">\n                  <button class=\"nav-link\" data-bs-toggle=\"tab\" data-bs-target=\"#tab-plan-${f.id}\">\n                    📋 User Stories & Plan (${f.userStories.length})\n                  </button>\n                </li>\n                <li class=\"nav-item\">\n                  <button class=\"nav-link\" data-bs-toggle=\"tab\" data-bs-target=\"#tab-spec-${f.id}\">\n                    🧪 Acceptance Criteria (${f.acceptanceCriteria.length})\n                  </button>\n                </li>\n              </ul>\n\n              <div class=\"tab-content\">\n                <!-- Tab: Tasks (MetaGPT 7-Column SOP) -->\n                <div class=\"tab-pane fade show active\" id=\"tab-tasks-${f.id}\">\n                  ${renderTasksTable(f.tasks)}\n                </div>\n\n                <!-- Tab: Plan & User Stories -->\n                <div class=\"tab-pane fade\" id=\"tab-plan-${f.id}\">\n                  ${f.problemStatement ? `<div class=\"mb-3\"><h6 class=\"text-secondary small text-uppercase fw-semibold\">Problem Statement</h6><p class=\"text-light small\">${escapeHtml(f.problemStatement)}</p></div>` : ''}\n                  <h6 class=\"text-secondary small text-uppercase fw-semibold mb-2\">User Stories</h6>\n                  ${f.userStories.length > 0 ? `\n                    <ul class=\"list-group list-group-flush bg-transparent\">\n                      ${f.userStories.map(us => `<li class=\"list-group-item bg-transparent text-light border-secondary border-opacity-25 px-0 py-2 small\">• ${escapeHtml(us)}</li>`).join('')}\n                    </ul>\n                  ` : '<div class=\"text-muted small\">No user stories found in plan.md / spec.md.</div>'}\n                </div>\n\n                <!-- Tab: Acceptance Criteria (BDD) -->\n                <div class=\"tab-pane fade\" id=\"tab-spec-${f.id}\">\n                  ${f.acceptanceCriteria.length > 0 ? `\n                    <div class=\"d-flex flex-column gap-2\">\n                      ${f.acceptanceCriteria.map(ac => `\n                        <div class=\"p-3 rounded bg-dark border border-secondary border-opacity-25\">\n                          <div class=\"fw-semibold text-white small mb-2\">${escapeHtml(ac.title)}</div>\n                          ${ac.details.length > 0 ? `\n                            <ul class=\"mb-0 ps-3 text-secondary small font-mono\">\n                              ${ac.details.map(d => `<li>${escapeHtml(d)}</li>`).join('')}\n                            </ul>\n                          ` : ''}\n                        </div>\n                      `).join('')}\n                    </div>\n                  ` : '<div class=\"text-muted small\">No BDD acceptance criteria found in spec.md.</div>'}\n                </div>\n              </div>\n            </div>\n          </div>`;\n      }).join('');\n    }\n\n    function renderTasksTable(tasks) {\n      if (!tasks || tasks.length === 0) {\n        return '<div class=\"text-muted small py-2\">No tasks defined in tasks.md.</div>';\n      }\n\n      return `\n        <div class=\"table-responsive rounded border border-secondary border-opacity-25\">\n          <table class=\"table table-custom\">\n            <thead>\n              <tr>\n                <th style=\"width: 50px;\">Status</th>\n                <th style=\"width: 90px;\">ID</th>\n                <th style=\"width: 80px;\">Type</th>\n                <th>Description</th>\n                <th>Target Files</th>\n                <th>Dependencies</th>\n                <th>Evidence</th>\n              </tr>\n            </thead>\n            <tbody>\n              ${tasks.map(t => {\n                const statusIcon = t.status === 'done' \n                  ? '<span class=\"text-success fw-bold\">✓</span>' \n                  : t.status === 'in_progress' \n                    ? '<span class=\"text-primary fw-bold\">▶</span>' \n                    : '<span class=\"text-secondary\">○</span>';\n\n                return `\n                  <tr>\n                    <td class=\"text-center font-mono\">${statusIcon}</td>\n                    <td class=\"font-mono text-white fw-medium\">${escapeHtml(t.id)}</td>\n                    <td><span class=\"badge badge-task-type font-mono\">${escapeHtml(t.type)}</span></td>\n                    <td class=\"text-light\">${escapeHtml(t.description)}</td>\n                    <td><code class=\"small text-secondary\">${escapeHtml(t.targetFiles)}</code></td>\n                    <td class=\"font-mono text-muted small\">${escapeHtml(t.dependencies)}</td>\n                    <td class=\"font-mono small text-muted\">${escapeHtml(t.evidence || '-')}</td>\n                  </tr>`;\n              }).join('')}\n            </tbody>\n          </table>\n        </div>`;\n    }\n\n    function toggleCollapse(featureId) {\n      const el = document.getElementById('collapse-' + featureId);\n      if (el.style.display === 'none') {\n        el.style.display = 'block';\n      } else {\n        el.style.display = 'none';\n      }\n    }\n\n    function escapeHtml(str) {\n      if (!str) return '';\n      return String(str)\n        .replace(/&/g, '&amp;')\n        .replace(/</g, '&lt;')\n        .replace(/>/g, '&gt;')\n        .replace(/\"/g, '&quot;')\n        .replace(/'/g, '&#039;');\n    }\n\n    // Initial load\n    document.addEventListener('DOMContentLoaded', loadFeatures);\n  </script>\n</body>\n</html>\n";
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
