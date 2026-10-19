#!/usr/bin/env node

/**
 * Feature Specification Scaffolder
 * AI-SDD Framework | Scaffolds canonical plan.md, spec.md, and tasks.md
 * Adheres strictly to MetaGPT 7-column SOP and BDD contract templates.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../..');

function generatePlanMarkdown(featureId, title) {
  return `# Plan: ${title}

## 1. Problem Statement & Motivation
[Describe the core problem, user friction, or architectural motivation for ${title}.]

## 2. Scope & Boundaries
- **In Scope**:
  - Core implementation of ${title}
  - Automated tests and verification sensors
- **Out of Scope**:
  - Unrelated refactorings or external system overhauls

## 3. High-Level Approach
[Outline the strategic architectural approach, modular boundaries, and algorithms without low-level implementation details.]

## 4. Dependencies & Prerequisites
- None or list required antecedent features/migrations.

## 5. Architectural Decision Records (ADRs)
- Link to relevant ADRs in \`.specs/project/ADRs/\` if this feature makes non-obvious or structural choices.
`;
}

function generateSpecMarkdown(featureId, title) {
  return `# Specification: ${title}

## 1. User Stories
- **US-1**: As a [role], I want [action], so that [business value or benefit].

## 2. Business Rules & Invariants
- **BR-1**: [Core rule statement, execution constraint, or domain boundary]
- **BR-2**: [Validation constraint, required schema format, or prohibited state]

## 3. Acceptance Criteria (BDD)

### Happy Path (Success Scenarios)
- **AC-1: [Primary Success Scenario]**
  - **Given** [initial state or preconditions]
  - **When** [trigger event occurs]
  - **Then** [expected verifiable outcome]

### Input & Validation Scenarios
- **AC-2: [Invalid Input Scenario]**
  - **Given** [invalid input payload or out-of-bounds parameter]
  - **When** [processing requested]
  - **Then** [system rejects with descriptive error code and message]

### Edge Cases & Exceptions (Resilience)
- **AC-3: [Error / Failure Scenario]**
  - **Given** [dependency failure, timeout, or missing resource]
  - **When** [operation attempted]
  - **Then** [graceful recovery, state rollback, or fallback response]

## 4. Test Data & Boundary Matrix
| Parameter / Field | Valid Inputs (Happy) | Invalid / Boundary Inputs (Edge) |
|---|---|---|
| \`sample_field\` | \`["valid_val_1", "valid_val_2"]\` | \`["", null, "> max_length", -1]\` |

## 5. Verification Sensors
| Sensor | Command / Target | Success Threshold |
|---|---|---|
| Linter | \`npm run lint\` | 0 errors, 0 warnings |
| Tests | \`npm test\` | 100% pass |
| Build | \`npm run build\` | Clean exit 0 |
| Spec Drift | \`node .agents/scripts/check-spec-drift.js\` | 0 drifting files |
`;
}

function generateTasksMarkdown(featureId, title) {
  return `# Task List: ${title} — MetaGPT SOP Schema Contract

## Sequence Guidelines (MetaGPT SOP)
- **Strict Sequential Order**: Tasks must be executed top-to-bottom without reordering or cherry-picking.
- **Atomic File Boundaries**: Each task must modify at most 1–3 specific target files.
- **Decoupled Test Setup**: Test harness (\`Type: test\`) MUST precede implementation tasks (\`Type: feat\`).
- **Sensor Evidence Gate**: Mark complete \`[x]\` ONLY after passing build, lint, and test sensors with recorded evidence.

## Implementation Tasks

| Status | ID | Type | Description | Target Files | Dependencies | Evidence |
|---|---|---|---|---|---|---|
| [ ] | TASK-01 | test | Scaffold unit & integration test cases matching BDD acceptance criteria | \`tests/${featureId}.test.js\` | None | |
| [ ] | TASK-02 | feat | Implement core logic and models to pass test suite | \`src/${featureId}.js\` | TASK-01 | |
| [ ] | TASK-03 | review | Audit implementation against BDD scenarios and run full sensor gate | \`tests/${featureId}.test.js\`, \`src/${featureId}.js\` | TASK-02 | |

## Schema Dictionary
- **Status**: \`[ ]\` (Pending) | \`[x]\` (Verified Complete).
- **ID**: \`TASK-01\`, \`TASK-02\`, etc.
- **Type**: \`test\` | \`feat\` | \`fix\` | \`refactor\` | \`docs\` | \`review\`.
- **Target Files**: Concrete relative file paths.
- **Dependencies**: Comma-separated preceding task IDs or \`None\`.
- **Evidence**: Commit hash (\`git rev-parse --short HEAD\`) + sensor output snippet.
`;
}

/**
 * Scaffolds a new feature directory with canonical specifications
 * @param {string} featureId
 * @param {object} options
 */
function scaffoldFeature(featureId, options = {}) {
  if (!featureId) {
    throw new Error('Feature ID is required (e.g. auth-jwt, user-profile).');
  }

  // Normalize feature ID (kebab-case)
  const cleanId = featureId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const title = options.title || cleanId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const targetDir = path.join(REPO_ROOT, '.specs', 'features', cleanId);

  if (fs.existsSync(targetDir) && !options.force) {
    throw new Error(`Feature directory already exists at ${path.relative(REPO_ROOT, targetDir)}. Use --force to overwrite.`);
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const planPath = path.join(targetDir, 'plan.md');
  const specPath = path.join(targetDir, 'spec.md');
  const tasksPath = path.join(targetDir, 'tasks.md');

  fs.writeFileSync(planPath, generatePlanMarkdown(cleanId, title), 'utf8');
  fs.writeFileSync(specPath, generateSpecMarkdown(cleanId, title), 'utf8');
  fs.writeFileSync(tasksPath, generateTasksMarkdown(cleanId, title), 'utf8');

  return {
    success: true,
    featureId: cleanId,
    title,
    directory: targetDir,
    files: [planPath, specPath, tasksPath]
  };
}

function main() {
  const args = process.argv.slice(2);
  const featureId = args.find(a => !a.startsWith('--'));

  if (!featureId) {
    console.error('\n❌ [ERRO] ID da feature obrigatório.');
    console.error('Uso: node .agents/scripts/create-feature.js <feature-id> [--title "Título da Feature"] [--force]\n');
    console.error('Exemplo: node .agents/scripts/create-feature.js auth-jwt --title "Autenticação JWT"\n');
    process.exit(1);
  }

  let title = '';
  const titleIndex = args.indexOf('--title');
  if (titleIndex !== -1 && args[titleIndex + 1]) {
    title = args[titleIndex + 1];
  }

  const isForce = args.includes('--force');

  try {
    const result = scaffoldFeature(featureId, { title, force: isForce });
    console.log(`\n🎉 [FEATURE SCAFFOLDED] Especificação criada com sucesso!`);
    console.log(`📁 Diretório: .specs/features/${result.featureId}/`);
    console.log(`   - plan.md   (O que & Por quê)`);
    console.log(`   - spec.md   (Critérios de Aceite BDD & Sensores)`);
    console.log(`   - tasks.md  (Tabela SOP de 7 Colunas MetaGPT)\n`);
  } catch (err) {
    console.error(`\n❌ [FALHA NO SCAFFOLDING] ${err.message}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  scaffoldFeature,
  generatePlanMarkdown,
  generateSpecMarkdown,
  generateTasksMarkdown
};
