# Task List: BibTeX Metadata Sanitization in arXiv Skill (sec-03-bibtex-sanitize)

## Sequence Guidelines
- Tasks must be executed in exact sequential order.
- Each task must be atomic (1-2 files changed).
- Mark complete `[x]` ONLY after sensor verification.

## Implementation Tasks

| Status | ID | Description | Target Files | Evidence |
|---|---|---|---|---|
| [x] | TASK-01 | Add `escape_bibtex` function and apply escaping to `title` and `authors` in `.agents/skills/arxiv/SKILL.md` | `.agents/skills/arxiv/SKILL.md` | `arxiv/SKILL.md` updated with `escape_bibtex` helper (L119-136) |
| [x] | TASK-02 | Execute unit test sensor with test XML containing special characters to verify escape accuracy | `.agents/skills/arxiv/SKILL.md` | Sensor unit test verified correct escaping for `&`, `%`, `{`, `}`, `_`, `#`, `\`, `~`, `^` |
