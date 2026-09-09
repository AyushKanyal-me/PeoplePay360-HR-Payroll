# PeoplePay360 — Repository Hygiene & Git Boundary Audit Report

**Date:** 2026-09-09  
**Status:** Pre-Implementation Audit Completed  

---

## 1. Root-Level File & Directory Classification

| File / Path | Category | Should Be Committed? | Reason |
| :--- | :--- | :---: | :--- |
| `.gitignore` | **B — REQUIRED CONFIGURATION** | **YES** | Defines repository-wide version control exclusion rules. |
| `.git/` | **F — LOCAL DEVELOPMENT ONLY** | **NO** | Git internal metadata directory (managed by Git). |
| `master_instructions.txt` | **F — LOCAL DEVELOPMENT ONLY / G — PRIVATE** | **NO** | Local agent instructions and development prompts. Must remain local. |
| `HRMS OXP - 24 hours.excalidraw` | **F — LOCAL DEVELOPMENT ONLY / E — DESIGN** | **NO** | Personal architecture whiteboard source file (~5.1MB). Excluded via `.gitignore`. |
| `PeoplePay360 HR & Payroll.pdf` | **F — LOCAL DEVELOPMENT ONLY / E — SPEC** | **NO** | Exported PDF specification (~5.5MB). Excluded via `.gitignore`. |
| `backend/` | **A / B / D / E — APPLICATION ROOT** | **YES (Subtree)** | Contains application source, configuration, tests, and API documentation. |
| `supabase/` | **B / C — DATABASE SOURCE OF TRUTH** | **YES (Subtree)** | Contains declarative SQL migrations, seed data, and Supabase config. |

---

## 2. Detailed Directory Breakdown

### A. `backend/` Directory
- **`backend/src/`** (`Category A — REQUIRED SOURCE`): **COMMIT**. Core TypeScript Express server, modules, middleware, and business logic.
- **`backend/package.json` & `package-lock.json`** (`Category B — REQUIRED CONFIGURATION`): **COMMIT**. Node dependency manifests.
- **`backend/tsconfig.json`** (`Category B — REQUIRED CONFIGURATION`): **COMMIT**. TypeScript compiler settings.
- **`backend/.env.example`** (`Category B — REQUIRED CONFIGURATION`): **COMMIT**. Clean template without real secrets.
- **`backend/.env`** (`Category G — PRIVATE/CONFIDENTIAL`): **NEVER COMMIT**. Ignored by `.gitignore`. Contains local configuration.
- **`backend/dist/`** (`Category H — GENERATED/DERIVED`): **NEVER COMMIT**. Transpiled build output (ignored by `.gitignore`).
- **`backend/node_modules/`** (`Category H — GENERATED/DEPENDENCY`): **NEVER COMMIT**. Installed packages (ignored by `.gitignore`).
- **`backend/tests/`** (`Category D — TESTING`): **COMMIT**. Automated test suite (Vitest + Supertest).
- **`backend/docs/`** (`Category E — DOCUMENTATION`): **COMMIT**. API specification (`api.md`) and Postman collection.

### B. `supabase/` Directory
- **`supabase/migrations/`** (`Category C — DATABASE SOURCE OF TRUTH`): **COMMIT**. Migrations 1 through 5.
- **`supabase/config.toml`** (`Category B — REQUIRED CONFIGURATION`): **COMMIT**. Local Supabase project settings.
- **`supabase/seed.sql`** (`Category C/D — DATABASE SEED DATA`): **COMMIT**. Initial seed data for development.
- **`supabase/.gitignore`** (`Category B — REQUIRED CONFIGURATION`): **COMMIT**. Supabase-specific ignore rules.
- **`supabase/.temp/`** (`Category I — TEMPORARY`): **NEVER COMMIT**. Local Supabase state.

---

## 3. Security & Secret Exposure Audit

- **Tracked Files Secret Scan:** Scanned all Git-tracked files for JWT tokens, service-role keys, private keys, database passwords. **No active secrets found in tracked files.**
- **Git History Scan:** Inspected full Git history (`git log --all --name-only`). `.env` has never been committed.
- **Prior Large File Tracking:** In commit `fe8d40e`, `HRMS OXP - 24 hours.excalidraw` and `PeoplePay360 HR & Payroll.pdf` were initially committed, then untracked in commit `0384405`. They contain no credentials/secrets.

---

## 4. Gitignore Analysis & Recommendations

### Existing `.gitignore` Status
```gitignore
# Dependencies
node_modules/

# Build outputs
dist/
build/
coverage/

# Environment and secrets
.env
.env.local
.env.*.local
*.env

# Prompts, specs and design assets (local only)
*.pdf
*.excalidraw
*.txt
master_instructions.txt

# OS and IDE files
.DS_Store
*.log
.vscode/
.idea/

# Supabase local temp
.branches/
.temp/
```

### Recommendation on Broad Patterns
- `*.txt` is overly broad and could inadvertently ignore legitimate documentation or license files (`LICENSE.txt`, `robots.txt`).
- Explicitly ignore `master_instructions.txt` and any local agent folders (`.agent/`, `.local/`) instead of blanket `*.txt`.

---

## 5. Summary Matrix

### COMMIT THESE:
- `backend/src/**/*`
- `backend/package.json`
- `backend/package-lock.json`
- `backend/tsconfig.json`
- `backend/.env.example`
- `backend/tests/**/*`
- `backend/docs/**/*`
- `supabase/config.toml`
- `supabase/seed.sql`
- `supabase/migrations/*.sql`
- `.gitignore`
- `supabase/.gitignore`

### KEEP LOCAL:
- `master_instructions.txt`
- `HRMS OXP - 24 hours.excalidraw`
- `PeoplePay360 HR & Payroll.pdf`
- Local agent conversation logs & scratch files

### NEVER COMMIT:
- `backend/.env`
- `node_modules/`
- `dist/`
- `coverage/`
- `.DS_Store`
- `*.log`
- `supabase/.temp/`

### CURRENTLY TRACKED BUT SHOULD BE PRIVATE:
- **None**. All currently tracked files (`git ls-files`) belong to either configuration or database migrations.

---

## 6. Supabase TypeScript Types Generation Assessment

- **CLI Capability:** `npx supabase gen types typescript` is available in the CLI.
- **Local Daemon vs Linked Project:**
  - Local mode (`--local`) expects Docker daemon to be running.
  - Linked mode (`--project-id <id>` or `--db-url <url>`) can generate exact TypeScript types directly from the active Supabase project.
- **Strategy for Phase A:**
  - Use generated database types (or schema-derived type definitions) as the single source of truth for the Supabase client (`Database` interface).
  - Do not maintain redundant manual schema models that drift from the database migrations.
