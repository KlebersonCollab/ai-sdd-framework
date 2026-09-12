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
const crypto = require('crypto');
const { spawn } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '../..');
const SPECS_FEATURES_DIR = path.join(REPO_ROOT, '.specs', 'features');
const MEMORY_GRAPH_FILE = path.join(REPO_ROOT, '.agents', 'memory', 'memory_graph.jsonl');
const DASHBOARD_DIST_DIR = path.join(REPO_ROOT, '.agents', 'dashboard', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

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
 * Surgically updates task status and feedback/evidence in Markdown table content
 * @param {string} content - Markdown file content
 * @param {string} taskId - Target task identifier
 * @param {string} newStatus - Target status: 'pending', 'in_progress', or 'done'
 * @param {string} [feedbackOrEvidence] - Optional feedback note or evidence commit
 * @returns {string} Updated Markdown content
 */
function updateTaskInMarkdown(content, taskId, newStatus, feedbackOrEvidence) {
  if (!content || !taskId || !newStatus) return content;
  const lines = content.split('\n');
  const targetId = taskId.trim().toLowerCase();

  let statusMarker = '[ ]';
  if (newStatus === 'done') statusMarker = '[x]';
  else if (newStatus === 'in_progress') statusMarker = '[-]';

  const updatedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.includes('Target Files') || trimmed.includes('---')) {
      return line;
    }

    const columns = trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
    if (columns.length < 5) return line;

    const rowId = (columns[1] || '').toLowerCase();
    if (rowId !== targetId) return line;

    // Surgical status replacement preserving line padding
    let updatedLine = line.replace(/(\|\s*)\[[^\]]*\](\s*\|)/, `$1${statusMarker}$2`);

    if (feedbackOrEvidence) {
      const note = newStatus === 'pending' ? `[Reverted] ${feedbackOrEvidence}` : feedbackOrEvidence;
      // Replace the last column before the trailing pipe
      updatedLine = updatedLine.replace(/\|\s*([^|]*)\s*\|\s*$/, `| ${note} |`);
    }

    return updatedLine;
  });

  return updatedLines.join('\n');
}

/**
 * Updates a task in .specs/features/<featureId>/tasks.md and returns the updated task object
 * @param {string} featureId
 * @param {string} taskId
 * @param {string} newStatus
 * @param {string} [feedbackOrEvidence]
 * @returns {object} Updated task
 */
