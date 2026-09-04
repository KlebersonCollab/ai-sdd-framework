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
    if (/^\[\s*x\s*\]/i.test(rawStatus)) {
      status = 'done';
    } else if (/^\[\s*[-/>.]\s*\]/i.test(rawStatus)) {
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
 * Decomposes a User Story into role, action, and benefit
 * @param {string} rawText
 * @returns {object}
 */
function parseUserStory(rawText) {
  if (!rawText) return { id: '', role: '', action: '', benefit: '', raw: '' };

  const idMatch = rawText.match(/\*\*(US-[^*:]+)\*\*/i) || rawText.match(/(US-\d+)/i);
  const id = idMatch ? idMatch[1] : '';

  let cleanText = rawText.replace(/^-\s+/, '').replace(/^\*\*US-[^*:]+\*\*:\s*/i, '').trim();

  // Pattern: As a [role], I want [action], so that [benefit]
  const enMatch = cleanText.match(/^(?:As an?|As)\s+([^,]+),\s*(?:I want to|I want)\s+([^,]+?)(?:,\s*so that|\s+so that)\s+(.+)$/i);
  if (enMatch) {
    return {
      id,
      role: enMatch[1].trim(),
      action: enMatch[2].trim(),
      benefit: enMatch[3].trim(),
      raw: rawText
    };
  }

  // Pattern: Como [role], quero [action], para [benefit]
  const ptMatch = cleanText.match(/^(?:Como|Sendo)\s+([^,]+),\s*(?:quero|desejo)\s+([^,]+?)(?:,\s*para que|\s+para que|\s+para|\s+de modo que)\s+(.+)$/i);
  if (ptMatch) {
    return {
      id,
      role: ptMatch[1].trim(),
      action: ptMatch[2].trim(),
      benefit: ptMatch[3].trim(),
      raw: rawText
    };
  }

  return {
    id,
    role: 'User',
    action: cleanText,
    benefit: '',
    raw: rawText
  };
}

/**
 * Extracts sections from plan.md (Problem statement, Scope, Approach, ADRs)
 * @param {string} content
 * @returns {object}
 */
function parsePlanSections(content) {
  if (!content) return { problemStatement: '', inScope: [], outOfScope: [], approach: '', adrs: [] };

  let problemStatement = '';
  const problemMatch = content.match(/##\s+1\.\s+Problem Statement[\s\S]*?(?=##|$)/i);
  if (problemMatch) {
    problemStatement = problemMatch[0].replace(/##\s+1\.\s+Problem Statement.*?\n/i, '').trim();
  }

  const inScope = [];
  const outOfScope = [];

  const scopeMatch = content.match(/##\s+2\.\s+Scope & Boundaries[\s\S]*?(?=##|$)/i);
  if (scopeMatch) {
    const scopeText = scopeMatch[0];

    const inScopeMatch = scopeText.match(/-\s+\*\*In Scope\*\*:([\s\S]*?)(?=-\s+\*\*Out of Scope\*\*:|$)/i);
    if (inScopeMatch) {
      const items = inScopeMatch[1].split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('-') || l.startsWith('*'))
        .map(l => l.replace(/^[-*]\s+/, ''));
      inScope.push(...items);
    }

    const outScopeMatch = scopeText.match(/-\s+\*\*Out of Scope\*\*:([\s\S]*?)(?=##|$)/i);
    if (outScopeMatch) {
      const items = outScopeMatch[1].split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('-') || l.startsWith('*'))
        .map(l => l.replace(/^[-*]\s+/, ''));
      outOfScope.push(...items);
    }
  }

  let approach = '';
  const approachMatch = content.match(/##\s+3\.\s+High-Level Approach[\s\S]*?(?=##|$)/i);
  if (approachMatch) {
    approach = approachMatch[0].replace(/##\s+3\.\s+High-Level Approach.*?\n/i, '').trim();
  }

  const adrs = [];
  const adrRegex = /\[(ADR\s*\d+:[^\]]+)\]\(([^)]+)\)/gi;
  let adrMatch;
  while ((adrMatch = adrRegex.exec(content)) !== null) {
    adrs.push({
      title: adrMatch[1].trim(),
      link: adrMatch[2].trim()
    });
  }

  return {
    problemStatement,
    inScope,
    outOfScope,
    approach,
    adrs
  };
}

/**
 * Extracts BDD acceptance criteria scenarios and decomposes Given/When/Then/And clauses
 * @param {string} content
 * @returns {Array<object>}
 */
function parseAcceptanceCriteria(content) {
  if (!content) return [];
  const criteria = [];

  const lines = content.split('\n');
  let currentCategory = 'Acceptance Criteria';
  let currentAc = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('###')) {
      let rawCat = line.replace(/^###\s+/, '').trim();
      currentCategory = rawCat.replace(/\([^)]*\)/g, '').trim();
      continue;
    }

    const acHeaderMatch = line.match(/^-\s+\*\*(AC-\d+:[^*]+)\*\*/i);
    if (acHeaderMatch) {
      if (currentAc) {
        criteria.push(currentAc);
      }
      const fullTitle = acHeaderMatch[1].trim();
      const id = fullTitle.split(':')[0].trim();
      currentAc = {
        id,
        title: fullTitle,
        category: currentCategory,
        clauses: []
      };
      continue;
    }

    if (currentAc && (line.startsWith('-') || line.startsWith('*'))) {
      const clauseMatch = line.match(/^[-*]\s+\*\*(Given|When|Then|And|Dado|Quando|Então|E)\*\*\s*(.*)$/i);
      if (clauseMatch) {
        let kw = clauseMatch[1].toUpperCase();
        if (kw === 'DADO') kw = 'GIVEN';
        if (kw === 'QUANDO') kw = 'WHEN';
        if (kw === 'ENTÃO' || kw === 'ENTAO') kw = 'THEN';
        if (kw === 'E') kw = 'AND';

        currentAc.clauses.push({
          keyword: kw,
          text: clauseMatch[2].trim()
        });
      } else {
        const plainText = line.replace(/^[-*]\s+/, '').trim();
        if (plainText) {
          currentAc.clauses.push({
            keyword: 'STEP',
            text: plainText
          });
        }
      }
    }
  }

  if (currentAc) {
    criteria.push(currentAc);
  }

  return criteria;
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
  let plan = { problemStatement: '', inScope: [], outOfScope: [], approach: '', adrs: [] };
  let userStories = [];
  let acceptanceCriteria = [];
  let businessRules = [];
  let tasks = [];

  // 1. Parse plan.md
  if (fs.existsSync(planPath)) {
    const planContent = fs.readFileSync(planPath, 'utf8');
    const titleMatch = planContent.match(/^#\s+Plan:\s*(.+)$/m) || planContent.match(/^#\s+(.+)$/m);
    if (titleMatch) title = titleMatch[1].trim();
    plan = parsePlanSections(planContent);
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
      userStories = usMatches.map(m => parseUserStory(m));
    }

    // Extract Business Rules: - **BR-X**: ...
    const brMatches = specContent.match(/-\s+\*\*BR-[^:]+\*\*:\s*.+/g);
    if (brMatches) {
      businessRules = brMatches.map(m => m.replace(/^-\s+/, '').trim());
    }

    // Extract Acceptance Criteria:
    acceptanceCriteria = parseAcceptanceCriteria(specContent);
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
    plan,
    problemStatement: plan.problemStatement,
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

const sseClients = new Set();
let watchDebounceTimer = null;
let activeWatcher = null;

function notifyClients() {
  const payload = `data: ${JSON.stringify({ type: 'reload', timestamp: Date.now() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

function startFileWatcher() {
  const specsDir = path.join(REPO_ROOT, '.specs');
  if (!fs.existsSync(specsDir) || activeWatcher) return activeWatcher;
  try {
    activeWatcher = fs.watch(specsDir, { recursive: true }, () => {
      clearTimeout(watchDebounceTimer);
      watchDebounceTimer = setTimeout(() => {
        notifyClients();
      }, 300);
    });
    if (activeWatcher && typeof activeWatcher.unref === 'function') {
      activeWatcher.unref();
    }
    return activeWatcher;
  } catch (err) {
    // Non-fatal if recursive watch is unavailable on specific platform
    return null;
  }
}

/**
 * Starts the native HTTP server serving the dashboard and /api/features endpoint
 * @param {number} port
 * @returns {Promise<http.Server>}
 */
function startServer(port = 3000) {
  startFileWatcher();

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

    if (req.method === 'GET' && pathname === '/api/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      res.write('retry: 2000\n\n');
      sseClients.add(res);

      req.on('close', () => {
        sseClients.delete(res);
      });
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

  server.on('close', () => {
    for (const client of sseClients) {
      try { client.end(); } catch (e) {}
    }
    sseClients.clear();
    if (activeWatcher && typeof activeWatcher.close === 'function') {
      try { activeWatcher.close(); } catch (e) {}
      activeWatcher = null;
    }
    if (watchDebounceTimer) {
      clearTimeout(watchDebounceTimer);
      watchDebounceTimer = null;
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      resolve(server);
    });
    server.on('error', reject);
  });
}

function renderDashboardHtml() {
  return "<!DOCTYPE html>\n<html lang=\"en\" data-bs-theme=\"dark\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Specs Dashboard — AI-SDD Framework</title>\n  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n  <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n  <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap\" rel=\"stylesheet\">\n  <link href=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css\" rel=\"stylesheet\">\n  <script src=\"https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js\"></script>\n  <style>\n    :root {\n      --canvas: #010102;\n      --surface-1: #0f1011;\n      --surface-2: #141516;\n      --surface-3: #18191a;\n      --surface-4: #1c1d1f;\n      --hairline: #23252a;\n      --hairline-strong: #34343a;\n      --primary: #5e6ad2;\n      --primary-hover: #828fff;\n      --primary-focus: rgba(94, 106, 210, 0.25);\n      --ink: #f7f8f8;\n      --ink-muted: #8a8f98;\n      --ink-subtle: #62666d;\n      --semantic-success: #27a644;\n      --semantic-warning: #d97706;\n      --semantic-info: #0ea5e9;\n      --radius-sm: 6px;\n      --radius-md: 10px;\n      --radius-lg: 14px;\n    }\n\n    body {\n      background-color: var(--canvas);\n      color: var(--ink);\n      font-family: 'Inter', -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n      min-height: 100vh;\n      -webkit-font-smoothing: antialiased;\n    }\n\n    code, pre, .font-mono {\n      font-family: 'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace;\n    }\n\n    /* Navbar */\n    .navbar-custom {\n      background-color: rgba(15, 16, 17, 0.9);\n      backdrop-filter: blur(12px);\n      border-bottom: 1px solid var(--hairline);\n      position: sticky;\n      top: 0;\n      z-index: 1020;\n    }\n\n    .brand-accent {\n      color: var(--primary);\n      font-weight: 700;\n    }\n\n    .badge-framework {\n      background-color: rgba(94, 106, 210, 0.15);\n      color: var(--primary-hover);\n      border: 1px solid rgba(94, 106, 210, 0.35);\n      font-weight: 500;\n      font-size: 0.75rem;\n    }\n\n    /* Feature Cards */\n    .feature-card {\n      background-color: var(--surface-1);\n      border: 1px solid var(--hairline);\n      border-radius: var(--radius-lg);\n      transition: border-color 0.2s ease, box-shadow 0.2s ease;\n      overflow: hidden;\n    }\n\n    .feature-card:hover {\n      border-color: var(--hairline-strong);\n    }\n\n    .feature-header {\n      padding: 1.25rem 1.5rem;\n      cursor: pointer;\n      user-select: none;\n    }\n\n    .feature-body {\n      border-top: 1px solid var(--hairline);\n      background-color: var(--surface-2);\n      padding: 1.75rem;\n    }\n\n    /* Progress bar */\n    .progress-custom {\n      height: 8px;\n      background-color: var(--surface-4);\n      border: 1px solid var(--hairline);\n      border-radius: 999px;\n      overflow: hidden;\n      display: flex;\n      width: 100%;\n      position: relative;\n    }\n\n    .progress-bar-custom {\n      height: 100%;\n      min-height: 8px;\n      background-color: var(--primary);\n      border-radius: 999px;\n      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease;\n      display: block;\n    }\n\n    .progress-bar-custom.is-complete {\n      background-color: var(--semantic-success) !important;\n      box-shadow: 0 0 8px rgba(39, 166, 68, 0.4);\n    }\n\n    /* Cascade Step Sections */\n    .cascade-step {\n      background-color: var(--surface-1);\n      border: 1px solid var(--hairline);\n      border-radius: var(--radius-md);\n      overflow: hidden;\n      margin-bottom: 1.5rem;\n    }\n\n    .cascade-step-header {\n      padding: 0.85rem 1.25rem;\n      background-color: var(--surface-3);\n      border-bottom: 1px solid var(--hairline);\n      cursor: pointer;\n      user-select: none;\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n    }\n\n    .cascade-step-title {\n      font-size: 0.85rem;\n      font-weight: 600;\n      letter-spacing: 0.05em;\n      text-transform: uppercase;\n      display: flex;\n      align-items: center;\n      gap: 0.6rem;\n    }\n\n    .step-number {\n      background-color: rgba(94, 106, 210, 0.2);\n      color: var(--primary-hover);\n      border: 1px solid rgba(94, 106, 210, 0.4);\n      padding: 0.15rem 0.45rem;\n      border-radius: 4px;\n      font-size: 0.75rem;\n      font-weight: 700;\n      font-family: 'JetBrains Mono', monospace;\n    }\n\n    .cascade-step-body {\n      padding: 1.25rem;\n    }\n\n    /* User Story Card */\n    .us-card {\n      background-color: var(--surface-2);\n      border: 1px solid var(--hairline);\n      border-radius: var(--radius-sm);\n      padding: 1rem;\n      height: 100%;\n      display: flex;\n      flex-direction: column;\n      justify-content: space-between;\n      transition: border-color 0.15s ease;\n    }\n\n    .us-card:hover {\n      border-color: var(--hairline-strong);\n    }\n\n    .us-id-badge {\n      background-color: rgba(94, 106, 210, 0.15);\n      color: var(--primary-hover);\n      border: 1px solid rgba(94, 106, 210, 0.3);\n      font-size: 0.75rem;\n      font-weight: 600;\n      padding: 0.2rem 0.5rem;\n      border-radius: 4px;\n      font-family: 'JetBrains Mono', monospace;\n    }\n\n    .us-role-badge {\n      background-color: var(--surface-4);\n      color: var(--ink);\n      border: 1px solid var(--hairline-strong);\n      font-size: 0.75rem;\n      padding: 0.15rem 0.4rem;\n      border-radius: 4px;\n    }\n\n    /* BDD Scenario Box */\n    .bdd-scenario-card {\n      background-color: var(--surface-2);\n      border: 1px solid var(--hairline);\n      border-radius: var(--radius-sm);\n      margin-bottom: 0.85rem;\n      overflow: hidden;\n    }\n\n    .bdd-scenario-header {\n      padding: 0.75rem 1rem;\n      background-color: var(--surface-3);\n      border-bottom: 1px solid var(--hairline);\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n    }\n\n    .bdd-scenario-body {\n      padding: 0.85rem 1rem;\n      display: flex;\n      flex-direction: column;\n      gap: 0.5rem;\n    }\n\n    .bdd-clause-row {\n      display: flex;\n      align-items: baseline;\n      gap: 0.75rem;\n      font-size: 0.85rem;\n    }\n\n    /* Gherkin Badges */\n    .badge-gherkin {\n      font-family: 'JetBrains Mono', monospace;\n      font-size: 0.7rem;\n      font-weight: 700;\n      padding: 0.2rem 0.45rem;\n      border-radius: 4px;\n      min-width: 58px;\n      text-align: center;\n      display: inline-block;\n    }\n\n    .badge-given {\n      background-color: rgba(14, 165, 233, 0.15);\n      color: #38bdf8;\n      border: 1px solid rgba(14, 165, 233, 0.3);\n    }\n\n    .badge-when {\n      background-color: rgba(217, 119, 6, 0.15);\n      color: #fbbf24;\n      border: 1px solid rgba(217, 119, 6, 0.3);\n    }\n\n    .badge-then {\n      background-color: rgba(39, 166, 68, 0.15);\n      color: #4ade80;\n      border: 1px solid rgba(39, 166, 68, 0.3);\n    }\n\n    .badge-and {\n      background-color: rgba(138, 143, 152, 0.15);\n      color: var(--ink-muted);\n      border: 1px solid rgba(138, 143, 152, 0.25);\n    }\n\n    /* Scope boxes */\n    .scope-box {\n      background-color: var(--surface-2);\n      border: 1px solid var(--hairline);\n      border-radius: var(--radius-sm);\n      padding: 1rem;\n      height: 100%;\n    }\n\n    /* Status Badges */\n    .badge-status-done {\n      background-color: rgba(39, 166, 68, 0.15);\n      color: #3dd660;\n      border: 1px solid rgba(39, 166, 68, 0.3);\n    }\n\n    .badge-status-progress {\n      background-color: rgba(94, 106, 210, 0.15);\n      color: var(--primary-hover);\n      border: 1px solid rgba(94, 106, 210, 0.3);\n    }\n\n    .badge-status-pending {\n      background-color: rgba(138, 143, 152, 0.15);\n      color: var(--ink-muted);\n      border: 1px solid rgba(138, 143, 152, 0.25);\n    }\n\n    /* Table styling */\n    .table-custom {\n      --bs-table-bg: transparent;\n      --bs-table-color: var(--ink);\n      --bs-table-border-color: var(--hairline);\n      margin-bottom: 0;\n      font-size: 0.85rem;\n    }\n\n    .table-custom th {\n      color: var(--ink-muted);\n      font-weight: 600;\n      font-size: 0.72rem;\n      text-transform: uppercase;\n      letter-spacing: 0.05em;\n      border-bottom: 1px solid var(--hairline);\n      padding: 0.75rem 1rem;\n    }\n\n    .table-custom td {\n      padding: 0.75rem 1rem;\n      vertical-align: middle;\n      border-bottom: 1px solid var(--hairline);\n    }\n\n    .table-custom tr:last-child td {\n      border-bottom: none;\n    }\n\n    .badge-task-type {\n      background-color: var(--surface-3);\n      color: var(--ink);\n      border: 1px solid var(--hairline-strong);\n      font-size: 0.7rem;\n      padding: 0.2rem 0.45rem;\n    }\n\n    .search-input {\n      background-color: var(--surface-1);\n      border: 1px solid var(--hairline);\n      color: var(--ink);\n      border-radius: var(--radius-md);\n      padding: 0.5rem 1rem;\n      font-size: 0.875rem;\n    }\n\n    .search-input:focus {\n      background-color: var(--surface-2);\n      border-color: var(--primary);\n      box-shadow: 0 0 0 3px var(--primary-focus);\n      color: var(--ink);\n      outline: none;\n    }\n\n    .btn-custom-primary {\n      background-color: var(--primary);\n      color: #ffffff;\n      border: none;\n      border-radius: var(--radius-sm);\n      font-weight: 500;\n      font-size: 0.875rem;\n      padding: 0.45rem 0.9rem;\n      transition: background-color 0.15s ease;\n    }\n\n    .btn-custom-primary:hover {\n      background-color: var(--primary-hover);\n      color: #ffffff;\n    }\n\n    .metric-pill {\n      background-color: var(--surface-1);\n      border: 1px solid var(--hairline);\n      border-radius: var(--radius-md);\n      padding: 0.6rem 1.1rem;\n    }\n\n    .metric-pill .label {\n      font-size: 0.7rem;\n      color: var(--ink-muted);\n      text-transform: uppercase;\n      letter-spacing: 0.05em;\n    }\n\n    .metric-pill .value {\n      font-size: 1.15rem;\n      font-weight: 700;\n      color: var(--ink);\n    }\n\n    /* Markdown Formatted Typography */\n    .markdown-content {\n      font-size: 0.875rem;\n      line-height: 1.6;\n      color: var(--ink);\n    }\n\n    .markdown-content p {\n      margin-bottom: 0.6rem;\n    }\n\n    .markdown-content p:last-child {\n      margin-bottom: 0;\n    }\n\n    .markdown-content ul, .markdown-content ol {\n      padding-left: 1.25rem;\n      margin-bottom: 0.6rem;\n    }\n\n    .markdown-content li {\n      margin-bottom: 0.35rem;\n    }\n\n    .markdown-content code {\n      background-color: var(--surface-3);\n      color: var(--primary-hover);\n      padding: 0.15rem 0.35rem;\n      border-radius: 4px;\n      font-size: 0.82rem;\n      border: 1px solid var(--hairline);\n      font-family: 'JetBrains Mono', monospace;\n    }\n\n    .markdown-content strong {\n      color: #ffffff;\n      font-weight: 600;\n    }\n  </style>\n</head>\n<body>\n  <!-- Navbar -->\n  <nav class=\"navbar navbar-custom py-2 mb-4\">\n    <div class=\"container-xl d-flex justify-content-between align-items-center\">\n      <div class=\"d-flex align-items-center gap-2\">\n        <span class=\"fs-5 brand-accent\">AI-SDD</span>\n        <span class=\"fs-6 text-white fw-semibold\">Specs Dashboard</span>\n        <span class=\"badge badge-framework\">Linear Dark v1.2</span>\n      </div>\n      <div class=\"d-flex align-items-center gap-2\">\n        <span id=\"liveSyncBadge\" class=\"badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 font-mono\" style=\"font-size: 0.72rem; padding: 0.4rem 0.6rem;\">● Live Sync</span>\n        <button id=\"refreshBtn\" class=\"btn btn-custom-primary d-flex align-items-center gap-2\" onclick=\"loadFeatures()\">\n          <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67\"/></svg>\n          Refresh\n        </button>\n      </div>\n    </div>\n  </nav>\n\n  <div class=\"container-xl pb-5\">\n    <!-- Top Metrics Overview -->\n    <div class=\"row g-3 mb-4\">\n      <div class=\"col-sm-6 col-md-3\">\n        <div class=\"metric-pill\">\n          <div class=\"label\">Total Features</div>\n          <div class=\"value\" id=\"statFeatures\">0</div>\n        </div>\n      </div>\n      <div class=\"col-sm-6 col-md-3\">\n        <div class=\"metric-pill\">\n          <div class=\"label\">Total Tasks</div>\n          <div class=\"value\" id=\"statTasks\">0</div>\n        </div>\n      </div>\n      <div class=\"col-sm-6 col-md-3\">\n        <div class=\"metric-pill\">\n          <div class=\"label\">Completed Tasks</div>\n          <div class=\"value\" id=\"statCompleted\">0</div>\n        </div>\n      </div>\n      <div class=\"col-sm-6 col-md-3\">\n        <div class=\"metric-pill\">\n          <div class=\"d-flex justify-content-between align-items-baseline mb-1\">\n            <div class=\"label\">Overall Progress</div>\n            <div class=\"value\" id=\"statProgress\">0%</div>\n          </div>\n          <div class=\"progress-custom mt-2\">\n            <div class=\"progress-bar-custom\" id=\"statProgressBar\" style=\"width: 0%; height: 100%;\"></div>\n          </div>\n        </div>\n      </div>\n    </div>\n\n    <!-- Controls Row -->\n    <div class=\"d-flex justify-content-between align-items-center mb-3\">\n      <h5 class=\"mb-0 fw-semibold\">Active Specifications (.specs/features)</h5>\n      <div class=\"w-25\">\n        <input type=\"text\" id=\"searchInput\" class=\"form-control search-input\" placeholder=\"Search features...\" onkeyup=\"filterFeatures()\">\n      </div>\n    </div>\n\n    <!-- Features Container -->\n    <div id=\"featuresList\" class=\"d-flex flex-column gap-3\">\n      <div class=\"text-center py-5 text-muted\">\n        <div class=\"spinner-border text-secondary mb-2\" role=\"status\"></div>\n        <div>Loading specifications...</div>\n      </div>\n    </div>\n  </div>\n\n  <script src=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js\"></script>\n  <script>\n    let allFeaturesData = [];\n\n    async function loadFeatures() {\n      const refreshBtn = document.getElementById('refreshBtn');\n      refreshBtn.disabled = true;\n      refreshBtn.innerHTML = '<span class=\"spinner-border spinner-border-sm\" role=\"status\"></span> Loading...';\n\n      try {\n        const res = await fetch('/api/features');\n        const data = await res.json();\n        allFeaturesData = data.features || [];\n        updateMetrics(allFeaturesData);\n        renderFeatures(allFeaturesData);\n      } catch (err) {\n        document.getElementById('featuresList').innerHTML = `\n          <div class=\"alert alert-danger feature-card p-4\">\n            <h5>Error loading specifications</h5>\n            <p class=\"mb-0 font-mono small\">${err.message}</p>\n          </div>`;\n      } finally {\n        refreshBtn.disabled = false;\n        refreshBtn.innerHTML = `<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67\"/></svg> Refresh`;\n      }\n    }\n\n    function updateMetrics(features) {\n      const totalFeatures = features.length;\n      let totalTasks = 0;\n      let completedTasks = 0;\n\n      features.forEach(f => {\n        totalTasks += (f.totalTasks || 0);\n        completedTasks += (f.completedTasks || 0);\n      });\n\n      const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;\n\n      document.getElementById('statFeatures').innerText = totalFeatures;\n      document.getElementById('statTasks').innerText = totalTasks;\n      document.getElementById('statCompleted').innerText = completedTasks;\n      document.getElementById('statProgress').innerText = overallProgress + '%';\n\n      const statBar = document.getElementById('statProgressBar');\n      if (statBar) {\n        statBar.style.width = overallProgress + '%';\n        if (overallProgress === 100) {\n          statBar.classList.add('is-complete');\n        } else {\n          statBar.classList.remove('is-complete');\n        }\n      }\n    }\n\n    function filterFeatures() {\n      const query = document.getElementById('searchInput').value.toLowerCase();\n      const filtered = allFeaturesData.filter(f => \n        f.id.toLowerCase().includes(query) || \n        f.title.toLowerCase().includes(query)\n      );\n      renderFeatures(filtered);\n    }\n\n    function renderFeatures(features) {\n      const container = document.getElementById('featuresList');\n      if (features.length === 0) {\n        container.innerHTML = `\n          <div class=\"feature-card p-5 text-center text-secondary\">\n            <h6>No features found under <code>.specs/features/</code></h6>\n            <p class=\"small mb-0\">Create new specifications using the <code>sdd-planner</code> skill.</p>\n          </div>`;\n        return;\n      }\n\n      container.innerHTML = features.map(f => {\n        const statusBadge = f.completionRate === 100 \n          ? '<span class=\"badge badge-status-done\">DONE</span>' \n          : f.completionRate > 0 \n            ? '<span class=\"badge badge-status-progress\">IN PROGRESS</span>' \n            : '<span class=\"badge badge-status-pending\">PENDING</span>';\n\n        return `\n          <div class=\"feature-card mb-3\">\n            <!-- Feature Header -->\n            <div class=\"feature-header d-flex justify-content-between align-items-center\" onclick=\"toggleCollapse('${f.id}')\">\n              <div class=\"d-flex align-items-center gap-3\">\n                <span class=\"fs-6 fw-bold text-white\">${escapeHtml(f.title)}</span>\n                <span class=\"badge bg-dark font-mono text-muted border border-secondary border-opacity-25\">${escapeHtml(f.id)}</span>\n                ${statusBadge}\n              </div>\n              <div class=\"d-flex align-items-center gap-4\">\n                <div style=\"width: 140px;\">\n                  <div class=\"d-flex justify-content-between small text-muted mb-1 font-mono\">\n                    <span>${f.completedTasks}/${f.totalTasks}</span>\n                    <span>${f.completionRate}%</span>\n                  </div>\n                  <div class=\"progress-custom\">\n                    <div class=\"progress-bar-custom ${f.completionRate === 100 ? 'is-complete' : ''}\" style=\"width: ${f.completionRate}%; height: 100%;\"></div>\n                  </div>\n                </div>\n                <button class=\"btn btn-sm btn-link text-muted p-0\" id=\"btn-toggle-${f.id}\">\n                  <svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>\n                </button>\n              </div>\n            </div>\n\n            <!-- True Vertical Cascading Body -->\n            <div class=\"feature-body\" id=\"collapse-${f.id}\">\n              \n              <!-- STEP 1: Strategic Plan & Scope -->\n              <div class=\"cascade-step\">\n                <div class=\"cascade-step-header\" onclick=\"toggleSubSection('plan-${f.id}')\">\n                  <div class=\"cascade-step-title\">\n                    <span class=\"step-number\">01</span>\n                    <span>Strategic Plan & Boundaries (plan.md)</span>\n                  </div>\n                  <span class=\"text-secondary small font-mono\">Expand / Collapse</span>\n                </div>\n                <div class=\"cascade-step-body\" id=\"section-plan-${f.id}\">\n                  ${renderPlanSection(f.plan, f.problemStatement)}\n                </div>\n              </div>\n\n              <!-- STEP 2: User Stories -->\n              <div class=\"cascade-step\">\n                <div class=\"cascade-step-header\" onclick=\"toggleSubSection('us-${f.id}')\">\n                  <div class=\"cascade-step-title\">\n                    <span class=\"step-number\">02</span>\n                    <span>User Stories (${f.userStories.length})</span>\n                  </div>\n                  <span class=\"text-secondary small font-mono\">Expand / Collapse</span>\n                </div>\n                <div class=\"cascade-step-body\" id=\"section-us-${f.id}\">\n                  ${renderUserStoriesSection(f.userStories)}\n                </div>\n              </div>\n\n              <!-- STEP 3: Acceptance Criteria (BDD) -->\n              <div class=\"cascade-step\">\n                <div class=\"cascade-step-header\" onclick=\"toggleSubSection('bdd-${f.id}')\">\n                  <div class=\"cascade-step-title\">\n                    <span class=\"step-number\">03</span>\n                    <span>BDD Acceptance Criteria (${f.acceptanceCriteria.length})</span>\n                  </div>\n                  <span class=\"text-secondary small font-mono\">Expand / Collapse</span>\n                </div>\n                <div class=\"cascade-step-body\" id=\"section-bdd-${f.id}\">\n                  ${renderBddSection(f.acceptanceCriteria)}\n                </div>\n              </div>\n\n              <!-- STEP 4: Atomic Tasks Execution (MetaGPT SOP) -->\n              <div class=\"cascade-step mb-0\">\n                <div class=\"cascade-step-header\" onclick=\"toggleSubSection('tasks-${f.id}')\">\n                  <div class=\"cascade-step-title\">\n                    <span class=\"step-number\">04</span>\n                    <span>Task Execution Table (${f.tasks.length} tasks)</span>\n                  </div>\n                  <span class=\"text-secondary small font-mono\">Expand / Collapse</span>\n                </div>\n                <div class=\"cascade-step-body\" id=\"section-tasks-${f.id}\">\n                  ${renderTasksTable(f.tasks)}\n                </div>\n              </div>\n\n            </div>\n          </div>`;\n      }).join('');\n    }\n\n    function renderPlanSection(plan, problemFallback) {\n      const problem = (plan && plan.problemStatement) || problemFallback || '';\n      const inScope = (plan && plan.inScope) || [];\n      const outOfScope = (plan && plan.outOfScope) || [];\n      const approach = (plan && plan.approach) || '';\n      const adrs = (plan && plan.adrs) || [];\n\n      return `\n        <div class=\"d-flex flex-column gap-3\">\n          ${problem ? `\n            <div class=\"p-3 rounded bg-dark border-start border-4 border-primary\">\n              <div class=\"text-secondary small text-uppercase fw-semibold mb-2\">Problem Statement & Motivation</div>\n              <div class=\"markdown-content\">${renderMarkdown(problem)}</div>\n            </div>\n          ` : ''}\n\n          <!-- Scope Grid -->\n          ${(inScope.length > 0 || outOfScope.length > 0) ? `\n            <div class=\"row g-3\">\n              <div class=\"col-md-6\">\n                <div class=\"scope-box\">\n                  <div class=\"d-flex align-items-center gap-2 mb-2\">\n                    <span class=\"badge bg-success bg-opacity-15 text-success border border-success border-opacity-25 font-mono\">✓ IN SCOPE</span>\n                  </div>\n                  <ul class=\"list-unstyled mb-0 d-flex flex-column gap-1\">\n                    ${inScope.map(item => `<li class=\"small text-light d-flex align-items-start gap-2\"><span class=\"text-success\">✓</span> <span>${renderMarkdownInline(item)}</span></li>`).join('')}\n                  </ul>\n                </div>\n              </div>\n              <div class=\"col-md-6\">\n                <div class=\"scope-box\">\n                  <div class=\"d-flex align-items-center gap-2 mb-2\">\n                    <span class=\"badge bg-secondary bg-opacity-15 text-muted border border-secondary border-opacity-25 font-mono\">✕ OUT OF SCOPE</span>\n                  </div>\n                  <ul class=\"list-unstyled mb-0 d-flex flex-column gap-1\">\n                    ${outOfScope.map(item => `<li class=\"small text-secondary d-flex align-items-start gap-2\"><span>✕</span> <span>${renderMarkdownInline(item)}</span></li>`).join('')}\n                  </ul>\n                </div>\n              </div>\n            </div>\n          ` : ''}\n\n          ${approach ? `\n            <div class=\"p-3 rounded bg-dark border border-secondary border-opacity-25\">\n              <div class=\"text-secondary small text-uppercase fw-semibold mb-2\">High-Level Approach</div>\n              <div class=\"markdown-content\">${renderMarkdown(approach)}</div>\n            </div>\n          ` : ''}\n\n          ${adrs.length > 0 ? `\n            <div class=\"d-flex align-items-center gap-2\">\n              <span class=\"text-secondary small text-uppercase fw-semibold\">ADRs:</span>\n              ${adrs.map(a => `<span class=\"badge bg-dark border border-secondary text-primary-hover font-mono small\">${escapeHtml(a.title)}</span>`).join(' ')}\n            </div>\n          ` : ''}\n        </div>`;\n    }\n\n    function renderUserStoriesSection(userStories) {\n      if (!userStories || userStories.length === 0) {\n        return '<div class=\"text-muted small\">No user stories found in plan.md / spec.md.</div>';\n      }\n\n      return `\n        <div class=\"row g-3\">\n          ${userStories.map(us => {\n            const id = typeof us === 'object' ? us.id : '';\n            const role = typeof us === 'object' ? us.role : 'User';\n            const action = typeof us === 'object' ? us.action : us;\n            const benefit = typeof us === 'object' ? us.benefit : '';\n\n            return `\n              <div class=\"col-md-6\">\n                <div class=\"us-card\">\n                  <div>\n                    <div class=\"d-flex justify-content-between align-items-center mb-2\">\n                      <span class=\"us-id-badge\">${escapeHtml(id || 'US')}</span>\n                      <span class=\"us-role-badge\">Role: ${escapeHtml(role)}</span>\n                    </div>\n                    <div class=\"text-light small mb-2\">\n                      <span class=\"text-secondary\">I want to:</span> <strong>${renderMarkdownInline(action)}</strong>\n                    </div>\n                  </div>\n                  ${benefit ? `\n                    <div class=\"pt-2 border-top border-secondary border-opacity-25 text-secondary small\">\n                      <span>So that:</span> ${renderMarkdownInline(benefit)}\n                    </div>\n                  ` : ''}\n                </div>\n              </div>`;\n          }).join('')}\n        </div>`;\n    }\n\n    function renderBddSection(criteria) {\n      if (!criteria || criteria.length === 0) {\n        return '<div class=\"text-muted small\">No BDD acceptance criteria found in spec.md.</div>';\n      }\n\n      return `\n        <div class=\"d-flex flex-column gap-3\">\n          ${criteria.map(ac => {\n            return `\n              <div class=\"bdd-scenario-card\">\n                <div class=\"bdd-scenario-header\">\n                  <div class=\"d-flex align-items-center gap-2\">\n                    <span class=\"badge bg-primary text-white font-mono\">${escapeHtml(ac.id)}</span>\n                    <span class=\"fw-semibold text-white small\">${escapeHtml(ac.title)}</span>\n                  </div>\n                  <span class=\"badge bg-dark text-secondary border border-secondary border-opacity-25 font-mono small\">${escapeHtml(ac.category)}</span>\n                </div>\n                <div class=\"bdd-scenario-body\">\n                  ${(ac.clauses || []).map(c => {\n                    let badgeClass = 'badge-and';\n                    if (c.keyword === 'GIVEN') badgeClass = 'badge-given';\n                    else if (c.keyword === 'WHEN') badgeClass = 'badge-when';\n                    else if (c.keyword === 'THEN') badgeClass = 'badge-then';\n\n                    return `\n                      <div class=\"bdd-clause-row\">\n                        <span class=\"badge-gherkin ${badgeClass}\">${c.keyword}</span>\n                        <span class=\"text-light\">${renderMarkdownInline(c.text)}</span>\n                      </div>`;\n                  }).join('')}\n                </div>\n              </div>`;\n          }).join('')}\n        </div>`;\n    }\n\n    function renderTasksTable(tasks) {\n      if (!tasks || tasks.length === 0) {\n        return '<div class=\"text-muted small py-2\">No tasks defined in tasks.md.</div>';\n      }\n\n      return `\n        <div class=\"table-responsive rounded border border-secondary border-opacity-25\">\n          <table class=\"table table-custom\">\n            <thead>\n              <tr>\n                <th style=\"width: 50px;\">Status</th>\n                <th style=\"width: 90px;\">ID</th>\n                <th style=\"width: 80px;\">Type</th>\n                <th>Description</th>\n                <th>Target Files</th>\n                <th>Dependencies</th>\n                <th>Evidence</th>\n              </tr>\n            </thead>\n            <tbody>\n              ${tasks.map(t => {\n                const statusIcon = t.status === 'done' \n                  ? '<span class=\"text-success fw-bold\">✓</span>' \n                  : t.status === 'in_progress' \n                    ? '<span class=\"text-primary fw-bold\">▶</span>' \n                    : '<span class=\"text-secondary\">○</span>';\n\n                return `\n                  <tr>\n                    <td class=\"text-center font-mono\">${statusIcon}</td>\n                    <td class=\"font-mono text-white fw-medium\">${escapeHtml(t.id)}</td>\n                    <td><span class=\"badge badge-task-type font-mono\">${escapeHtml(t.type)}</span></td>\n                    <td class=\"text-light\">${renderMarkdownInline(t.description)}</td>\n                    <td><code class=\"small text-secondary\">${escapeHtml(t.targetFiles)}</code></td>\n                    <td class=\"font-mono text-muted small\">${escapeHtml(t.dependencies)}</td>\n                    <td class=\"font-mono small text-muted\">${escapeHtml(t.evidence || '-')}</td>\n                  </tr>`;\n              }).join('')}\n            </tbody>\n          </table>\n        </div>`;\n    }\n\n    function renderMarkdown(md) {\n      if (!md) return '';\n      if (typeof marked !== 'undefined' && marked.parse) {\n        return marked.parse(md);\n      }\n      return escapeHtml(md)\n        .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')\n        .replace(/`([^`]+)`/g, '<code class=\"text-primary-hover\">$1</code>')\n        .replace(/\\n\\n/g, '<br/><br/>')\n        .replace(/\\n/g, '<br/>');\n    }\n\n    function renderMarkdownInline(str) {\n      if (!str) return '';\n      return escapeHtml(str)\n        .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')\n        .replace(/`([^`]+)`/g, '<code class=\"text-primary-hover\">$1</code>');\n    }\n\n    function toggleCollapse(featureId) {\n      const el = document.getElementById('collapse-' + featureId);\n      if (el.style.display === 'none') {\n        el.style.display = 'block';\n      } else {\n        el.style.display = 'none';\n      }\n    }\n\n    function toggleSubSection(id) {\n      const el = document.getElementById('section-' + id);\n      if (!el) return;\n      if (el.style.display === 'none') {\n        el.style.display = 'block';\n      } else {\n        el.style.display = 'none';\n      }\n    }\n\n    function escapeHtml(str) {\n      if (!str) return '';\n      return String(str)\n        .replace(/&/g, '&amp;')\n        .replace(/</g, '&lt;')\n        .replace(/>/g, '&gt;')\n        .replace(/\"/g, '&quot;')\n        .replace(/'/g, '&#039;');\n    }\n\n    function initLiveSync() {\n      if (window.EventSource) {\n        const evtSource = new EventSource('/api/events');\n        const badge = document.getElementById('liveSyncBadge');\n\n        evtSource.onopen = () => {\n          if (badge) {\n            badge.className = 'badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 font-mono';\n            badge.innerHTML = '● Live Sync';\n          }\n        };\n\n        evtSource.onmessage = () => {\n          if (badge) {\n            badge.className = 'badge bg-primary bg-opacity-20 text-primary-hover border border-primary border-opacity-40 font-mono';\n            badge.innerHTML = '⚡ Syncing...';\n          }\n          loadFeatures().then(() => {\n            setTimeout(() => {\n              if (badge) {\n                badge.className = 'badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 font-mono';\n                badge.innerHTML = '● Live Sync';\n              }\n            }, 600);\n          });\n        };\n\n        evtSource.onerror = () => {\n          if (badge) {\n            badge.className = 'badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 font-mono';\n            badge.innerHTML = '○ Polling Fallback';\n          }\n        };\n      } else {\n        setInterval(loadFeatures, 3000);\n      }\n    }\n\n    document.addEventListener('DOMContentLoaded', () => {\n      loadFeatures();\n      initLiveSync();\n    });\n  </script>\n</body>\n</html>\n";
}

module.exports = {
  parseTasksTable,
  parseFeature,
  getAllFeatures,
  startServer,
  parseUserStory,
  parsePlanSections,
  parseAcceptanceCriteria
};

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  startServer(PORT).then(server => {
    const actualPort = server.address().port;
    console.log(`\n🚀 [SPECS DASHBOARD] Servidor ativo em http://localhost:${actualPort}\n`);
  });
}
