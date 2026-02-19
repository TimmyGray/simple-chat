# Golden Principles Sweep

Scan the codebase for deviations from golden principles, update quality grades, and open targeted micro-fix PRs.

> Inspired by: "On a regular cadence, background Codex tasks scan for deviations, update quality grades, and open targeted refactoring PRs. Most can be reviewed in under a minute and automerged." — OpenAI Harness Engineering

## Philosophy

Technical debt is a high-interest loan — pay it down continuously in small increments rather than letting it compound. Human taste is captured once in golden principles, then enforced continuously on every line of code.

## Process

### 1. Load Golden Principles

Read these files to understand current standards:
- `docs/design-docs/core-beliefs.md` — engineering principles
- `docs/CONVENTIONS.md` — code conventions
- `docs/SECURITY.md` — security checklist

### 2. Scan for Violations

Run these scans across `backend/src/` and `frontend/src/` (exclude `node_modules`, `dist`):

**Code Quality Violations:**
- [ ] Files > 300 lines → should be split
- [ ] Functions/methods > 50 lines → should be decomposed
- [ ] `any` types in TypeScript (outside test files) → should be properly typed
- [ ] `console.log` / `console.error` → should use Pino logger (backend) or remove (frontend)
- [ ] Unused imports → should be removed
- [ ] Deeply nested callbacks (> 3 levels) → should be flattened with async/await

**i18n Violations:**
- [ ] Hardcoded user-facing strings in `.tsx` files → should use `t()`
- [ ] i18n keys present in `en.json` but missing in `ru.json`, `zh.json`, or `es.json`
- [ ] i18n keys present in non-English locale but missing in `en.json`

**Security Violations:**
- [ ] Hardcoded URLs, IPs, ports, or secrets in source files (not config)
- [ ] Unsanitized user content rendered without `rehype-sanitize`
- [ ] Missing input validation on controller endpoints (no DTO)

**Pattern Violations:**
- [ ] Raw HTML elements where MUI equivalents exist (`<button>`, `<input>`, `<select>`)
- [ ] Hardcoded color values (hex, rgb) instead of theme tokens
- [ ] Direct MongoDB collection access outside `DatabaseService`
- [ ] Missing error handling on async operations (no try/catch, no .catch())

**Architecture Violations:**
- [ ] Cross-module direct imports (e.g., chat/ importing from uploads/ internals)
- [ ] Controllers containing business logic (should be in services)
- [ ] Services importing Express Response type (should use abstraction)

### 3. Prioritize Findings

Categorize each finding:
- **Auto-fix** — can be fixed mechanically with no risk (unused imports, missing i18n keys, console.log)
- **Simple fix** — straightforward but needs human verification (type annotations, error handling)
- **Needs design** — requires architectural thought (file splitting, module restructuring)

### 4. Create Micro-Fix PRs

For **auto-fix** findings:
1. Group related fixes (e.g., all i18n gaps in one PR, all unused imports in another)
2. For each group:
   - Create branch: `git checkout -b chore/sweep-<category>-$(date +%Y%m%d)`
   - Apply fixes
   - Run `npm run validate` to verify nothing breaks
   - Stage files explicitly, commit, push
   - Create PR with clear description of what was fixed and why
3. Each PR should be reviewable in under 1 minute

For **simple fix** findings:
- Add as new tasks to `docs/exec-plans/tech-debt-tracker.md` with priority `medium`
- These will be picked up by `/develop-feature`

For **needs design** findings:
- Add as new tasks to `docs/exec-plans/tech-debt-tracker.md` with priority `low`
- Include a note about what design decision is needed

### 5. Update Quality Grades

After all fixes:
1. Run the full validation suite: `npm run validate`
2. Update `docs/QUALITY_SCORE.md` with new metrics
3. Include quality grade changes in the commit

### 6. Report

Present a sweep summary:
```
## Sweep Report

### Scanned: X files
### Violations Found: X total
  - Auto-fixed: X (in Y PRs)
  - Added to tracker: X (simple fix)
  - Added to tracker: X (needs design)

### Quality Grade Changes:
  - [metric]: before → after

### PRs Created:
  - #N: [description]
```

## Cadence

- Run after every 2-3 features merged
- Run whenever quality metrics show degradation
- Run on demand as a quick cleanup pass
- Can be run in background while other work proceeds

## Important Rules

- Never fix something that might change behavior without tests confirming correctness
- Always run `npm run validate` after fixes — don't create PRs that break the build
- Keep each PR focused: one category of fix per PR
- Stage files explicitly — never `git add .` or `git add -A`
- If a fix touches > 5 files, split into multiple PRs
