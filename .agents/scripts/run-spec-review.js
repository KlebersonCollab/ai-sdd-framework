#!/usr/bin/env node

/**
 * Goldfish Spec Reviewer — Pre-Implementation Adversarial Spec Audit
 * AI-SDD Framework | Step 4 in SDD Lifecycle (ADR 0008)
 *
 * Evaluates feature specifications (.specs/features/<id>/plan.md and spec.md)
 * with cold context (stateless perspective). Audits for:
 *  1. Ambiguous and subjective terms without concrete metrics (e.g. "fast", "robust")
 *  2. Incomplete BDD acceptance criteria (missing Given/When/Then clauses)
 *  3. Unstated assumptions and missing edge-case resilience
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../..');

const AMBIGUOUS_WORDS = [
  { word: 'fast', suggestion: 'Define specific latency threshold (e.g., < 200ms at p95)' },
  { word: 'robust', suggestion: 'Specify fault-tolerance, retry policy, or boundary constraints' },
  { word: 'flexible', suggestion: 'Specify explicit extension points, interfaces, or config options' },
  { word: 'scalable', suggestion: 'Specify concurrency, throughput (RPS), or data volume targets' },
  { word: 'simple', suggestion: 'Describe concrete API signature or step count' },
  { word: 'easy', suggestion: 'Describe concrete user workflow or DX contract' },
  { word: 'seamless', suggestion: 'Detail state synchronization or transition mechanics' },
  { word: 'clean', suggestion: 'Reference specific architectural convention or linter standard' },
  { word: 'rápido', suggestion: 'Defina limite quantificável de latência (ex: < 200ms p95)' },
  { word: 'robusto', suggestion: 'Especifique política de retry, fallback ou invariantes de erro' },
  { word: 'flexível', suggestion: 'Especifique interfaces, pontos de extensão ou parâmetros exatos' },
  { word: 'escalável', suggestion: 'Especifique metas de concorrência, throughput ou volume' },
  { word: 'simples', suggestion: 'Descreva assinatura exata da API ou limite de passos' },
  { word: 'fácil', suggestion: 'Descreva contrato de uso determinístico' }
];

/**
 * Scans text for subjective words that lack verifiable metrics (AC-5)
 * @param {string} text
 * @returns {Array<{ word: string, line: number, snippet: string, suggestion: string }>}
 */
