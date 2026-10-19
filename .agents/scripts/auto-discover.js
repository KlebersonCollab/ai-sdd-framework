#!/usr/bin/env node

/**
 * Auto-Discovery Protocol Engine
 * AI-SDD Framework | Deterministic brownfield reality discovery & specs generation
 * Zero-dependency native Node.js CommonJS engine.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../..');

/**
 * Detects project stack and ecosystem metadata
 * @param {string} rootDir
 * @returns {object}
 */
function discoverProject(rootDir = REPO_ROOT) {
  const result = {
    projectType: 'Unknown',
    languages: [],
    packageManager: 'Unknown',
    frameworks: [],
    linters: [],
    testRunners: [],
    dependencies: {},
    devDependencies: {},
    scripts: {},
    topDirs: [],
    entryPoints: [],
    markdown: {}
  };

  // 1. Detect Top-level Directory Structure
  try {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    result.topDirs = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'target')
      .map(e => e.name);
  } catch (err) {
    // ignore
  }

  // 2. Node.js Ecosystem Detection
  const pkgPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    result.projectType = 'Node.js';
    result.languages.push('JavaScript');
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      result.name = pkg.name || path.basename(rootDir);
      result.version = pkg.version || '1.0.0';
      result.description = pkg.description || '';
      result.dependencies = pkg.dependencies || {};
      result.devDependencies = pkg.devDependencies || {};
      result.scripts = pkg.scripts || {};

      // Detect TypeScript
      if (result.devDependencies['typescript'] || result.dependencies['typescript'] || fs.existsSync(path.join(rootDir, 'tsconfig.json'))) {
        result.languages.push('TypeScript');
      }

      // Detect Frameworks
      const allDeps = { ...result.dependencies, ...result.devDependencies };
      if (allDeps['vue']) result.frameworks.push('Vue.js');
      if (allDeps['react']) result.frameworks.push('React');
      if (allDeps['next']) result.frameworks.push('Next.js');
      if (allDeps['express']) result.frameworks.push('Express');
      if (allDeps['fastify']) result.frameworks.push('Fastify');
      if (allDeps['tailwindcss']) result.frameworks.push('Tailwind CSS');
      if (allDeps['vite']) result.frameworks.push('Vite');

      // Detect Test Runners
      if (allDeps['vitest']) result.testRunners.push('Vitest');
      else if (allDeps['jest']) result.testRunners.push('Jest');
      else if (allDeps['mocha']) result.testRunners.push('Mocha');
      else if (result.scripts['test'] && result.scripts['test'].includes('node:test')) result.testRunners.push('Node.js Native Test Runner (node:test)');

      // Detect Linters
      if (allDeps['eslint']) result.linters.push('ESLint');
      if (allDeps['prettier']) result.linters.push('Prettier');
      if (allDeps['biome']) result.linters.push('Biome');
    } catch (err) {
      // ignore parse error
    }

    // Detect Package Manager
    if (fs.existsSync(path.join(rootDir, 'pnpm-lock.yaml'))) result.packageManager = 'pnpm';
    else if (fs.existsSync(path.join(rootDir, 'yarn.lock'))) result.packageManager = 'yarn';
    else if (fs.existsSync(path.join(rootDir, 'bun.lockb'))) result.packageManager = 'bun';
    else if (fs.existsSync(path.join(rootDir, 'package-lock.json'))) result.packageManager = 'npm';
    else result.packageManager = 'npm';
  }

  // 3. Python Ecosystem Detection
  if (fs.existsSync(path.join(rootDir, 'pyproject.toml')) || fs.existsSync(path.join(rootDir, 'requirements.txt'))) {
    if (result.projectType === 'Unknown') result.projectType = 'Python';
    result.languages.push('Python');
    if (fs.existsSync(path.join(rootDir, 'poetry.lock'))) result.packageManager = 'Poetry';
    else if (fs.existsSync(path.join(rootDir, 'Pipfile'))) result.packageManager = 'Pipenv';
    else result.packageManager = 'pip / uv';
  }

  // 4. Rust Ecosystem Detection
  if (fs.existsSync(path.join(rootDir, 'Cargo.toml'))) {
    if (result.projectType === 'Unknown') result.projectType = 'Rust';
    result.languages.push('Rust');
    result.packageManager = 'cargo';
    result.testRunners.push('cargo test');
    result.linters.push('clippy');
  }

  // 5. Go Ecosystem Detection
  if (fs.existsSync(path.join(rootDir, 'go.mod'))) {
    if (result.projectType === 'Unknown') result.projectType = 'Go';
    result.languages.push('Go');
    result.packageManager = 'go modules';
    result.testRunners.push('go test');
    result.linters.push('golangci-lint');
  }

  // 6. Generate Markdown Projections
  result.markdown.stack = generateStackMarkdown(result);
  result.markdown.architecture = generateArchitectureMarkdown(result);
  result.markdown.conventions = generateConventionsMarkdown(result);
  result.markdown.concerns = generateConcernsMarkdown(result);
  result.markdown.technicalMap = generateTechnicalMapMarkdown(result);
  result.markdown.context = generateContextMarkdown(result);

  return result;
}

