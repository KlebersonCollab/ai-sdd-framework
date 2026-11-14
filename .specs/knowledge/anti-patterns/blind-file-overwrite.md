# Anti-Pattern: Blind Full-File Overwrite (SWE-agent ACI Violation)

## Description
Overwriting an existing multi-hundred-line codebase file using `write_file` (`Overwrite: true`) to change only a small function or block of lines.

## Why It Is Forbidden (Tier 1 Prohibition 8)
1. **Silent Code Truncation**: Large file dumps in LLM outputs frequently drop helper functions, comments, or edge-case handlers outside the immediate focus area.
2. **Context Exhaustion**: Emitting hundreds of unchanged lines wastes output token budgets and degrades reasoning accuracy.

## Required Alternative
1. Read a bounded slice (`100–300` lines) around the target region using `read_file` with `StartLine` and `EndLine`.
2. Apply surgical contiguous block replacement using `edit_file` (`Target` + `Replacement`).