function updateFeatureTask(featureId, taskId, newStatus, feedbackOrEvidence) {
  const featureDir = path.join(SPECS_FEATURES_DIR, featureId);
  const tasksPath = path.join(featureDir, 'tasks.md');

  if (!fs.existsSync(tasksPath)) {
    throw new Error(`Feature '${featureId}' or tasks.md not found`);
  }

  const rawMd = fs.readFileSync(tasksPath, 'utf8');
  const existingTasks = parseTasksTable(rawMd);
  const targetTask = existingTasks.find(t => t.id.toLowerCase() === taskId.trim().toLowerCase());

  if (!targetTask) {
    throw new Error(`Task '${taskId}' not found in feature '${featureId}'`);
  }

  const updatedMd = updateTaskInMarkdown(rawMd, taskId, newStatus, feedbackOrEvidence);
  fs.writeFileSync(tasksPath, updatedMd, 'utf8');

  // Trigger real-time live sync for open browsers
  notifyClients();

  const refreshedTasks = parseTasksTable(updatedMd);
  return refreshedTasks.find(t => t.id.toLowerCase() === taskId.trim().toLowerCase()) || {
    id: taskId,
    status: newStatus
  };
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
 * Parses memory_graph.jsonl into an interactive property graph (nodes, edges, stats)
 * @param {string} [jsonlContent]
 * @returns {{ nodes: Array<object>, edges: Array<object>, stats: object }}
 */
function parseMemoryGraph(jsonlContent) {
  let content = jsonlContent;
  if (typeof content !== 'string') {
    if (fs.existsSync(MEMORY_GRAPH_FILE)) {
      content = fs.readFileSync(MEMORY_GRAPH_FILE, 'utf8');
    } else {
      content = '';
    }
  }

  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const nodesMap = new Map();
  const edges = [];
  const observationRecords = [];
  let activeCount = 0;
  let supersededCount = 0;

  // Pass 1: Parse entities
  for (const line of lines) {
    try {
      const record = JSON.parse(line);
      if (record.type === 'entity' && record.name) {
        const obs = Array.isArray(record.observations) ? [...record.observations] : [];
        const status = record.status || 'active';
        if (status === 'active') activeCount++;
        else if (status === 'superseded') supersededCount++;

        nodesMap.set(record.name, {
          id: record.name,
          label: record.name,
          entityType: record.entityType || 'entity',
          role: record.role || 'general',
          status,
          supersededBy: record.supersededBy || null,
          confidence: record.confidence || 'high',
          namespace: record.namespace || 'global',
          tenantId: record.tenantId || null,
          observations: obs,
          updatedAt: record.updatedAt || null,
          accessCount: record.access_count || 0
        });
      } else if (record.type === 'observation') {
        observationRecords.push(record);
      } else if (record.type === 'relation') {
        edges.push(record);
      }
    } catch (err) {
      // Ignore malformed JSON line
    }
  }

  // Pass 2: Attach observations
  for (const obs of observationRecords) {
    const targetName = obs.entityName;
    if (!targetName) continue;

    if (!nodesMap.has(targetName)) {
      nodesMap.set(targetName, {
        id: targetName,
        label: targetName,
        entityType: 'inferred',
        role: 'general',
        status: 'active',
        observations: [],
        confidence: 'medium',
        namespace: obs.namespace || 'project'
      });
      activeCount++;
    }

    const node = nodesMap.get(targetName);
    if (obs.content && !node.observations.includes(obs.content)) {
      node.observations.push(obs.content);
    }
    if (Array.isArray(obs.contents)) {
      for (const c of obs.contents) {
        if (c && !node.observations.includes(c)) {
          node.observations.push(c);
        }
      }
    }
  }

  // Pass 3: Process relations and infer missing endpoints
  const processedEdges = [];
  for (let i = 0; i < edges.length; i++) {
    const rel = edges[i];
    const from = rel.from;
    const to = rel.to;
    if (!from || !to) continue;

    if (!nodesMap.has(from)) {
      nodesMap.set(from, {
        id: from,
        label: from,
        entityType: 'inferred',
        role: 'general',
        status: 'active',
        observations: [],
        confidence: 'tentative',
        namespace: rel.namespace || 'project'
      });
      activeCount++;
    }

    if (!nodesMap.has(to)) {
      nodesMap.set(to, {
        id: to,
        label: to,
        entityType: 'inferred',
        role: 'general',
        status: 'active',
        observations: [],
        confidence: 'tentative',
        namespace: rel.namespace || 'project'
      });
      activeCount++;
    }

    processedEdges.push({
      id: `edge-${i + 1}`,
      from,
      to,
      label: rel.predicate || rel.relationType || 'RELATED_TO',
      weight: typeof rel.weight === 'number' ? rel.weight : 1,
      status: rel.status || 'active',
      confidence: rel.confidence || 'high',
      namespace: rel.namespace || 'global',
      arrows: 'to'
    });
  }

  const nodes = Array.from(nodesMap.values());

  return {
    nodes,
    edges: processedEdges,
    stats: {
      totalNodes: nodes.length,
      totalEdges: processedEdges.length,
      activeCount,
      supersededCount
    }
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
let activeWatchers = [];

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
  if (activeWatchers.length > 0) return activeWatchers;
  const specsDir = path.join(REPO_ROOT, '.specs');
  const memoryDir = path.join(REPO_ROOT, '.agents', 'memory');
  const dirs = [specsDir, memoryDir].filter(d => fs.existsSync(d));

  for (const dir of dirs) {
    try {
      const watcher = fs.watch(dir, { recursive: true }, () => {
        clearTimeout(watchDebounceTimer);
        watchDebounceTimer = setTimeout(() => {
          notifyClients();
        }, 300);
      });
      if (watcher && typeof watcher.unref === 'function') {
        watcher.unref();
      }
      activeWatchers.push(watcher);
    } catch (err) {
      // Non-fatal if recursive watch unavailable
    }
  }
  return activeWatchers;
}

const activeTerminalProcesses = [];

/**
 * Attempts to serve static files from .agents/dashboard/dist/
 * @param {string} pathname
 * @param {http.ServerResponse} res
 * @returns {boolean} True if file was handled
 */
function tryServeStaticFile(pathname, res) {
  if (pathname.startsWith('/api')) return false;
  if (!fs.existsSync(DASHBOARD_DIST_DIR)) return false;

  // Serve SPA index.html explicitly via /spa or when legacy template is removed in TASK-10
  // Handled below by targetPath mapping to index.html

  const targetPath = (pathname === '/' || pathname === '/index.html') ? 'index.html' : pathname.replace(/^\//, '');
  const targetFile = path.resolve(DASHBOARD_DIST_DIR, targetPath);

  // Security check: ensure path is strictly within DASHBOARD_DIST_DIR
  if (!targetFile.startsWith(DASHBOARD_DIST_DIR)) return false;

  if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
    const ext = path.extname(targetFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    fs.createReadStream(targetFile).pipe(res);
    return true;
  }

  // SPA fallback for HTML5 history mode: if not requesting a file with an extension, serve index.html
  if (!path.extname(targetPath)) {
    const indexFile = path.join(DASHBOARD_DIST_DIR, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      fs.createReadStream(indexFile).pipe(res);
      return true;
    }
  }

  return false;
}

function parseWsFrame(buffer) {
  if (buffer.length < 2) return null;
  const opcode = buffer[0] & 0x0f;
  const isMasked = (buffer[1] & 0x80) !== 0;
  let payloadLen = buffer[1] & 0x7f;
  let offset = 2;

  if (payloadLen === 126) {
    if (buffer.length < 4) return null;
    payloadLen = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLen === 127) {
    if (buffer.length < 10) return null;
    payloadLen = Number(buffer.readBigUInt64BE(2));
    offset = 10;
  }

  let mask = null;
  if (isMasked) {
    if (buffer.length < offset + 4) return null;
    mask = buffer.slice(offset, offset + 4);
    offset += 4;
  }

  if (buffer.length < offset + payloadLen) return null;

  const payload = buffer.slice(offset, offset + payloadLen);
  if (isMasked && mask) {
    for (let i = 0; i < payload.length; i++) {
      payload[i] ^= mask[i % 4];
    }
  }

  return {
    opcode,
    payload,
    totalLength: offset + payloadLen
  };
}

function sendWsText(sock, text) {
  if (!sock || sock.destroyed) return;
  const payload = Buffer.from(text, 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x81, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  try {
    sock.write(Buffer.concat([header, payload]));
  } catch (e) {}
}

/**
 * Detects the default terminal font configured in the OS (e.g. Windows Terminal settings)
 * @returns {string} Font face name
 */
function detectOsTerminalFont() {
  if (process.env.TERMINAL_FONT) return process.env.TERMINAL_FONT;
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    const candidatePaths = [
      path.join(process.env.LOCALAPPDATA, 'Packages', 'Microsoft.WindowsTerminal_8wekyb3d8bbwe', 'LocalState', 'settings.json'),
      path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Windows Terminal', 'settings.json'),
      path.join(process.env.LOCALAPPDATA, 'Packages', 'Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe', 'LocalState', 'settings.json')
    ];
    for (const p of candidatePaths) {
      try {
        if (fs.existsSync(p)) {
          const raw = fs.readFileSync(p, 'utf8');
          const match = raw.match(/"face"\s*:\s*"([^"]+)"/i);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
      } catch (e) {}
    }
  }
  return 'JetBrainsMonoNL Nerd Font Mono';
}

function handleTerminalUpgrade(req, socket, head) {
  const parsedUrl = new URL(req.url, 'http://localhost');
  if (parsedUrl.pathname !== '/api/terminal') {
    socket.destroy();
    return;
  }

  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const acceptKey = crypto.createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`
  ];

  socket.write(headers.concat('\r\n').join('\r\n'));

  // Spawn local shell (PowerShell on Windows, SHELL or bash on POSIX)
  const isWin = process.platform === 'win32';
  const shell = isWin ? (process.env.POWERSHELL_PATH || 'powershell.exe') : (process.env.SHELL || '/bin/bash');
  const shellArgs = isWin
    ? ['-NoLogo', '-NoExit', '-Command', '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; [Console]::InputEncoding = [System.Text.Encoding]::UTF8; $OutputEncoding = [System.Text.Encoding]::UTF8;']
    : [];

  let shellProc = null;
  try {
    shellProc = spawn(shell, shellArgs, {
      cwd: REPO_ROOT,
      env: Object.assign({}, process.env, {
        PYTHONIOENCODING: 'utf-8',
        LANG: 'en_US.UTF-8',
        LC_ALL: 'en_US.UTF-8'
      }),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    if (typeof shellProc.unref === 'function') {
      shellProc.unref();
    }
  } catch (err) {
    sendWsText(socket, `\r\nFailed to start shell: ${err.message}\r\n`);
    return;
  }

  activeTerminalProcesses.push(shellProc);

  shellProc.stdout.on('data', data => {
    sendWsText(socket, data.toString('utf8'));
  });

  shellProc.stderr.on('data', data => {
    sendWsText(socket, data.toString('utf8'));
  });

  let buffer = Buffer.alloc(0);
  socket.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length > 0) {
      const frame = parseWsFrame(buffer);
      if (!frame) break;
      buffer = buffer.slice(frame.totalLength);

      if (frame.opcode === 0x08) { // Close
        socket.end();
        break;
      } else if (frame.opcode === 0x09) { // Ping -> Pong
        socket.write(Buffer.from([0x8a, 0x00]));
      } else if (frame.opcode === 0x01 || frame.opcode === 0x02) {
        const msgStr = frame.payload.toString('utf8');
        try {
          if (msgStr.startsWith('{') && (msgStr.includes('"command"') || msgStr.includes('"type"'))) {
            const parsed = JSON.parse(msgStr);
            if (parsed.command && shellProc.stdin) {
              const cmd = parsed.command.trim();
              shellProc.stdin.write(cmd + '\r\n');
              continue;
            }
          }
        } catch (e) {}

        if (shellProc.stdin && !shellProc.killed) {
          const input = msgStr === '\r' ? '\r\n' : msgStr;
          shellProc.stdin.write(input);
        }
      }
    }
  });

  const cleanup = () => {
    if (shellProc && !shellProc.killed) {
      try { shellProc.kill(); } catch (e) {}
      try { if (shellProc.stdin) shellProc.stdin.destroy(); } catch (e) {}
      try { if (shellProc.stdout) shellProc.stdout.destroy(); } catch (e) {}
      try { if (shellProc.stderr) shellProc.stderr.destroy(); } catch (e) {}
    }
    const idx = activeTerminalProcesses.indexOf(shellProc);
    if (idx !== -1) activeTerminalProcesses.splice(idx, 1);
    if (!socket.destroyed) socket.destroy();
  };

  socket.on('close', cleanup);
  socket.on('error', cleanup);
  shellProc.on('close', () => {
    sendWsText(socket, '\r\n[Terminal process exited]\r\n');
    try { socket.end(); } catch (e) {}
  });
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
    // Check pre-built static files from .agents/dashboard/dist/
    if (req.method === 'GET' && tryServeStaticFile(pathname, res)) {
      return;
    }

    if (pathname === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }

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

    if (req.method === 'GET' && pathname === '/api/memory') {
      try {
        const graph = parseMemoryGraph();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(graph));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (req.method === 'GET' && pathname === '/api/terminal-config') {
      try {
        const fontFamily = detectOsTerminalFont();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          fontFamily,
          shell: process.platform === 'win32' ? (process.env.POWERSHELL_PATH || 'powershell.exe') : (process.env.SHELL || '/bin/bash')
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (req.method === 'PATCH') {
      const patchMatch = pathname.match(/^\/api\/features\/([^\/]+)\/tasks\/([^\/]+)$/);
      if (patchMatch) {
        const featureId = decodeURIComponent(patchMatch[1]);
        const taskId = decodeURIComponent(patchMatch[2]);
        let bodyStr = '';
        req.on('data', chunk => { bodyStr += chunk; });
        req.on('end', () => {
          try {
            const body = JSON.parse(bodyStr || '{}');
            if (!body.status || !['pending', 'in_progress', 'done'].includes(body.status.toLowerCase())) {
              res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ error: 'Invalid or missing status. Allowed: pending, in_progress, done' }));
              return;
            }
            const updatedTask = updateFeatureTask(featureId, taskId, body.status.toLowerCase(), body.feedback || body.evidence);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, task: updatedTask, featureId }));
          } catch (err) {
            const statusCode = err.message && err.message.includes('not found') ? 404 : 500;
            res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }
    }

    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Specs Dashboard — AI-SDD Cockpit</title></head><body style="background:#010102;color:#f7f8f8;font-family:sans-serif;padding:2rem;"><h2>AI-SDD Cockpit</h2><p>Dashboard build assets not found in <code>.agents/dashboard/dist/</code>.</p><p>Please run <code>npm run build:dashboard</code> to compile the Vue 3 dashboard.</p></body></html>');
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  });

  server.on('upgrade', handleTerminalUpgrade);

  server.on('close', () => {
    for (const client of sseClients) {
      try { client.end(); } catch (e) {}
    }
    sseClients.clear();
    for (const watcher of activeWatchers) {
      try { watcher.close(); } catch (e) {}
    }
    activeWatchers = [];
    for (const proc of activeTerminalProcesses) {
      try { proc.kill(); } catch (e) {}
    }
    activeTerminalProcesses.length = 0;
    if (watchDebounceTimer) {
      clearTimeout(watchDebounceTimer);
      watchDebounceTimer = null;
    }
  });

  const origClose = server.close.bind(server);
  server.close = function (cb) {
    for (const proc of activeTerminalProcesses) {
      try { proc.kill(); } catch (e) {}
    }
    activeTerminalProcesses.length = 0;
    if (typeof server.closeAllConnections === 'function') {
      try { server.closeAllConnections(); } catch (e) {}
    }
    return origClose(cb);
  };

  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      resolve(server);
    });
    server.on('error', reject);
  });
}

module.exports = {
  parseTasksTable,
  parseFeature,
  getAllFeatures,
  startServer,
  parseUserStory,
  parsePlanSections,
  parseAcceptanceCriteria,
  parseMemoryGraph,
  updateTaskInMarkdown,
  updateFeatureTask,
  detectOsTerminalFont
};

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  startServer(PORT).then(server => {
    const actualPort = server.address().port;
    console.log(`\n🚀 [SPECS DASHBOARD] Servidor ativo em http://localhost:${actualPort}\n`);
  });
}
