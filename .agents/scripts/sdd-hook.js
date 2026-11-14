#!/usr/bin/env node

/**
 * Antigravity Native Lifecycle Hook Runner
 * AI-SDD Framework | ADR 0009 (BR-1, BR-2, BR-3, AC-1, AC-2, AC-3, AC-7)
 *
 * Executes SessionStart, PreToolUse, and Stop hooks for Google Antigravity (.agents/hooks.json).
 * Reads camelCase protojson payloads from stdin and outputs structured JSON on stdout.
 * Zero external npm dependencies.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../..');

const PROHIBITED_COMMANDS = [
  {
    regex: /--no-verify\b/i,
    rule: 'Quality Enforcement / Tier 1 Prohibition: Bypassing git hooks with --no-verify is strictly forbidden.'
  },
  {
    regex: /\bgit\s+reset\s+--hard\b/i,
    rule: 'Tier 1 Prohibition 2: Destructive git reset --hard requires explicit user authorization.'
  },
  {
    regex: /\bgit\s+push\s+(?:--force|-f)\b/i,
    rule: 'Tier 1 Prohibition 2: Force pushing (git push --force) is forbidden without explicit user authorization.'
  },
  {
    regex: /\bgit\s+branch\s+-D\b/i,
    rule: 'Tier 1 Prohibition 2: Permanent branch deletion (git branch -D) is forbidden without authorization.'
  },
  {
    regex: /\bgit\s+clean\s+-[a-z]*f/i,
    rule: 'Tier 1 Prohibition 2: Permanent untracked file deletion (git clean -f) is forbidden.'
  }
];

/**
 * Reads active entities from .agents/memory/memory_graph.jsonl
 * @param {string} rootDir
 * @returns {Array<string>}
 */
function getActiveMemorySummary(rootDir = REPO_ROOT) {
  const memFile = path.join(rootDir, '.agents', 'memory', 'memory_graph.jsonl');
  if (!fs.existsSync(memFile)) return [];

  try {
    const lines = fs.readFileSync(memFile, 'utf8').split('\n').filter(Boolean);
    const activeEntities = [];
    for (const line of lines) {
      try {
        const rec = JSON.parse(line);
        if (rec.type === 'entity' && (!rec.status || rec.status === 'active')) {
          activeEntities.push(rec.name);
        }
      } catch (e) {
        // skip invalid line
      }
    }
    return activeEntities;
  } catch (err) {
    return [];
  }
}

/**
 * Reads pattern and anti-pattern filenames from .specs/knowledge/
 * @param {string} rootDir
 * @returns {{ patterns: Array<string>, antiPatterns: Array<string> }}
 */
function getKnowledgeSummary(rootDir = REPO_ROOT) {
  const patternsDir = path.join(rootDir, '.specs', 'knowledge', 'patterns');
  const antiPatternsDir = path.join(rootDir, '.specs', 'knowledge', 'anti-patterns');

  const patterns = fs.existsSync(patternsDir)
    ? fs.readdirSync(patternsDir).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, ''))
    : [];
  const antiPatterns = fs.existsSync(antiPatternsDir)
    ? fs.readdirSync(antiPatternsDir).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, ''))
    : [];

  return { patterns, antiPatterns };
}

/**
 * Extracts the Session Status section from .specs/project/STATE.md
 * @param {string} rootDir
 * @returns {string}
 */
function getStateStatusSnippet(rootDir = REPO_ROOT) {
  const stateFile = path.join(rootDir, '.specs', 'project', 'STATE.md');
  if (!fs.existsSync(stateFile)) return 'STATE.md not found (Bootstrap required).';

  try {
    const content = fs.readFileSync(stateFile, 'utf8');
    const lines = content.split('\n').slice(0, 12);
    return lines.join('\n').trim();
  } catch (err) {
    return 'Unable to read STATE.md.';
  }
}

/**
 * AC-1 / BR-1: Handles Antigravity SessionStart event
 * @param {object} payload
 * @returns {object}
 */