function generateStackMarkdown(info) {
  const depLines = Object.entries(info.dependencies).length > 0
    ? Object.entries(info.dependencies).map(([k, v]) => `- \`${k}\`: \`${v}\``).join('\n')
    : '- Zero external production dependencies (Native standard library)';

  const devDepLines = Object.entries(info.devDependencies).length > 0
    ? Object.entries(info.devDependencies).map(([k, v]) => `- \`${k}\`: \`${v}\``).join('\n')
    : '- Standard tooling and git version control';

  return `# Technology Stack

## Core Language & Runtime
- **Primary Language**: ${info.languages.join(' / ') || 'Unknown'}
- **Project Type**: ${info.projectType}
- **Package Manager**: ${info.packageManager}
- **Frameworks & Libraries**: ${info.frameworks.join(', ') || 'Standard Library'}

## Dependencies
### Production
${depLines}

### Development & Tooling
${devDepLines}

## Testing & Sensor Infrastructure
- **Test Runners**: ${info.testRunners.join(', ') || 'N/A'}
- **Linters & Static Analysis**: ${info.linters.join(', ') || 'N/A'}
- **SDD Integrity Sensor**: \`node .agents/scripts/verify-sdd-integrity.js\`
- **Spec Drift Sensor**: \`node .agents/scripts/check-spec-drift.js\`
`;
}

function generateArchitectureMarkdown(info) {
  const dirLines = info.topDirs.map(d => `- \`${d}/\`: Module directory`).join('\n');

  return `# System Architecture

## Directory Organization
- \`.agents/\`: Agent governance runtime, memory graph, system rules, sensor scripts, and skill definitions.
- \`.specs/\`: Living specifications partitioned across codebase reality, project vision, active features, and knowledge base.
${dirLines}

## Architectural Patterns
- **Spec Driven Development (SDD)**: Strict 5-stage lifecycle (Memory -> Explorer -> Planner -> Executor -> Reviewer).
- **File-First Single Source of Truth**: All operational state and memory reside in git-tracked Markdown and JSONL.
- **Sensor-Gated Verification**: Commits and approvals strictly gated by empirical sensor execution.

## Boundary Rules
- Zero external database or cloud service dependencies for core governance runtime.
- Test immutability: tests cannot be weakened or commented out to force a pass.
- Spec drift invariance: all code changes must be mapped to active feature tasks.
`;
}

function generateConventionsMarkdown(info) {
  return `# Code Conventions & Idioms

## Naming Standards
- Governance Scripts: \`kebab-case.js\`
- Architecture & Project Artifacts: \`UPPERCASE.md\` (e.g. \`STACK.md\`, \`CONTEXT.md\`)
- Feature Specifications: \`plan.md\`, \`spec.md\`, \`tasks.md\` in kebab-case feature folders
- Task Identifiers: \`TASK-01\`, \`TASK-02\`, ...
- Requirements & ACs: \`FR-XX\`, \`BR-XX\`, \`AC-XX\`

## Task Schema Contract (MetaGPT SOP)
- Strict 7-column table: Status | ID | Type | Description | Target Files | Dependencies | Evidence

## Quality Invariants
- Zero shortcuts, stubs, or placeholder implementations.
- Surgical contiguous block edits over whole-file rewrites.
`;
}

function generateConcernsMarkdown(info) {
  return `# Critical Risks & Technical Debt

## High-Risk Areas
- Cross-platform path normalization (Windows backslashes vs POSIX slashes in sensor scripts).
- Ensuring 100% test immutability during rapid implementation passes.

## Fragile Integrations
- Git hook execution across different git client harnesses and worktrees.

## Technical Debt Items
- Ensure test coverage across all edge scenarios.
`;
}

