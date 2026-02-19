# Core Engineering Beliefs

These principles guide all development decisions. Check against them during code review.

## 1. Simplicity Over Cleverness
- Prefer straightforward code over clever abstractions
- Three similar lines is better than a premature abstraction
- Only add complexity when the current task demands it

## 2. Validate at Boundaries, Trust Inside
- Validate all external input (user input, API responses, file contents)
- Don't add redundant validation inside trusted internal code paths
- DTOs at controller level, sanitization at render level

## 3. Fail Fast, Fail Loud
- Invalid config → crash at startup (Joi validation)
- Missing required data → throw NotFoundException immediately
- Don't silently swallow errors — log them, surface them to users

## 4. Security is Non-Negotiable
- Never commit secrets
- Always sanitize user content before rendering
- Reconstruct file paths server-side (never trust client paths)
- Rate limit all public endpoints
- Review against `docs/SECURITY.md` checklist

## 5. Test What Matters
- Test business logic and edge cases, not framework plumbing
- Every bug fix should come with a regression test
- Prefer integration tests over unit tests for API endpoints

## 6. i18n From Day One
- All user-facing strings go through `t()` — no exceptions
- New strings must be added to all 4 locale files
- Use the `/i18n-dev` command for guidance

## 7. Consistent Patterns
- Follow existing module patterns (NestJS modules, React hooks)
- Use MUI components, not raw HTML
- Use theme tokens, not hardcoded colors
- Match error handling patterns in existing code

## 8. Small, Focused Changes
- One PR = one concern
- If a PR touches > 10 files, consider splitting
- Don't mix refactoring with feature work

## 9. Automation Over Process
- If a check can be automated (lint, typecheck, test), it should be in CI
- Pre-commit hooks catch issues before they reach the PR
- Commands automate the entire development workflow

## 10. Agent Legibility First
- Code is optimized for agent comprehension, not just human aesthetics
- If the agent can't access it in-context, it effectively doesn't exist
- Push all context into the repository — Slack discussions, design decisions, tacit knowledge
- Favor "boring" technologies: composable, stable APIs, well-represented in training data

## 11. Encode Taste into Tooling
- If the same issue appears in 3+ reviews, promote it to an ESLint rule or structural test
- Custom lint error messages ARE agent prompts — include remediation instructions
- Human taste is captured once, then enforced continuously on every line of code
- When documentation falls short, promote the rule into code

## 12. Continuous Garbage Collection
- Technical debt is a high-interest loan — pay it down in small increments
- Run `/sweep` every 2-3 features to scan for deviations
- Run `/doc-garden` after audits to keep documentation fresh
- Background cleanup is cheaper than painful bursts of refactoring

## 13. Progressive Disclosure for Context
- CLAUDE.md is the table of contents (~60 lines), not the encyclopedia
- Agents start with a small, stable entry point and are taught where to look next
- Repository knowledge is the system of record — structured `docs/` directory
- Context is a scarce resource: too much guidance becomes non-guidance
