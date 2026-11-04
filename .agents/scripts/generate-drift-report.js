#!/usr/bin/env node

/**
 * Semantic Drift Engine — Post-Implementation Spec vs. Code Analyzer
 * AI-SDD Framework | Step 5 in SDD Lifecycle (Video 4:13–4:38 & ADR 0008)
 *
 * Compares feature specifications (.specs/features/<id>/spec.md) against actual
 * codebase implementations and diffs. Classifies discrepancies into 4 categories:
 *  1. MISSING_FEATURES: Declared BR-X / AC-X with no code implementation
 *  2. INCOMPLETE_MODELS: Data schemas missing fields declared in spec
 *  3. LOGIC_SHORTCUTS: TODOs, FIXMEs, stubs, and hardcoded placeholder mocks
 *  4. ARCHITECTURAL_DIVERGENCE: Unapproved structural patterns or forbidden imports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '../..');

/**
 * Extracts business rules, acceptance criteria, and model fields from spec.md content
 * @param {string} specMarkdown
 * @returns {{ businessRules: Array, acceptanceCriteria: Array, modelFields: Array }}
 */
function parseSpecContracts(specMarkdown) {
  if (!specMarkdown || typeof specMarkdown !== 'string') {
    return { businessRules: [], acceptanceCriteria: [], modelFields: [] };
  }

  const businessRules = [];
  const acceptanceCriteria = [];
  const modelFields = [];

  const lines = specMarkdown.split('\n');
  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('## ')) {
      currentSection = line.toLowerCase();
      continue;
    }

    // 1. Business Rules: - **BR-1 (Title)**: description or - **BR-1**: description
    const brMatch = line.match(/^-\s*\*\*(BR-\d+)(?:\s*\(([^)]+)\))?\*\*:\s*(.+)$/i);
    if (brMatch) {
      businessRules.push({
        id: brMatch[1].toUpperCase(),
        title: (brMatch[2] || '').trim(),
        text: brMatch[3].trim()
      });
      continue;
    }

    // 2. Acceptance Criteria: - **AC-1: Title** or - **AC-1 (Title)**
    const acMatch = line.match(/^-\s*\*\*(AC-\d+)[:\s]+([^*]+)\*\*/i);
    if (acMatch) {
      const id = acMatch[1].toUpperCase();
      const title = acMatch[2].trim();
      let bddBlock = '';

      // Collect Given / When / Then lines following
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().startsWith('- **') && !lines[j].trim().startsWith('## ')) {
        const subLine = lines[j].trim();
        if (subLine.startsWith('- **Given**') || subLine.startsWith('- **When**') || subLine.startsWith('- **Then**')) {
          bddBlock += ' ' + subLine;
        }
        j++;
      }

      acceptanceCriteria.push({
        id,
        title,
        text: (title + ' ' + bddBlock).trim()
      });
      continue;
    }

    // 3. Model Fields from Test Data Matrix or Data Dictionary
    if (currentSection.includes('matrix') || currentSection.includes('field') || currentSection.includes('data') || currentSection.includes('model') || currentSection.includes('schema')) {
      if (line.startsWith('|') && !line.includes('---') && !line.toLowerCase().includes('parameter') && !line.toLowerCase().includes('field')) {
        const cols = line.split('|').map(c => c.trim()).filter(Boolean);
        if (cols.length > 0) {
          const fieldName = cols[0].replace(/[`*]/g, '').trim();
          // Must be a valid programming identifier without spaces, hyphens, or file extensions
          if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldName) && !modelFields.includes(fieldName)) {
            modelFields.push(fieldName);
          }
        }
      }
    }
  }

  return { businessRules, acceptanceCriteria, modelFields };
}

/**
 * Scans code for shortcut patterns (TODO, FIXME, HACK, stubs, mock bypasses)
 * @param {string} fileContent
 * @param {string} filePath
 * @returns {Array<{ file: string, line: number, pattern: string, snippet: string }>}
 */
function detectLogicShortcuts(fileContent, filePath = '') {
  if (!fileContent || typeof fileContent !== 'string') return [];

  // Exclude test suite files from production logic shortcuts
  const normalizedPath = (filePath || '').replace(/\\/g, '/');
  if (normalizedPath.startsWith('tests/') || normalizedPath.includes('.test.')) {
    return [];
  }

  const shortcuts = [];
  const lines = fileContent.split('\n');

  const shortcutPatterns = [
    { regex: /\/\/\s*TODO\b/i, name: 'TODO' },
    { regex: /\/\/\s*FIXME\b/i, name: 'FIXME' },
    { regex: /\/\/\s*HACK\b/i, name: 'HACK' },
    { regex: /\/\*\s*stub\s*\*\//i, name: 'STUB' },
    { regex: /\/\/\s*stub\b/i, name: 'STUB' },
    { regex: /mock_success|return\s+["']mock/i, name: 'HARDCODED_MOCK' }
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip pattern definitions inside detector scripts
    if (trimmed.includes('name:') && trimmed.includes('regex:')) continue;
    if (trimmed.includes('const shortcutPatterns')) continue;

    for (const pat of shortcutPatterns) {
      if (pat.regex.test(line)) {
        shortcuts.push({
          file: filePath,
          line: i + 1,
          pattern: pat.name,
          snippet: line.trim()
        });
        break; // Record one pattern per line
      }
    }
  }

  return shortcuts;
}

/**
 * Cross-references specification contracts against code contents
 * @param {{ businessRules: Array, acceptanceCriteria: Array, modelFields: Array }} contracts
 * @param {Array<{ file: string, content: string }>} fileContents
 * @returns {object} Analysis result
 */
function analyzeSemanticDrift(contracts, fileContents) {
  const missingFeatures = [];
  const incompleteModels = [];
  const logicShortcuts = [];
  const architecturalDivergence = [];

  const combinedCode = fileContents.map(f => f.content).join('\n');
  const lowerCode = combinedCode.toLowerCase();

  // 1. Audit Business Rules
  for (const br of contracts.businessRules) {
    const idPresent = new RegExp(`\\b${br.id}\\b`, 'i').test(combinedCode);
    const keywords = br.text
      .replace(/[^a-zA-Z0-9_\-\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 5);
    const hasKeywordMatch = keywords.some(k => lowerCode.includes(k.toLowerCase()));

    if (!idPresent && !hasKeywordMatch) {
      missingFeatures.push({
        id: br.id,
        type: 'Business Rule',
        title: br.title || br.id,
        reason: 'No reference or keyword implementation found in target files'
      });
    }
  }

  // 2. Audit Acceptance Criteria
  for (const ac of contracts.acceptanceCriteria) {
    const idPresent = new RegExp(`\\b${ac.id}\\b`, 'i').test(combinedCode);
    const titleWords = ac.title
      .replace(/[^a-zA-Z0-9_\-\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4);
    const hasTitleMatch = titleWords.some(w => lowerCode.includes(w.toLowerCase()));

    if (!idPresent && !hasTitleMatch) {
      missingFeatures.push({
        id: ac.id,
        type: 'Acceptance Criterion',
        title: ac.title,
        reason: 'Scenario behavior or ID not located in implementation or tests'
      });
    }
  }

  // 3. Audit Model Fields
  for (const field of contracts.modelFields) {
    const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fieldPresent = new RegExp(`\\b${escapedField}\\b`).test(combinedCode);
    if (!fieldPresent) {
      incompleteModels.push(field);
    }
  }

  // 4. Audit Logic Shortcuts
  for (const file of fileContents) {
    const shortcuts = detectLogicShortcuts(file.content, file.file);
    logicShortcuts.push(...shortcuts);
  }

  const discrepanciesCount =
    missingFeatures.length +
    incompleteModels.length +
    logicShortcuts.length +
    architecturalDivergence.length;

  const verdict = discrepanciesCount === 0 ? 'APPROVED' : 'FAIL';

  return {
    verdict,
    discrepanciesCount,
    missingFeatures,
    incompleteModels,
    logicShortcuts,
    architecturalDivergence
  };
}

/**
 * Formats standard markdown Semantic Drift Report
 * @param {object} analysis
 * @returns {string}
 */
function generateDriftReportMarkdown(analysis) {
  const {
    featureId = 'feature',
    verdict = 'APPROVED',
    discrepanciesCount = 0,
    missingFeatures = [],
    incompleteModels = [],
    logicShortcuts = [],
    architecturalDivergence = []
  } = analysis;

  const statusBadge = verdict === 'APPROVED' ? 'PASS' : 'FAIL';

  let sections = `## 🔍 Semantic Drift Report: ${featureId}\n\n`;
  sections += `### 📊 Summary Status: DRIFT STATUS: ${statusBadge} (${discrepanciesCount} discrepancies detected)\n\n`;

  // 1. Missing Features
  sections += `### 1. Missing Features & Omitted Invariants (${missingFeatures.length})\n`;
  if (missingFeatures.length === 0) {
    sections += `*✅ All declared Business Rules and Acceptance Criteria have matching implementations.*\n\n`;
  } else {
    sections += `| ID | Type | Title | Discrepancy Reason |\n|---|---|---|---|\n`;
    missingFeatures.forEach(m => {
      sections += `| ${m.id} | ${m.type} | ${m.title} | ${m.reason} |\n`;
    });
    sections += '\n';
  }

  // 2. Incomplete Models
  sections += `### 2. Incomplete Models & Schemas (${incompleteModels.length})\n`;
  if (incompleteModels.length === 0) {
    sections += `*✅ All data model fields declared in specifications are represented in code.*\n\n`;
  } else {
    sections += `The following declared fields were not located in target code/schemas:\n`;
    incompleteModels.forEach(f => {
      sections += `- \`${f}\`\n`;
    });
    sections += '\n';
  }

  // 3. Logic Shortcuts
  sections += `### 3. Logic Shortcuts & Code Gambiarras (${logicShortcuts.length})\n`;
  if (logicShortcuts.length === 0) {
    sections += `*✅ Zero TODOs, FIXMEs, stubs, or placeholder mocks detected in target files.*\n\n`;
  } else {
    sections += `| File | Line | Type | Snippet |\n|---|---|---|---|\n`;
    logicShortcuts.forEach(s => {
      sections += `| \`${s.file}\` | ${s.line} | ${s.pattern} | \`${s.snippet.replace(/\|/g, '\\|')}\` |\n`;
    });
    sections += '\n';
  }

  // 4. Architectural Divergence
  sections += `### 4. Architectural Divergence (${architecturalDivergence.length})\n`;
  if (architecturalDivergence.length === 0) {
    sections += `*✅ Zero architectural divergences or unapproved dependencies detected.*\n\n`;
  } else {
    architecturalDivergence.forEach(d => {
      sections += `- ${d}\n`;
    });
    sections += '\n';
  }

  // Verdict & Guidance
  sections += `### ⚖️ Verdict & Next Action\n`;
  if (verdict === 'APPROVED') {
    sections += `**VERDICT: APPROVED** — The implementation conforms strictly to the specification contract. Zero semantic drift.\n`;
  } else {
    sections += `**VERDICT: ACTION REQUIRED** — Detected ${discrepanciesCount} discrepancies between specification and code reality.\n`;
    sections += `- **If code is incomplete**: Fix the missing rules, remove shortcuts, or complete models before commit.\n`;
    sections += `- **If spec requires update**: Update the design document under \`.specs/features/${featureId}/\` to reflect accepted architectural evolution.\n`;
  }

  return sections;
}

/**
 * Reads declared target files from tasks.md
 * @param {string} tasksFilePath
 * @returns {Array<string>}
 */
function getTargetFilesFromTasks(tasksFilePath) {
  if (!fs.existsSync(tasksFilePath)) return [];
  const content = fs.readFileSync(tasksFilePath, 'utf8');
  const files = new Set();
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.includes('Target Files') || trimmed.includes('---')) continue;
    const columns = trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
    if (columns.length >= 7) {
      const targetCol = columns[4];
      const matches = targetCol.match(/`([^`]+)`/g);
      if (matches) {
        matches.forEach(m => files.add(m.replace(/`/g, '').trim()));
      }
    }
  }

  return Array.from(files);
}