function handleSessionStart(payload = {}) {
  const rootDir = (Array.isArray(payload.workspacePaths) && payload.workspacePaths[0]) || REPO_ROOT;
  const activeEntities = getActiveMemorySummary(rootDir);
  const kb = getKnowledgeSummary(rootDir);
  const stateSnippet = getStateStatusSnippet(rootDir);

  const messageLines = [
    '🛡️ [SDD AUTO-REHYDRATION] Active SDD Governance & Context Loaded via Antigravity SessionStart Hook:',
    `- Active Memory Entities (${activeEntities.length}): ${activeEntities.join(', ') || 'None'}`,
    `- Knowledge Base: Patterns [${kb.patterns.join(', ') || 'None'}] | Anti-Patterns [${kb.antiPatterns.join(', ') || 'None'}]`,
    '- State Summary:',
    stateSnippet
  ];

  return {
    injectSteps: [
      {
        systemMessage: {
          systemMessage: messageLines.join('\n')
        }
      }
    ]
  };
}

/**
 * AC-2 / BR-2: Handles Antigravity PreToolUse event
 * @param {object} payload
 * @returns {{ decision: string, reason?: string }}
 */
function handlePreToolUse(payload = {}) {
  const toolCall = payload && payload.toolCall;
  if (!toolCall || typeof toolCall !== 'object') {
    return { decision: 'allow' };
  }

  const toolName = String(toolCall.name || '').toLowerCase();
  const args = toolCall.args || {};

  if (toolName === 'run_command') {
    const cmdLine = String(args.CommandLine || args.command || '');
    for (const ruleItem of PROHIBITED_COMMANDS) {
      if (ruleItem.regex.test(cmdLine)) {
        return {
          decision: 'deny',
          reason: `🚫 [SDD HARNESS GATE] Blocked command "${cmdLine}". ${ruleItem.rule}`
        };
      }
    }
  }

  return { decision: 'allow' };
}

/**
 * AC-3 / BR-3: Handles Antigravity Stop event with single-turn anti-loop guardrail
 * @param {object} payload
 * @param {object} [options]
 * @returns {{ decision: string, reason?: string }}
 */
function handleStop(payload = {}, options = {}) {
  const terminationReason = String(payload.terminationReason || 'NO_TOOL_CALL');
  const executionNum = typeof payload.executionNum === 'number' ? payload.executionNum : 1;

  // Anti-loop guardrail: only intercept normal turn completion on first stop attempt (executionNum <= 1)
  if (terminationReason !== 'NO_TOOL_CALL' || executionNum > 1 || executionNum <= 0) {
    return { decision: 'allow' };
  }

  let driftResult = options.mockDriftResult;
  if (!driftResult) {
    try {
      const { checkSpecDrift } = require('./check-spec-drift.js');
      // Capture console logs silently during hook execution so stdout stays pure JSON
      const origLog = console.log;
      const origErr = console.error;
      console.log = () => {};
      console.error = () => {};
      try {
        driftResult = checkSpecDrift({ workingTree: true, silentFail: true });
      } finally {
        console.log = origLog;
        console.error = origErr;
      }
    } catch (err) {
      driftResult = { ok: true, driftingFiles: [] };
    }
  }

  if (driftResult && !driftResult.ok && Array.isArray(driftResult.driftingFiles) && driftResult.driftingFiles.length > 0) {
    return {
      decision: 'continue',
      reason: `⚠️ [SDD STOP GATE] Spec Drift detected in working tree for: ${driftResult.driftingFiles.join(', ')}. Declare these files in .specs/features/<id>/tasks.md or revert orphaned edits before completing the turn.`
    };
  }

  return { decision: 'allow' };
}

/**
 * Safely parses JSON from stdin without throwing on empty or malformed input (AC-7)
 * @returns {object}
 */
function readStdinJson() {
  try {
    const raw = fs.readFileSync(0, 'utf8').trim();
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

function main() {
  const eventArg = String(process.argv[2] || '').toLowerCase();
  const payload = readStdinJson();

  let response = {};
  if (eventArg === 'session-start' || eventArg === 'sessionstart') {
    response = handleSessionStart(payload);
  } else if (eventArg === 'pre-tool-use' || eventArg === 'pretooluse') {
    response = handlePreToolUse(payload);
  } else if (eventArg === 'stop') {
    response = handleStop(payload);
  } else {
    response = { decision: 'allow' };
  }

  process.stdout.write(JSON.stringify(response) + '\n');
}

if (require.main === module) {
  main();
}

module.exports = {
  PROHIBITED_COMMANDS,
  getActiveMemorySummary,
  getKnowledgeSummary,
  handleSessionStart,
  handlePreToolUse,
  handleStop,
  readStdinJson
};
