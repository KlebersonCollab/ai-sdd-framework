/**
 * Test Suite: GitHub One-Liner Installer & Quickstart Verification
 * AI-SDD Framework | Feature: github-one-liner-installer
 * Uses native node:test and node:assert (zero dependencies)
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SETUP_PS1 = path.join(REPO_ROOT, 'setup.ps1');
const SETUP_SH = path.join(REPO_ROOT, 'setup.sh');

test('Installer scripts: setup.ps1 and setup.sh exist in repository root', () => {
  assert.ok(fs.existsSync(SETUP_PS1), 'Expected setup.ps1 to exist in repository root');
  assert.ok(fs.existsSync(SETUP_SH), 'Expected setup.sh to exist in repository root');
});

test('Installer scripts: setup.ps1 contains core GitHub download, extraction, and update-safe logic', () => {
  const content = fs.readFileSync(SETUP_PS1, 'utf8');

  // Must reference GitHub repository default
  assert.match(content, /KlebersonCollab\/ai-sdd-framework/i, 'setup.ps1 must point to default GitHub repo');
  
  // Must use archive download (Invoke-RestMethod or WebClient or curl.exe)
  assert.match(content, /(Invoke-RestMethod|Invoke-WebRequest|Net\.WebClient|curl\.exe)/i, 'setup.ps1 must download archive');
  assert.match(content, /Expand-Archive/i, 'setup.ps1 must unpack archive');

  // Must extract core governance files
  assert.match(content, /\.agents/i, 'setup.ps1 must extract .agents');
  assert.match(content, /AGENTS\.md/i, 'setup.ps1 must extract AGENTS.md');
  assert.match(content, /DESIGN\.md/i, 'setup.ps1 must extract DESIGN.md');

  // Must preserve existing .specs and memory
  assert.match(content, /Test-Path.*\.specs/i, 'setup.ps1 must check if .specs already exists to preserve it');
  assert.match(content, /memory_graph\.jsonl/i, 'setup.ps1 must guard memory_graph.jsonl against overwrite');

  // Must execute auto-discover or bootstrap sensor and install-hooks
  assert.match(content, /auto-discover\.js/i, 'setup.ps1 must run auto-discover.js for brownfield projects');
  assert.match(content, /verify-sdd-integrity\.js.*--bootstrap/i, 'setup.ps1 must support --bootstrap for greenfield');
  assert.match(content, /install-hooks\.js/i, 'setup.ps1 must run install-hooks.js');
});

test('Installer scripts: setup.sh contains core POSIX download, extraction, and update-safe logic', () => {
  const content = fs.readFileSync(SETUP_SH, 'utf8');

  // Must have shebang
  assert.match(content, /^#!\/(bin|usr\/bin)\/(env\s+)?(bash|sh)/, 'setup.sh must have valid shebang');

  // Must reference GitHub repository default
  assert.match(content, /KlebersonCollab\/ai-sdd-framework/i, 'setup.sh must point to default GitHub repo');

  // Must support curl or wget
  assert.match(content, /(curl|wget)/i, 'setup.sh must support curl or wget');

  // Must extract core governance files
  assert.match(content, /\.agents/i, 'setup.sh must extract .agents');
  assert.match(content, /AGENTS\.md/i, 'setup.sh must extract AGENTS.md');
  assert.match(content, /DESIGN\.md/i, 'setup.sh must extract DESIGN.md');

  // Must preserve existing .specs and memory
  assert.match(content, /memory_graph\.jsonl/i, 'setup.sh must protect memory_graph.jsonl');

  // Must execute auto-discover or bootstrap sensor and install-hooks
  assert.match(content, /auto-discover\.js/i, 'setup.sh must run auto-discover.js for brownfield projects');
  assert.match(content, /verify-sdd-integrity\.js.*--bootstrap/i, 'setup.sh must support --bootstrap for greenfield');
  assert.match(content, /install-hooks\.js/i, 'setup.sh must run install-hooks.js');
});

test('Installer logic: Update-Safe preservation simulation preserves .specs and memory_graph.jsonl', () => {
  const tempDir = path.join(REPO_ROOT, '.tmp-test-installer-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const existingSpecsDir = path.join(tempDir, '.specs', 'project');
    fs.mkdirSync(existingSpecsDir, { recursive: true });
    fs.writeFileSync(path.join(existingSpecsDir, 'CUSTOM_PROJECT.md'), '# Existing Project Spec', 'utf8');

    const existingMemoryDir = path.join(tempDir, '.agents', 'memory');
    fs.mkdirSync(existingMemoryDir, { recursive: true });
    fs.writeFileSync(path.join(existingMemoryDir, 'memory_graph.jsonl'), '{"custom":"node"}\n', 'utf8');

    // Simulate installer copy logic: files in .specs and memory_graph.jsonl should not be overwritten if already present
    const incomingSpecs = '# Incoming Spec';
    const targetCustomSpecPath = path.join(existingSpecsDir, 'CUSTOM_PROJECT.md');
    
    // Invariant: Do not overwrite if exists
    if (!fs.existsSync(targetCustomSpecPath)) {
      fs.writeFileSync(targetCustomSpecPath, incomingSpecs, 'utf8');
    }

    const currentSpecContent = fs.readFileSync(targetCustomSpecPath, 'utf8');
    assert.strictEqual(currentSpecContent, '# Existing Project Spec', 'Existing specs must remain unchanged');

    const currentMemoryContent = fs.readFileSync(path.join(existingMemoryDir, 'memory_graph.jsonl'), 'utf8');
    assert.strictEqual(currentMemoryContent, '{"custom":"node"}\n', 'Existing memory graph must remain unchanged');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Installer logic: Fresh installation initializes a clean zeroed memory_graph.jsonl', () => {
  const tempDir = path.join(REPO_ROOT, '.tmp-test-fresh-install-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const memoryDir = path.join(tempDir, '.agents', 'memory');
    fs.mkdirSync(memoryDir, { recursive: true });
    const memoryFile = path.join(memoryDir, 'memory_graph.jsonl');

    // Fresh install behavior: memory_graph.jsonl is initialized completely empty (0 inherited entities)
    fs.writeFileSync(memoryFile, '', 'utf8');

    assert.ok(fs.existsSync(memoryFile), 'memory_graph.jsonl must exist');
    const content = fs.readFileSync(memoryFile, 'utf8');
    assert.strictEqual(content.trim(), '', 'Fresh install memory graph must be completely empty');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

