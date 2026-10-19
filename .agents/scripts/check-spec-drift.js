#!/usr/bin/env node

/**
 * Spec Drift Detector — Pre-Commit & Working Tree Audit Sensor
 * Enforces Constitutional Spec-Driven Development (CSDD).
 * 
 * Verifies that staged or working tree code modifications are explicitly declared in
 * an active feature task specification under `.specs/features/<id>/tasks.md`.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '../..');

// Exempt prefixes/patterns (governance, specs, configs, documentation)
const EXEMPT_PATTERNS = [
  /^\.specs\//,
  /^\.agents\//,
  /^docs\//,
  /\.md$/i,
  /\.json$/i,
  /\.yml$/i,
  /\.yaml$/i,
  /\.gitignore$/,
  /^LICENSE$/,
  /^\.cursor/,
  /^\.continue/,
  /^\.devin/,
  /^\.github/,
  /^\.aider/,
  /^\.cline/,
  /^\.windsurf/,
  /^\.goose/,
  /^\.junie/,
  /^\.openhands/
];

function normalizePath(filePath) {
  if (!filePath) return '';
  return filePath
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.\//, '');
}

function isExempt(filePath) {
  const normalized = normalizePath(filePath);
  return EXEMPT_PATTERNS.some(pattern => pattern.test(normalized));
}

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    if (!output) return [];
    return output.split('\n').map(f => normalizePath(f)).filter(Boolean);
  } catch (err) {
    return [];
  }
}

function getWorkingTreeFiles() {
  try {
    const diffOutput = execSync('git diff --name-only', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    const statusOutput = execSync('git status --porcelain -uall', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    const files = new Set();

    if (diffOutput) {
      diffOutput.split('\n').forEach(f => {
        const clean = normalizePath(f);
        if (clean) files.add(clean);
      });
    }

    if (statusOutput) {
      statusOutput.split('\n').forEach(line => {
        if (!line) return;
        const filePath = line.replace(/^[ MADRCU?!]{1,3}\s+/, '').trim();
        const clean = normalizePath(filePath);
        if (clean) files.add(clean);
      });
    }

    return Array.from(files);
  } catch (err) {
    return [];
  }
}

function isFileCovered(filePath, declaredTargets) {
  const normalizedFile = normalizePath(filePath);

  for (const declaredRaw of declaredTargets) {
    const declared = normalizePath(declaredRaw);
    if (!declared) continue;

    // 1. Exact match
    if (declared === normalizedFile) {
      return true;
    }

    // 2. Directory prefix match (e.g. src/ or src/services/)
    if (declared.endsWith('/') && normalizedFile.startsWith(declared)) {
      return true;
    }
    if (normalizedFile.startsWith(declared + '/')) {
      return true;
    }

    // 3. Glob matching (e.g. tests/**/*.test.js or src/*.ts)
    if (declared.includes('*')) {
      const regexPattern = '^' + declared
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '.*')
        .replace(/(?<!\.)\*/g, '[^/]*') + '$';
      try {
        const regex = new RegExp(regexPattern);
        if (regex.test(normalizedFile)) {
          return true;
        }
      } catch (e) {
        // Fallback to substring
      }
    }

    // 4. Suffix match (e.g. item.ts inside src/models/item.ts)
    if (normalizedFile.endsWith('/' + declared) || normalizedFile === declared) {
      return true;
    }
  }

  return false;
}

function getDeclaredTargetFiles() {
  const specsFeaturesDir = path.join(REPO_ROOT, '.specs', 'features');
  if (!fs.existsSync(specsFeaturesDir)) return new Set();

  const declaredFiles = new Set();
  const featureDirs = fs.readdirSync(specsFeaturesDir);

  for (const featureDir of featureDirs) {
    const tasksFile = path.join(specsFeaturesDir, featureDir, 'tasks.md');
    if (!fs.existsSync(tasksFile)) continue;

    const content = fs.readFileSync(tasksFile, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('|') || trimmed.includes('Target Files') || trimmed.includes('---')) continue;
      const columns = trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
      
      let targetColumn = '';
      if (columns.length >= 7) {
        targetColumn = columns[4];
      } else if (columns.length >= 5) {
        targetColumn = columns[3];
      }

      if (targetColumn) {
        const matches = targetColumn.match(/`([^`]+)`/g);
        if (matches) {
          matches.forEach(m => {
            const cleanPath = normalizePath(m.replace(/`/g, ''));
            if (cleanPath) declaredFiles.add(cleanPath);
          });
        } else {
          targetColumn.split(',').forEach(p => {
            const cleanPath = normalizePath(p);
            if (cleanPath) declaredFiles.add(cleanPath);
          });
        }
      }
    }
  }

  return declaredFiles;
}

function checkSpecDrift(options = {}) {
  const isWorkingTreeMode = Boolean(
    options.workingTree ||
    (typeof process !== 'undefined' && process.argv && process.argv.includes('--working-tree'))
  );

  console.log(`\n🔍 [SPEC DRIFT SENSOR] Verificando conformidade entre código e especificações${isWorkingTreeMode ? ' (WORKING TREE)' : ''}...`);

  let targetFilesToCheck = [];
  const stagedFiles = getStagedFiles();

  if (isWorkingTreeMode || stagedFiles.length === 0) {
    const workingTreeFiles = getWorkingTreeFiles();
    const combined = new Set([...stagedFiles, ...workingTreeFiles]);
    targetFilesToCheck = Array.from(combined);
  } else {
    targetFilesToCheck = stagedFiles;
  }

  if (targetFilesToCheck.length === 0) {
    console.log('ℹ️ Nenhum arquivo alterado no repositório. Verificação concluída com sucesso.\n');
    return { ok: true, driftingFiles: [] };
  }

  const codeFiles = targetFilesToCheck.filter(f => !isExempt(f));

  if (codeFiles.length === 0) {
    console.log('✅ [SPEC DRIFT OK] Apenas artefatos de governança/specs/docs foram alterados.\n');
    return { ok: true, driftingFiles: [] };
  }

  const declaredTargets = getDeclaredTargetFiles();
  const driftingFiles = [];

  for (const file of codeFiles) {
    if (!isFileCovered(file, declaredTargets)) {
      driftingFiles.push(file);
    }
  }

  if (driftingFiles.length > 0) {
    console.error('\n❌ [SPEC DRIFT DETECTADO] Arquivos de código órfãos encontrados!');
    console.error('Os seguintes arquivos de implementação NÃO estão declarados em nenhum tasks.md ativo em .specs/features/:');
    driftingFiles.forEach(f => console.error(`   - ${f}`));
    console.error('\n📋 Como Resolver:');
    console.error('   1. Use o skill `sdd-planner` para criar ou atualizar a especificação da feature em `.specs/features/<feature-id>/`.');
    console.error('   2. Adicione os arquivos acima na coluna `Target Files` do arquivo `tasks.md`.');
    console.error('   3. Faça o stage do `tasks.md` atualizado e repita a verificação.\n');

    if (!options.silentFail && typeof process !== 'undefined' && process.exit) {
      process.exit(1);
    }
    return { ok: false, driftingFiles };
  }

  console.log('✅ [SPEC DRIFT OK] Todos os arquivos alterados estão devidamente cobertos pelas especificações ativas.\n');
  return { ok: true, driftingFiles: [] };
}

if (require.main === module) {
  checkSpecDrift();
}

module.exports = {
  normalizePath,
  isExempt,
  isFileCovered,
  getStagedFiles,
  getWorkingTreeFiles,
  getDeclaredTargetFiles,
  checkSpecDrift
};
