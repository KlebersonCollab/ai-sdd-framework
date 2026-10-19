#!/usr/bin/env node

/**
 * Git Pre-Commit Hook Installer
 * AI-SDD Framework | Installs worktree-resilient dual-sensor pre-commit hook
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '../..');

function getHooksDir() {
  try {
    const gitHooksPath = execSync('git rev-parse --git-path hooks', { cwd: repoRoot, encoding: 'utf8' }).trim();
    if (gitHooksPath) {
      return path.isAbsolute(gitHooksPath) ? gitHooksPath : path.resolve(repoRoot, gitHooksPath);
    }
  } catch (err) {
    // Fallback if git rev-parse fails
  }
  return path.join(repoRoot, '.git', 'hooks');
}

function getHookScript() {
  return `#!/bin/sh
# AI-SDD Dual Pre-Commit Gate: Canonical Integrity & Spec Drift Sensor

echo "🛡️  [PRE-COMMIT HOOK] Validando integridade SDD e conformidade de especificações..."

# 1. SDD Canonical Integrity Sensor
node .agents/scripts/verify-sdd-integrity.js
if [ $? -ne 0 ]; then
  echo "🚫 [PRE-COMMIT BLOCKED] Falha de integridade SDD detectada."
  exit 1
fi

# 2. Spec-Code Drift Sensor (Constitutional SDD)
node .agents/scripts/check-spec-drift.js
if [ $? -ne 0 ]; then
  echo "🚫 [PRE-COMMIT BLOCKED] Desvio de especificação (Spec Drift) detectado."
  exit 1
fi

echo "✅ [PRE-COMMIT OK] Integridade canônica e drift verificados com sucesso."
exit 0
`;
}

function installHooks() {
  const hooksDir = getHooksDir();
  const preCommitHookPath = path.join(hooksDir, 'pre-commit');

  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  const hookScript = getHookScript();
  fs.writeFileSync(preCommitHookPath, hookScript, { mode: 0o755 });
  console.log('✅ Git Pre-Commit Hook instalado com sucesso em:', preCommitHookPath);
  return { success: true, path: preCommitHookPath };
}

if (require.main === module) {
  installHooks();
}

module.exports = {
  getHooksDir,
  getHookScript,
  installHooks
};