function generateTechnicalMapMarkdown(info) {
  return `# Consolidated Technical Map

## Executive Summary
This project operates under the AI-SDD Framework, enforcing determinism, persistent memory, and sensor-gated development.

- **Stack**: ${info.projectType} (${info.languages.join(', ') || 'N/A'}) with ${info.packageManager}.
- **Architecture**: 5-layer SDD lifecycle (.agents/ + .specs/).
- **Conventions**: MetaGPT 7-column SOP, BDD Given/When/Then acceptance criteria.
- **Testing & Sensors**: SDD integrity sensor, pre-commit spec drift sensor, and automated test suite.
`;
}

function generateContextMarkdown(info) {
  return `# Project Context & Domain Glossary

## Domain Terms
- **SDD (Spec Driven Development)**: Software development lifecycle where executable and audited specifications precede code implementation.
- **Feature Cascade**: The top-down hierarchy: Feature (Epic/Capability) -> Plan / User Stories (Intent) -> Spec / Acceptance Criteria (BDD) -> Tasks (Atomic execution).
- **Spec Drift**: Divergence between actual repository code modifications and declared feature tasks.
- **Sensor Gate**: Automated command-line checks (linter, unit tests, build, drift detection) that must pass before task completion or commit approval.
- **Memory Graph**: JSONL-based persistent associative memory tracking entities, relations, and observations across sessions.
- **Canonical Governance**: Unified standards defined via \`AGENTS.md\`, \`DESIGN.md\`, and \`.agents/\`, serving as the framework's single source of truth across all tools.
`;
}

/**
 * Writes discovered codebase specifications to .specs/codebase/
 * @param {string} rootDir
 * @param {object} options
 */
function writeDiscoveredSpecs(rootDir = REPO_ROOT, options = {}) {
  const discovery = discoverProject(rootDir);
  const codebaseDir = path.join(rootDir, '.specs', 'codebase');
  const projectDir = path.join(rootDir, '.specs', 'project');

  if (!fs.existsSync(codebaseDir)) fs.mkdirSync(codebaseDir, { recursive: true });
  if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });

  const filesToWrite = [
    { dir: codebaseDir, file: 'STACK.md', content: discovery.markdown.stack },
    { dir: codebaseDir, file: 'ARCHITECTURE.md', content: discovery.markdown.architecture },
    { dir: codebaseDir, file: 'CONVENTIONS.md', content: discovery.markdown.conventions },
    { dir: codebaseDir, file: 'CONCERNS.md', content: discovery.markdown.concerns },
    { dir: codebaseDir, file: 'TECHNICAL-MAP.md', content: discovery.markdown.technicalMap }
  ];

  const written = [];
  for (const item of filesToWrite) {
    const filePath = path.join(item.dir, item.file);
    if (!fs.existsSync(filePath) || options.overwrite) {
      fs.writeFileSync(filePath, item.content, 'utf8');
      written.push(filePath);
    }
  }

  // Populate CONTEXT.md if missing
  const contextPath = path.join(projectDir, 'CONTEXT.md');
  if (!fs.existsSync(contextPath) || options.overwrite) {
    fs.writeFileSync(contextPath, discovery.markdown.context, 'utf8');
    written.push(contextPath);
  }

  return { discovery, written };
}

function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const isOverwrite = process.argv.includes('--overwrite');

  console.log('\n🔍 [AUTO-DISCOVERY PROTOCOL] Escaneando ecossistema e topologia do projeto...');
  const discovery = discoverProject(REPO_ROOT);

  console.log(`✅ Projeto Detectado: ${discovery.projectType} (${discovery.languages.join(', ')})`);
  console.log(`📦 Gerenciador de Pacotes: ${discovery.packageManager}`);
  if (discovery.frameworks.length > 0) {
    console.log(`⚡ Frameworks: ${discovery.frameworks.join(', ')}`);
  }
  if (discovery.testRunners.length > 0) {
    console.log(`🧪 Test Runners: ${discovery.testRunners.join(', ')}`);
  }

  if (isDryRun) {
    console.log('\nℹ️ [DRY RUN] Nenhuma alteração gravada em disco.\n');
  } else {
    const result = writeDiscoveredSpecs(REPO_ROOT, { overwrite: isOverwrite });
    console.log(`\n🎉 [AUTO-DISCOVERY CONCLUÍDO] ${result.written.length} artefatos verificados/criados em .specs/.\n`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  discoverProject,
  writeDiscoveredSpecs,
  generateStackMarkdown,
  generateArchitectureMarkdown,
  generateConventionsMarkdown,
  generateConcernsMarkdown,
  generateTechnicalMapMarkdown,
  generateContextMarkdown
};
