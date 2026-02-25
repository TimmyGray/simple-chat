# Documentation Gardening

Scan for stale, broken, or inconsistent documentation and open fix-up PRs automatically.

> Inspired by: "A recurring doc-gardening agent scans for stale or obsolete documentation that does not reflect the real code behavior and opens fix-up pull requests." — OpenAI Harness Engineering

## Process

### 1. Structural Integrity Check

Verify all files referenced in `CLAUDE.md` Quick Reference table exist:
```
ARCHITECTURE.md, docs/SECURITY.md, docs/FRONTEND.md, docs/DESIGN.md,
docs/RELIABILITY.md, docs/PRODUCT_SENSE.md, docs/PLANS.md,
docs/QUALITY_SCORE.md, docs/design-docs/core-beliefs.md,
docs/exec-plans/tech-debt-tracker.md, docs/exec-plans/maintenance-cadence.json,
docs/references/nestjs-patterns.md,
docs/references/mui-theme-reference.md, docs/references/openrouter-api.md,
docs/generated/db-schema.md, docs/CONVENTIONS.md, docs/WORKFLOW.md
```

For each missing file, report: `BROKEN REFERENCE: <file> referenced in CLAUDE.md but does not exist`

### 2. Architecture Doc vs Reality

1. Read `ARCHITECTURE.md` — extract the module list from the Module Graph section
2. Run `ls backend/src/` — get actual backend modules
3. Run `ls frontend/src/` — get actual frontend directories
4. Compare: report any module in docs but not on disk, or on disk but not in docs
5. Check that each API endpoint listed in ARCHITECTURE.md actually exists in the corresponding controller file

### 3. DB Schema Freshness

1. Read `docs/generated/db-schema.md`
2. Read actual TypeScript interfaces/types used for MongoDB documents in `backend/src/`
3. Compare field names and types — report any drift
4. If drift found, regenerate `docs/generated/db-schema.md`

### 4. Quality Score Staleness

1. Read `docs/QUALITY_SCORE.md`
2. Check the "Last Updated" or date in the file
3. Run current counts:
   - `cd backend && npx vitest run --reporter=verbose 2>&1 | tail -5` — test count
   - `cd frontend && npx vitest run --reporter=verbose 2>&1 | tail -5` — test count
   - `npm run lint 2>&1 | tail -3` — lint error count
   - `npm run typecheck 2>&1 | tail -3` — type error count
4. If any metric differs from what's in the doc, update it

### 5. Tech Debt Tracker Consistency

1. Read `docs/exec-plans/tech-debt-tracker.md`
2. For each task marked `done`:
   - Verify the fix actually exists in the codebase (search for relevant code)
   - If the fix was reverted or is missing, change status back to `todo`
3. For each task marked `todo`:
   - Check if it was already addressed (search codebase for the fix)
   - If already fixed, mark as `done`

### 6. Cross-Link Validation

1. For every markdown file in `docs/`:
   - Extract all relative links (e.g., `[text](../ARCHITECTURE.md)`)
   - Verify each link target exists
   - Report broken links: `BROKEN LINK: <file> links to <target> which does not exist`

### 7. Core Beliefs vs Practice

1. Read `docs/design-docs/core-beliefs.md`
2. For each belief, spot-check one example in the codebase:
   - Belief 2 (Validate at Boundaries) → check a random controller has DTO validation
   - Belief 4 (Security) → check no hardcoded secrets in source
   - Belief 6 (i18n) → check a random component uses `t()`
3. Report any violations found

### 8. Product Sense Staleness

1. Read `docs/PRODUCT_SENSE.md` — extract every named feature from the prioritization lists (P0, P1, P2)
2. Read `docs/exec-plans/tech-debt-tracker.md` — collect all `done` FEAT-* tasks
3. For each feature in PRODUCT_SENSE.md:
   - Search for a matching FEAT-* entry in the tracker (match by keyword/description)
   - If the tracker entry is `done` but PRODUCT_SENSE.md still lists it as pending/planned, flag: `STALE PRODUCT SENSE: "<feature>" is listed as planned but already completed (FEAT-XX)`
4. Check for features that exist in the tracker but are missing from PRODUCT_SENSE.md entirely
5. If any staleness found, update `docs/PRODUCT_SENSE.md`:
   - Move completed features to a new "Completed" section or strike them from planned lists
   - Add any missing features from the tracker
   - Keep the document's voice and structure consistent

### 9. Report & Fix

Create a summary:
```
## Doc Garden Report

### Broken References: X
### Architecture Drift: X items
### Schema Drift: X fields
### Stale Metrics: X
### Tracker Inconsistencies: X
### Broken Links: X
### Belief Violations: X
### Product Sense Stale: X features
```

If any issues found:
1. Fix all documentation issues directly (update stale docs, fix broken links, regenerate schemas)
2. Create branch: `git checkout -b chore/doc-garden-$(date +%Y%m%d)`
3. Stage fixed files explicitly by name
4. Commit: descriptive message about what was fixed
5. Push and create PR with the report as description

If no issues found, report: `Documentation is healthy. No fixes needed.`

## Cadence

Run this:
- After every `/audit-service`
- Before any major release
- When ARCHITECTURE.md or CLAUDE.md is modified
- On demand when documentation seems stale
