# Plan: Canonical .gitignore Implementation (sec-01-gitignore)

## 1. Problem Statement & Motivation
The `ai-sdd-framework` repository lacks a `.gitignore` configuration at the root. Developers adopting the framework or AI agents running workflows create local `.env` files, API keys, cache files, and scratchpad/log artifacts that get accidentally tracked and committed by Git, risking credential exposure and repository pollution.

## 2. Scope & Boundaries
- **In Scope**:
  - Author a comprehensive, canonical `.gitignore` file for Node.js, Python, OS metadata, local environment variables, credentials, and AI agent scratchpad directories.
  - Test `.gitignore` rules against sample `.env`, credential files, and ephemeral paths via Git CLI sensors.
- **Out of Scope**:
  - Modifying existing skill logic or adding automated Git pre-commit hooks.

## 3. High-Level Approach
Create `.gitignore` at the project root with well-structured sections:
1. Environment & Secret files (`.env*`, `*.pem`, `*.key`, `*.cert`)
2. AI Agent Scratch & Ephemeral Artifacts (`scratch/`, `*.local.jsonl`, `*.log`, `.edge-temp/`)
3. Dependencies & Build outputs (`node_modules/`, `dist/`, `build/`, `__pycache__/`, `*.pyc`)
4. IDE & OS files (`.DS_Store`, `Thumbs.db`)

## 4. Dependencies & Prerequisites
- Git CLI to verify that files matching patterns are ignored.

## 5. Architectural Decision Records (ADRs)
- Not required (standard repository hygiene and security baseline).
