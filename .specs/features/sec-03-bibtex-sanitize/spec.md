# Specification: BibTeX Metadata Sanitization in arXiv Skill (sec-03-bibtex-sanitize)

## 1. User Stories
- **US-1**: As a researcher or developer querying papers via `arxiv`, I want generated BibTeX citations to have all special LaTeX characters properly escaped, so that imported `.bib` files compile cleanly without syntax errors or injection anomalies.

## 2. Acceptance Criteria (BDD)

### AC-1: TeX Special Character Escaping
- **Given** an arXiv paper with special characters in title or author (e.g., `Attention & Transformers: A 100% {Survey} _of_ Deep Learning #1`)
- **When** the BibTeX generation script processes the XML entry
- **Then** all special characters (`&`, `%`, `{`, `}`, `_`, `#`) must be escaped with LaTeX backslashes (`\&`, `\%`, `\{`, `\}`, `\_`, `\#`).

### AC-2: Citation Key and URL Integrity
- **Given** paper IDs and version strings
- **When** generating the citation key and URL
- **Then** the citation key must remain alphanumeric and the URL must preserve valid URI syntax.

## 3. Verification Sensors
| Sensor | Command / Target | Success Threshold |
|---|---|---|
| Sensor-1 (Escape Unit Test) | Execute Python snippet with special character input | Correctly escapes `{`, `}`, `&`, `%`, `_`, `#` |
| Sensor-2 (Syntax Integrity) | Validate `arxiv/SKILL.md` code block | Clean markdown, matching syntax fences |

## 4. UI & Design System Tokens
- Not applicable.