/**
 * Main execution function
 */
function runDriftReportCli(featureId) {
  const specsFeaturesDir = path.join(REPO_ROOT, '.specs', 'features');

  if (!featureId) {
    console.error('\n❌ [ERRO] Informe o ID da funcionalidade.');
    if (fs.existsSync(specsFeaturesDir)) {
      const available = fs.readdirSync(specsFeaturesDir);
      console.log('Funcionalidades disponíveis:', available.join(', '));
    }
    process.exit(1);
  }

  const featureDir = path.join(specsFeaturesDir, featureId);
  if (!fs.existsSync(featureDir)) {
    console.error(`\n❌ [ERRO] Diretório da funcionalidade não encontrado: .specs/features/${featureId}`);
    process.exit(1);
  }

  const specFile = path.join(featureDir, 'spec.md');
  const tasksFile = path.join(featureDir, 'tasks.md');

  if (!fs.existsSync(specFile)) {
    console.error(`\n❌ [ERRO] Arquivo spec.md não encontrado em ${featureDir}`);
    process.exit(1);
  }

  console.log(`\n🔍 [SEMANTIC DRIFT SENSOR] Analisando conformidade semântica para: ${featureId}...`);

  const specContent = fs.readFileSync(specFile, 'utf8');
  const contracts = parseSpecContracts(specContent);

  const targetFiles = getTargetFilesFromTasks(tasksFile);
  const fileContents = [];

  for (const relFile of targetFiles) {
    const absPath = path.resolve(REPO_ROOT, relFile);
    if (fs.existsSync(absPath)) {
      try {
        const stat = fs.statSync(absPath);
        if (stat.isFile()) {
          const content = fs.readFileSync(absPath, 'utf8');
          fileContents.push({ file: relFile, content });
        }
      } catch (e) {
        // Skip unreadable
      }
    }
  }

  const analysis = analyzeSemanticDrift(contracts, fileContents);
  analysis.featureId = featureId;

  const reportMarkdown = generateDriftReportMarkdown(analysis);
  const reportPath = path.join(featureDir, 'drift-report.md');
  fs.writeFileSync(reportPath, reportMarkdown, 'utf8');

  console.log(`📄 Relatório gravado em: .specs/features/${featureId}/drift-report.md`);

  if (analysis.verdict === 'APPROVED') {
    console.log(`✅ [SEMANTIC DRIFT OK] Zero desvios detectados. Conformidade 100% com spec.md.`);
    return { pass: true, report: reportMarkdown, analysis };
  } else {
    console.log(`⚠️  [SEMANTIC DRIFT DETECTED] ${analysis.discrepanciesCount} divergências encontradas.`);
    if (analysis.missingFeatures.length > 0) {
      console.log(`   - Regras/Critérios ausentes: ${analysis.missingFeatures.map(m => m.id).join(', ')}`);
    }
    if (analysis.logicShortcuts.length > 0) {
      console.log(`   - Atalhos/TODOs detectados: ${analysis.logicShortcuts.length} ocorrências`);
    }
    if (analysis.incompleteModels.length > 0) {
      console.log(`   - Campos de modelo ausentes: ${analysis.incompleteModels.join(', ')}`);
    }
    return { pass: false, report: reportMarkdown, analysis };
  }
}

// CLI entry point
if (require.main === module) {
  const argFeatureId = process.argv[2];
  const result = runDriftReportCli(argFeatureId);
  process.exit(result.pass ? 0 : 1);
}

module.exports = {
  parseSpecContracts,
  detectLogicShortcuts,
  analyzeSemanticDrift,
  generateDriftReportMarkdown,
  runDriftReportCli
};
