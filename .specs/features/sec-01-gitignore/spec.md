# Specification: Canonical .gitignore Implementation (sec-01-gitignore)

## 1. User Stories
- **US-1**: As a developer or AI agent using this framework, I want critical environment files, secrets, dependency folders, and ephemeral scratch artifacts ignored by default in Git, so that credentials and junk files are never accidentally committed to version control.

## 2. Acceptance Criteria (BDD)

### AC-1: Environment and Secrets Blocking
- **Given** an untracked `.env` or `.env.local` or `secret.pem` file created in the workspace
- **When** `git status --porcelain` is executed
- **Then** the secret files must NOT appear in the untracked files list.

### AC-2: Ephemeral Agent Scratchpad and Cache Blocking
- **Given** files created inside `scratch/`, `docs/security-audit/node_modules/`, or `.edge-temp/`
- **When** `git status --porcelain` is executed
- **Then** these directory contents must NOT be tracked or listed as untracked.

### AC-3: Repository Artifacts Preservation
- **Given** tracked framework files under `.agents/`, `.specs/`, and root documentation
- **When** `.gitignore` is active
- **Then** essential `.md`, `.yml`, and template files must remain trackable.

## 3. Verification Sensors
| Sensor | Command / Target | Success Threshold |
|---|---|---|
| Sensor-1 (Secrets Ignored) | `git check-ignore -v .env .env.local id_rsa.pem` | All paths match `.gitignore` rules |
| Sensor-2 (Scratch Ignored) | `git check-ignore -v scratch/test.js docs/security-audit/node_modules/` | All scratch paths ignored |
| Sensor-3 (Git Status Clean) | `git status --porcelain` | Only `.gitignore` and `.specs/` listed |

## 4. UI & Design System Tokens
- Not applicable (backend / repository configuration).