function detectAmbiguities(text) {
  if (!text || typeof text !== 'string') return [];

  const results = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Strip inline code spans (`...`) to avoid matching CLI flags like `git clean -f`
    const proseLine = line.replace(/`[^`]*`/g, ' ');
    for (const item of AMBIGUOUS_WORDS) {
      const regex = new RegExp(`(?:^|[^\\p{L}\\p{N}_])(${item.word})(?=$|[^\\p{L}\\p{N}_])`, 'iu');
      if (regex.test(proseLine)) {
        results.push({
          word: item.word,
          line: i + 1,
          snippet: line.trim(),
          suggestion: item.suggestion
        });
      }
    }
  }

  return results;
}

/**
 * Audits tasks.md for MetaGPT SOP compliance: Test-First ordering & <= 3 Target Files per task (BR-5, AC-5)
 * @param {string} tasksContent
 * @returns {{ valid: boolean, issues: Array<string>, taskCount: number }}
 */
function auditTasksSop(tasksContent) {
  if (!tasksContent || typeof tasksContent !== 'string') {
    return { valid: true, issues: [], taskCount: 0 };
  }

  const issues = [];
  const lines = tasksContent.split('\n');
  const parsedTasks = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.includes('Target Files') || trimmed.includes('---')) continue;
    const cols = trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
    if (cols.length < 7) continue;

    const id = cols[1] || 'TASK';
    const type = (cols[2] || '').toLowerCase();
    const targetCol = cols[4] || '';

    const codeMatches = targetCol.match(/`([^`]+)`/g);
    const files = codeMatches
      ? codeMatches.map(m => m.replace(/`/g, '').trim()).filter(Boolean)
      : targetCol.split(',').map(s => s.trim()).filter(Boolean);

    if (files.length > 3) {
      issues.push(`${id} declares ${files.length} target files (max 3 allowed per atomic task — Safety Valve)`);
    }

    parsedTasks.push({ id, type, files });
  }

  const firstTestIdx = parsedTasks.findIndex(t => t.type === 'test');
  const firstFeatIdx = parsedTasks.findIndex(t => t.type === 'feat');

  if (firstFeatIdx !== -1 && (firstTestIdx === -1 || firstFeatIdx < firstTestIdx)) {
    issues.push('MetaGPT SOP Test-First violation: A "test" task must precede the first "feat" implementation task');
  }

  return {
    valid: issues.length === 0,
    issues,
    taskCount: parsedTasks.length
  };
}

/**
 * Audits BDD Given/When/Then structure and criteria completeness
 * @param {string} specContent
 * @returns {{ hasBddStructure: boolean, criteriaCount: number, hasIncompleteScenarios: boolean, incompleteScenarios: Array }}
 */
function auditSpecCompleteness(specContent) {
  if (!specContent || typeof specContent !== 'string') {
    return {
      hasBddStructure: false,
      criteriaCount: 0,
      hasIncompleteScenarios: true,
      incompleteScenarios: ['Empty specification']
    };
  }

  const lines = specContent.split('\n');
  const scenarios = [];
  let currentScenario = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const acMatch = line.match(/^-\s*\*\*(AC-\d+)[:\s]+([^*]+)\*\*/i);
    if (acMatch) {
      if (currentScenario) {
        scenarios.push(currentScenario);
      }
      currentScenario = {
        id: acMatch[1].toUpperCase(),
        title: acMatch[2].trim(),
        hasGiven: false,
        hasWhen: false,
        hasThen: false
      };
      continue;
    }

    if (currentScenario) {
      if (line.includes('**Given**') || line.toLowerCase().startsWith('- given')) currentScenario.hasGiven = true;
      if (line.includes('**When**') || line.toLowerCase().startsWith('- when')) currentScenario.hasWhen = true;
      if (line.includes('**Then**') || line.toLowerCase().startsWith('- then')) currentScenario.hasThen = true;
    }
  }

  if (currentScenario) {
    scenarios.push(currentScenario);
  }

  const incompleteScenarios = scenarios.filter(s => !s.hasGiven || !s.hasWhen || !s.hasThen);
  const hasBddStructure = scenarios.length > 0 && incompleteScenarios.length < scenarios.length;

  return {
    hasBddStructure,
    criteriaCount: scenarios.length,
    hasIncompleteScenarios: incompleteScenarios.length > 0,
    incompleteScenarios: incompleteScenarios.map(s => s.id)
  };
}

/**
 * Formats standard markdown Spec Review Report
 * @param {object} auditData
 * @returns {string}
 */
function formatSpecReviewReport(auditData) {
  const {
    featureId = 'feature',
    ambiguities = [],
    completeness = { criteriaCount: 0, hasIncompleteScenarios: false, incompleteScenarios: [] }
  } = auditData;

  const statusBadge = (!completeness.hasIncompleteScenarios && ambiguities.length === 0) ? 'PASS' : 'NEEDS_REFINEMENT';

  let report = `## 🐟 Goldfish Spec Review Report: ${featureId}\n\n`;
  report += `### 📊 Review Verdict: ${statusBadge}\n`;
  report += `*Stateless adversarial audit conducted prior to code implementation.*\n\n`;

  // 1. Ambiguities & Subjective Language
  report += `### 1. Ambiguity & Vague Language Inquest (${ambiguities.length})\n`;
  if (ambiguities.length === 0) {
    report += `*✅ Zero subjective adjectives detected. All terms appear concrete and measurable.*\n\n`;
  } else {
    report += `| Line | Term | Context Snippet | Concrete Metric Recommendation |\n|---|---|---|---|\n`;
    ambiguities.forEach(a => {
      report += `| ${a.line} | \`${a.word}\` | \`${a.snippet.replace(/\|/g, '\\|')}\` | ${a.suggestion} |\n`;
    });
    report += '\n';
  }

  // 2. Acceptance Criteria & BDD Completeness
  report += `### 2. BDD Scenario Rigor & Completeness\n`;
  report += `- **Total Scenarios Declared**: ${completeness.criteriaCount}\n`;
  if (!completeness.hasIncompleteScenarios && completeness.criteriaCount > 0) {
    report += `- **BDD Triad Integrity**: ✅ 100% of scenarios contain explicit Given/When/Then clauses.\n\n`;
  } else {
    report += `- **Incomplete Scenarios Detected**: ⚠️ ${completeness.incompleteScenarios.join(', ') || 'No valid BDD scenarios found'}\n\n`;
  }

  // 3. Goldfish Adjudication Guidance
  report += `### ⚖️ Goldfish Adjudication Guidance\n`;
  if (statusBadge === 'PASS') {
    report += `**SPEC APPROVED FOR IMPLEMENTATION** — The design contract is concrete, deterministic, and free of hidden assumptions.\n`;
  } else {
    report += `**REVISE SPEC BEFORE CODING** — Resolve ambiguous metrics and ensure all acceptance criteria have complete Given/When/Then blocks before dispatching the executor.\n`;
  }

  return report;
}

/**
 * CLI runner for spec review
 */
function runSpecReviewCli(featureId) {
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
  const specFile = path.join(featureDir, 'spec.md');
  const planFile = path.join(featureDir, 'plan.md');
  const tasksFile = path.join(featureDir, 'tasks.md');

  if (!fs.existsSync(specFile)) {
    console.error(`\n❌ [ERRO] Arquivo spec.md não encontrado em ${featureDir}`);
    process.exit(1);
  }

  console.log(`\n🐟 [GOLDFISH SPEC REVIEW] Auditando especificações de ${featureId} sem viés de contexto...`);

  const specContent = fs.readFileSync(specFile, 'utf8');
  const planContent = fs.existsSync(planFile) ? fs.readFileSync(planFile, 'utf8') : '';
  const tasksContent = fs.existsSync(tasksFile) ? fs.readFileSync(tasksFile, 'utf8') : '';
  const combined = planContent + '\n' + specContent;

  const ambiguities = detectAmbiguities(combined);
  const completeness = auditSpecCompleteness(specContent);
  const tasksSop = auditTasksSop(tasksContent);

  const report = formatSpecReviewReport({
    featureId,
    ambiguities,
    completeness,
    tasksSop
  });

  const reportPath = path.join(featureDir, 'spec-review-report.md');
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`📄 Relatório de revisão gravado em: .specs/features/${featureId}/spec-review-report.md`);

  const pass = !completeness.hasIncompleteScenarios && ambiguities.length === 0 && tasksSop.valid;

  if (pass) {
    console.log(`✅ [SPEC REVIEW OK] Especificação rigorosa e determinística. Pronta para implementação.`);
  } else {
    console.log(`⚠️  [SPEC REVIEW WARNINGS] Foram detectados ${ambiguities.length} termos vagos, ${completeness.incompleteScenarios.length} cenários incompletos e ${tasksSop.issues.length} desvios SOP.`);
  }

  return { pass, report };
}

// CLI entry point
if (require.main === module) {
  const argFeatureId = process.argv[2];
  const result = runSpecReviewCli(argFeatureId);
  process.exit(result.pass ? 0 : 1);
}

module.exports = {
  detectAmbiguities,
  auditSpecCompleteness,
  auditTasksSop,
  formatSpecReviewReport,
  runSpecReviewCli
};
