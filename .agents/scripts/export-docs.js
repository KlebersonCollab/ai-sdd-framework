#!/usr/bin/env node

/**
 * Standalone Static Documentation Exporter
 * AI-SDD Framework | Spec Driven Development Lifecycle
 *
 * Zero-dependency native Node.js compiler.
 * Compiles 100% of .specs/ and .agents/rules/ into a single standalone HTML file.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../..');
const serveDashboard = require('./serve-dashboard.js');

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderSimpleMarkdown(md) {
  if (!md) return '';
  // Basic markdown formatting for zero-dependency offline rendering
  let html = escapeHtml(md);

  // Fenced code blocks with optional language
  html = html.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/gi, (match, lang, code) => {
    if (lang.toLowerCase() === 'mermaid') {
      return `<div class="mermaid">${code}</div>`;
    }
    return `<pre><code class="lang-${lang}">${code}</code></pre>`;
  });

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h4 class="doc-h3">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="doc-h2">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 class="doc-h1">$1</h2>');

  // Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Unordered lists
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="doc-li">$1</li>');

  // Paragraph breaks
  html = html.replace(/\n\n+/g, '</p><p class="doc-p">');

  return `<div class="md-body"><p class="doc-p">${html}</p></div>`;
}

function generateStandaloneHtml(data) {
  const { project, codebase, rules, knowledge, features } = data;

  const adrsHtml = (project.adrs || []).map(adr => {
    const statusClass = adr.status === 'accepted' ? 'badge-success' :
      adr.status === 'superseded' ? 'badge-muted' :
      adr.status === 'proposed' ? 'badge-primary' : 'badge-warning';

    return `
      <div class="card adr-card" data-status="${escapeHtml(adr.status)}" data-title="${escapeHtml(adr.title.toLowerCase())}">
        <div class="card-header flex justify-between">
          <div class="flex items-center gap-2">
            <span class="badge ${statusClass}">${escapeHtml(adr.status.toUpperCase())}</span>
            <span class="card-title">${escapeHtml(adr.title)}</span>
          </div>
          <span class="card-date">${escapeHtml(adr.date || '')}</span>
        </div>
        <div class="card-body">
          ${renderSimpleMarkdown(adr.content)}
        </div>
      </div>
    `;
  }).join('\n');

  const featuresHtml = (features || []).map(feat => {
    const completionBadge = feat.completionRate === 100 ? 'badge-success' : 'badge-primary';
    const tasksTable = (feat.tasks || []).map(t => `
      <tr>
        <td class="status-col"><span class="badge ${t.status === 'done' ? 'badge-success' : 'badge-muted'}">${t.status.toUpperCase()}</span></td>
        <td class="id-col"><code>${escapeHtml(t.id)}</code></td>
        <td class="type-col"><span class="type-pill">${escapeHtml(t.type || 'feat')}</span></td>
        <td>${escapeHtml(t.description)}</td>
        <td class="files-col"><code>${escapeHtml(t.targetFiles || 'N/A')}</code></td>
      </tr>
    `).join('\n');

    return `
      <div class="card feature-card">
        <div class="card-header flex justify-between">
          <div class="flex items-center gap-2">
            <span class="badge ${completionBadge}">${feat.completionRate}%</span>
            <span class="card-title">${escapeHtml(feat.title || feat.id)}</span>
            <span class="card-subtitle font-mono">${escapeHtml(feat.id)}</span>
          </div>
          <span class="task-count">${feat.completedTasks}/${feat.totalTasks} Tasks</span>
        </div>
        <div class="card-body">
          ${feat.problemStatement ? `<div class="problem-box"><strong>Problem Statement:</strong><br>${renderSimpleMarkdown(feat.problemStatement)}</div>` : ''}
          <h4 class="section-title">Implementation Tasks (MetaGPT SOP)</h4>
          <table class="tasks-table">
            <thead>
              <tr><th>Status</th><th>ID</th><th>Type</th><th>Description</th><th>Target Files</th></tr>
            </thead>
            <tbody>${tasksTable}</tbody>
          </table>
        </div>
      </div>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI-SDD Living Documentation</title>
  <!-- DESIGN.md Linear Dark Tokens -->
  <style>
    :root {
      --canvas: #010102;
      --surface-1: #0f1011;
      --surface-2: #16181a;
      --surface-3: #1f2226;
      --hairline: rgba(255, 255, 255, 0.08);
      --hairline-strong: rgba(255, 255, 255, 0.16);
      --primary: #5e6ad2;
      --primary-hover: #717de0;
      --success: #27a644;
      --warning: #f59e0b;
      --ink: #f7f8f8;
      --ink-muted: #8a8f98;
      --ink-subtle: #62666d;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--canvas);
      color: var(--ink);
      font-family: var(--font-sans);
      font-size: 14px;
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background-color: var(--surface-1);
      border-bottom: 1px solid var(--hairline);
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .brand { display: flex; align-items: center; gap: 0.75rem; }
    .brand-logo { font-size: 1.25rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
    .brand-badge {
      background: rgba(94, 106, 210, 0.15);
      border: 1px solid rgba(94, 106, 210, 0.3);
      color: var(--primary-hover);
      font-family: var(--font-mono);
      font-size: 0.7rem;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
    }
    nav.top-tabs { display: flex; gap: 0.5rem; }
    .tab-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--ink-muted);
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .tab-btn:hover { color: #fff; background: var(--surface-2); }
    .tab-btn.active { color: #fff; background: var(--surface-2); border-color: var(--hairline-strong); }
    main { max-width: 1200px; width: 100%; margin: 2rem auto; padding: 0 1.5rem; flex: 1; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .card {
      background-color: var(--surface-1);
      border: 1px solid var(--hairline);
      border-radius: 8px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .card-header { margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--hairline); }
    .card-title { font-weight: 600; font-size: 1rem; color: #fff; }
    .card-subtitle { font-size: 0.8rem; color: var(--ink-muted); margin-left: 0.5rem; }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
      font-family: var(--font-mono);
      font-weight: 600;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-success { background: rgba(39, 166, 68, 0.15); color: #4ade80; border: 1px solid rgba(39, 166, 68, 0.3); }
    .badge-primary { background: rgba(94, 106, 210, 0.15); color: var(--primary-hover); border: 1px solid rgba(94, 106, 210, 0.3); }
    .badge-muted { background: var(--surface-3); color: var(--ink-muted); border: 1px solid var(--hairline); }
    .badge-warning { background: rgba(245, 158, 11, 0.15); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.3); }
    .tasks-table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; font-size: 0.8rem; }
    .tasks-table th, .tasks-table td { padding: 0.6rem 0.75rem; text-align: left; border-bottom: 1px solid var(--hairline); }
    .tasks-table th { color: var(--ink-muted); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; font-family: var(--font-mono); }
    code, pre { font-family: var(--font-mono); }
    code.inline-code { background: var(--surface-3); padding: 0.15rem 0.35rem; border-radius: 4px; font-size: 0.85em; color: var(--primary-hover); }
    pre { background: var(--surface-2); border: 1px solid var(--hairline); border-radius: 6px; padding: 1rem; overflow-x: auto; margin: 0.75rem 0; font-size: 0.85rem; }
    .search-input {
      background: var(--surface-2);
      border: 1px solid var(--hairline);
      color: #fff;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-family: var(--font-mono);
      width: 260px;
    }
    .search-input:focus { outline: none; border-color: var(--primary); }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .gap-2 { gap: 0.5rem; }
    .gap-4 { gap: 1rem; }
    .mb-4 { margin-bottom: 1rem; }
    .filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    footer { text-align: center; padding: 2rem; color: var(--ink-subtle); font-size: 0.8rem; border-top: 1px solid var(--hairline); }
  </style>
  <!-- Mermaid Support -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (window.mermaid) {
        mermaid.initialize({ startOnLoad: true, theme: 'dark' });
      }
    });
  </script>
</head>
<body>
  <header>
    <div class="brand">
      <span class="brand-logo">AI-SDD Living Specs</span>
      <span class="brand-badge">Offline Document</span>
    </div>
    <nav class="top-tabs">
      <button class="tab-btn active" onclick="switchTab('specs')">📋 Features & Specs</button>
      <button class="tab-btn" onclick="switchTab('architecture')">🏛️ Architecture</button>
      <button class="tab-btn" onclick="switchTab('adrs')">📜 ADR Hub</button>
      <button class="tab-btn" onclick="switchTab('glossary')">📖 Domain & Vision</button>
      <button class="tab-btn" onclick="switchTab('rules')">🛡️ Rules</button>
    </nav>
  </header>

  <main>
    <!-- TAB 1: FEATURES & SPECS -->
    <section id="tab-specs" class="tab-content active">
      <div class="filter-bar">
        <h3 style="color:#fff;font-size:1.1rem;">Active Specifications (.specs/features)</h3>
        <input type="text" class="search-input" placeholder="Filter features..." oninput="filterCards('.feature-card', this.value)">
      </div>
      <div class="features-list">
        ${featuresHtml || '<div class="card"><p class="text-ink-muted">No active features found.</p></div>'}
      </div>
    </section>

    <!-- TAB 2: ARCHITECTURE & CODEBASE -->
    <section id="tab-architecture" class="tab-content">
      <div class="card">
        <div class="card-header"><span class="card-title">Technical Map & Stack</span></div>
        <div class="card-body">
          ${renderSimpleMarkdown(codebase.technicalMap)}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">System Architecture</span></div>
        <div class="card-body">
          ${renderSimpleMarkdown(codebase.architecture)}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Stack & Dependencies</span></div>
        <div class="card-body">
          ${renderSimpleMarkdown(codebase.stack)}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Conventions & Rules</span></div>
        <div class="card-body">
          ${renderSimpleMarkdown(codebase.conventions)}
        </div>
      </div>
    </section>

    <!-- TAB 3: ADR HUB -->
    <section id="tab-adrs" class="tab-content">
      <div class="filter-bar">
        <div class="flex items-center gap-2">
          <button class="tab-btn active" onclick="filterAdrStatus('all', this)">All</button>
          <button class="tab-btn" onclick="filterAdrStatus('accepted', this)">Accepted</button>
          <button class="tab-btn" onclick="filterAdrStatus('superseded', this)">Superseded</button>
          <button class="tab-btn" onclick="filterAdrStatus('proposed', this)">Proposed</button>
        </div>
        <input type="text" class="search-input" placeholder="Search decisions..." oninput="filterAdrText(this.value)">
      </div>
      <div class="adrs-list">
        ${adrsHtml || '<div class="card"><p class="text-ink-muted">No ADRs recorded.</p></div>'}
      </div>
    </section>

    <!-- TAB 4: DOMAIN & GLOSSARY -->
    <section id="tab-glossary" class="tab-content">
      <div class="card">
        <div class="card-header"><span class="card-title">Project Vision</span></div>
        <div class="card-body">
          ${renderSimpleMarkdown(project.project)}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Project Roadmap</span></div>
        <div class="card-body">
          ${renderSimpleMarkdown(project.roadmap)}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Domain Glossary & Ubiquitous Language</span></div>
        <div class="card-body">
          ${renderSimpleMarkdown(project.context)}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Current State & Session Memory</span></div>
        <div class="card-body">
          ${renderSimpleMarkdown(project.state)}
        </div>
      </div>
    </section>

    <!-- TAB 5: RULES -->
    <section id="tab-rules" class="tab-content">
      <div class="card">
        <div class="card-header"><span class="card-title">Tier 1 Absolute Prohibitions</span></div>
        <div class="card-body">
          ${renderSimpleMarkdown(rules.prohibitions)}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Quality Enforcement</span></div>
        <div class="card-body">
          ${renderSimpleMarkdown(rules.quality)}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Token Optimization</span></div>
        <div class="card-body">
          ${renderSimpleMarkdown(rules.tokenOptimization)}
        </div>
      </div>
    </section>
  </main>

  <footer>
    <p>AI-SDD Framework · Spec Driven Development Lifecycle · Single-File Standalone Living Projection</p>
  </footer>

  <script>
    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('nav.top-tabs .tab-btn').forEach(el => el.classList.remove('active'));
      const target = document.getElementById('tab-' + tabId);
      if (target) target.classList.add('active');
      event.target.classList.add('active');
    }

    function filterCards(selector, query) {
      const q = query.toLowerCase().trim();
      document.querySelectorAll(selector).forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(q) ? 'block' : 'none';
      });
    }

    function filterAdrStatus(status, btn) {
      document.querySelectorAll('#tab-adrs .filter-bar .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.adr-card').forEach(card => {
        const cardStatus = card.getAttribute('data-status') || '';
        if (status === 'all' || cardStatus === status) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }

    function filterAdrText(query) {
      const q = query.toLowerCase().trim();
      document.querySelectorAll('.adr-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(q) ? 'block' : 'none';
      });
    }
  </script>
</body>
</html>`;
}

function exportDocs(options = {}) {
  const outputDir = options.outputDir || path.join(REPO_ROOT, 'docs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const project = serveDashboard.parseProjectDocs ? serveDashboard.parseProjectDocs() : {};
  const codebase = serveDashboard.parseCodebaseDocs ? serveDashboard.parseCodebaseDocs() : {};
  const rules = serveDashboard.parseRulesDocs ? serveDashboard.parseRulesDocs() : {};
  const knowledge = serveDashboard.parseKnowledgeDocs ? serveDashboard.parseKnowledgeDocs() : {};
  const features = serveDashboard.getAllFeatures ? serveDashboard.getAllFeatures() : [];

  const html = generateStandaloneHtml({ project, codebase, rules, knowledge, features });
  const outputFile = path.join(outputDir, 'index.html');
  fs.writeFileSync(outputFile, html, 'utf8');

  return {
    outputDir,
    outputFile,
    bytes: Buffer.byteLength(html, 'utf8'),
    timestamp: new Date().toISOString()
  };
}

if (require.main === module) {
  const result = exportDocs();
  console.log(`\n🎉 [DOCS EXPORT] Documentação viva exportada com sucesso!`);
  console.log(`📁 Arquivo: ${result.outputFile} (${Math.round(result.bytes / 1024)} KB)\n`);
}

module.exports = {
  exportDocs,
  generateStandaloneHtml,
  renderSimpleMarkdown
};
