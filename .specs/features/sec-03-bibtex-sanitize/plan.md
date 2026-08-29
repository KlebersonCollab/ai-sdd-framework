# Plan: BibTeX Metadata Sanitization in arXiv Skill (sec-03-bibtex-sanitize)

## 1. Problem Statement & Motivation
The `arxiv` skill generates BibTeX citation entries by fetching XML metadata from arXiv and directly interpolating paper titles and author names into string templates without escaping TeX/BibTeX special characters (such as `\`, `{`, `}`, `$`, `%`, `&`, `_`, `#`). Malformed metadata or special characters break BibTeX/LaTeX compilation and introduce syntax injection risks.

## 2. Scope & Boundaries
- **In Scope**:
  - Add an `escape_bibtex(text)` sanitization function to the Python snippet in `.agents/skills/arxiv/SKILL.md`.
  - Apply the sanitization helper to all dynamic metadata fields (`title`, `authors`, `last_name`, `cat`).
  - Validate that special characters are properly escaped without corrupting LaTeX rendering.
- **Out of Scope**:
  - Rewriting other sections of the arXiv skill or changing the REST API queries.

## 3. High-Level Approach
Define a deterministic sanitization helper in the embedded Python script:
```python
def escape_bibtex(text):
    if not text: return ""
    replacements = [
        ('\\\\', '\\\\textbackslash{}'),
        ('{', '\\\\{'),
        ('}', '\\\\}'),
        ('$', '\\\\$'),
        ('%', '\\\\%'),
        ('&', '\\\\&'),
        ('_', '\\\\_'),
        ('#', '\\\\#'),
        ('~', '\\\\textasciitilde{}'),
        ('^', '\\\\textasciicircum{}')
    ]
    for char, escaped in replacements:
        text = text.replace(char, escaped)
    return text
```
Ensure that `title` and `authors` pass through this function before output.

## 4. Dependencies & Prerequisites
- Python 3 standard library (`sys`, `xml.etree.ElementTree`).

## 5. Architectural Decision Records (ADRs)
- Not required.
