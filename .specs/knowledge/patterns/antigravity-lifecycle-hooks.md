# Pattern: Antigravity Native Lifecycle Hooks (.agents/hooks.json)

## Context & Problem
Relying solely on LLM system prompts to load `STATE.md`, `CONTEXT.md`, and `memory_graph.jsonl` at the start of every session wastes 5–6 sequential file-read tool calls, and relying on voluntary prompt compliance does not physically block prohibited shell flags (`--no-verify`, `git reset --hard`) before execution.

## Canonical Solution
Configure `.agents/hooks.json` with cross-platform Node.js handlers (`node scripts/sdd-hook.js <event>`, executed with `.agents/` as working directory):
1. **`SessionStart`**: Reads active project state, memory entities, and knowledge base patterns and returns `{"injectSteps": [{"systemMessage": {"systemMessage": "..."}}]}` to pre-hydrate context in `< 80ms`.
2. **`PreToolUse`** (`matcher: "run_command"`): Inspects `toolCall.args.CommandLine` and returns `{"decision": "deny", "reason": "..."}` if Tier 1 prohibited git commands are detected.
3. **`Stop`**: Checks working tree spec drift on `terminationReason === "NO_TOOL_CALL"` with a single-turn anti-loop guardrail (`executionNum <= 1`).

## Verification Sensor
- Tested in `tests/antigravity-harness-v2.test.js` (`AC-1`, `AC-2`, `AC-3`, `AC-7`).
