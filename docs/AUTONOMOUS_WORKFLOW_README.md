# Autonomous Development Workflow

A comprehensive guide to the AI-agent-driven development workflow used in this project. This document explains the philosophy, commands, lifecycle, and maintenance cadence so any developer can understand, operate, and adapt the system.

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Architecture Overview](#architecture-overview)
3. [Prerequisites](#prerequisites)
4. [The Development Lifecycle](#the-development-lifecycle)
5. [Command Reference](#command-reference)
   - [`/develop-feature`](#develop-feature--autonomous-feature-development)
   - [`/validate`](#validate--validation-suite)
   - [`/review-pr`](#review-pr--multi-agent-self-review)
   - [`/audit-service`](#audit-service--codebase-audit)
   - [`/sweep`](#sweep--golden-principles-enforcement)
   - [`/doc-garden`](#doc-garden--documentation-gardening)
   - [`/retrospective`](#retrospective--workflow-self-improvement)
   - [`/i18n-dev`](#i18n-dev--internationalization-guidelines)
6. [Maintenance Cadence](#maintenance-cadence)
7. [Parallel Agent Execution](#parallel-agent-execution)
8. [The Self-Improvement Loop](#the-self-improvement-loop)
9. [Key Files & Configuration](#key-files--configuration)
10. [Adapting to a New Project](#adapting-to-a-new-project)

---

## Philosophy

This workflow is built on a set of core beliefs:

| Principle | What It Means |
|-----------|---------------|
| **Humans steer, agents execute** | Engineers design the environment and specify intent. AI agents write the code. |
| **When agents fail, fix the environment** | Don't retry harder. Ask: "What capability is missing?" and add it to the repo. |
| **Encode taste into tooling** | Review findings become lint rules. Conventions become tests. Human judgment is captured once and enforced forever. |
| **Corrections are cheap, waiting is expensive** | Merge fast, fix fast. Don't block on perfection. |
| **Repository is the system of record** | If it's not in the repo, it doesn't exist for the agent. Slack discussions, design decisions, tacit knowledge — push it all into files. |
| **Progressive disclosure** | The entry point (`CLAUDE.md`) is a ~60-line table of contents. Agents are taught where to look, not given everything upfront. |
| **Continuous garbage collection** | Pay down tech debt in small increments, not painful bursts. |
| **Parallelism over sequencing** | Multiple agents working concurrently outperform a single agent in series. |

---

## Architecture Overview

The system consists of three layers:

```
                        ┌──────────────────────────────┐
                        │      Human (You)              │
                        │  - Trigger commands            │
                        │  - Set priorities in backlog   │
                        │  - Review/approve when needed  │
                        └──────────────┬───────────────┘
                                       │
                        ┌──────────────▼───────────────┐
                        │   Claude Code (AI Agent)      │
                        │  - Reads backlog               │
                        │  - Implements features          │
                        │  - Runs validation              │
                        │  - Creates PRs                  │
                        │  - Self-reviews                 │
                        │  - Merges & does bookkeeping    │
                        └──────────────┬───────────────┘
                                       │
                        ┌──────────────▼───────────────┐
                        │   Repository (Source of Truth) │
                        │  - CLAUDE.md (entry point)     │
                        │  - docs/ (conventions, guides)  │
                        │  - tech-debt-tracker.md (backlog)│
                        │  - ESLint rules (enforced taste) │
                        │  - Architecture tests            │
                        └──────────────────────────────┘
```

**Key insight**: The repository is the interface between humans and agents. Humans encode their standards, preferences, and priorities into repository files. Agents read those files and execute accordingly.

---

## Prerequisites

- **Claude Code CLI** installed and authenticated
- **GitHub CLI** (`gh`) authenticated with repo access
- **Node.js** and project dependencies installed
- Custom commands placed in `.claude/commands/` directory
- A task backlog file (e.g., `docs/exec-plans/tech-debt-tracker.md`)
- A maintenance cadence tracker (e.g., `docs/exec-plans/maintenance-cadence.json`)

---

## The Development Lifecycle

Every feature follows this end-to-end pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  Phase 0     Phase 1      Phase 2       Phase 3        Phase 4              │
│  Concurrency → Task      → Context    → Branch &     → Implementation      │
│  Setup         Selection   Gathering     Planning                           │
│                                                                             │
│  Phase 5      Phase 6      Phase 7      Phase 8       Phase 9               │
│  Validation → Playwright → Commit &   → CI Monitor → Self-Review           │
│  Suite        Deep Test     PR Create    & Fix Loop    (4 agents)           │
│                                                                             │
│  Phase 9b     Phase 10     Phase 11     Phase 12                            │
│  Root Cause → Auto-Merge → Bookkeeping → Maintenance                       │
│  Analysis     (if clean)    (post-merge)  Cadence Check                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

The entire pipeline — from picking a task to merging the PR — runs autonomously. Human intervention is only needed when the agent hits a hard blocker it cannot resolve after its retry budget.

---

## Command Reference

### `/develop-feature` — Autonomous Feature Development

**Purpose**: Pick a task from the backlog, implement it end-to-end, create a PR, pass CI, self-review, and merge — all autonomously.

**Usage**:
```
/develop-feature           # Pick the next highest-priority task
/develop-feature F-M15     # Implement a specific task by ID
```

**Phases in detail**:

| Phase | Name | What Happens |
|-------|------|-------------|
| **0** | Concurrency Setup | Registers in `active-work.json`, allocates unique dev server ports, cleans stale sessions |
| **1** | Task Selection | Reads the backlog, picks the highest-priority `todo` task (skipping tasks claimed by other agents) |
| **2** | Context Gathering | Reads architecture docs, conventions, security model, and source files relevant to the task |
| **3** | Branch & Plan | Creates a feature branch. For tasks > 1 day: writes a formal execution plan with acceptance criteria |
| **4** | Implementation | Writes code and tests following project patterns. Updates the execution plan as decisions are made |
| **5** | Validation | Runs lint, typecheck, tests, build. Checks for unstaged dependencies. Retries up to 3 times per check |
| **6** | Playwright Deep Test | Starts dev servers on allocated ports, runs browser-based validation (accessibility snapshot, console errors, network requests, screenshots). Kills only its own servers |
| **7** | Commit & PR | Stages files explicitly (never `git add .`), commits, pushes, creates PR with template |
| **8** | CI Monitor | Watches CI with `gh pr checks --watch`. If CI fails: reads logs, fixes code, pushes, retries (max 3 cycles). Launches self-review in parallel |
| **9** | Self-Review | 4 specialized review agents run in parallel (Security, Quality, i18n, Testing). Produces a `VERDICT: APPROVE` or `VERDICT: REQUEST_CHANGES`. If changes requested: fix, push, re-run CI, re-review (max 2 cycles) |
| **9b** | Root Cause Analysis | Only activates if Phase 9 had REQUEST_CHANGES. Classifies the mistake by root cause category, writes to learning memory, and promotes fixes if patterns recur |
| **10** | Auto-Merge | Checks mergeability, handles conflicts (rebases for bookkeeping files, stops for source conflicts), squash-merges, deletes branch |
| **11** | Bookkeeping | Marks task as `done` in the backlog, moves execution plans to `completed/`, unregisters from active-work |
| **12** | Maintenance Check | Increments cadence counters, launches maintenance tasks (sweep, audit, retrospective) if thresholds are met |

**Retry budgets (hard limits)**:
- Validation retries: 3 per check
- CI fix cycles: 3
- Review-fix cycles: 2
- If any limit is exhausted, the agent stops and reports the blocker

---

### `/validate` — Validation Suite

**Purpose**: Run the full quality gate before creating a PR. This is the same suite that CI runs.

**Usage**:
```
/validate
```

**Checks performed (in order)**:

| # | Check | Command |
|---|-------|---------|
| 1 | Backend Lint | `npm run lint:backend` (includes auto-fix) |
| 2 | Frontend Lint | `npm run lint:frontend` |
| 3 | Backend Typecheck | `npm run typecheck:backend` |
| 4 | Frontend Typecheck | `npm run typecheck:frontend` |
| 5 | Backend Tests | `npm run test:backend` |
| 6 | Frontend Tests | `npm run test:frontend` |
| 7 | Backend Build | `cd backend && npm run build` |
| 8 | Frontend Build | `cd frontend && npm run build` |
| 9 | Staged Completeness | Ensures all imported files are staged for commit |

**Staged Completeness Check** — This prevents the #1 CI failure: files that exist locally (so `tsc` passes on your machine) but aren't committed (so CI `tsc` fails with "Cannot find module"). The check scans `git status` for untracked or unstaged files that are imported by changed files.

**Output**: A summary table with PASS/FAIL for each check.

---

### `/review-pr` — Multi-Agent Self-Review

**Purpose**: Review a PR from 4 specialized perspectives simultaneously. Produces a machine-readable verdict used by the autonomous pipeline.

**Usage**:
```
/review-pr          # Review current branch's diff against main
/review-pr 42       # Review PR #42
```

**4 Review Agents (run in parallel)**:

| Agent | Focus Area | What It Checks |
|-------|-----------|----------------|
| **Security** | Vulnerabilities | Secrets/API keys, input validation, path traversal, XSS, error leakage |
| **Quality** | Code standards | Unused imports, `any` types, error handling, cross-module imports, file/function size limits, copy-paste drift |
| **i18n & Patterns** | UI compliance | All strings use `t()`, keys in all locale files, MUI components (no raw HTML), theme tokens (no hardcoded colors) |
| **Testing** | Test coverage | New functionality has tests, edge cases covered, no flaky patterns, architecture tests intact |

**Severity levels**:
- `critical` — Must fix before merge (blocks verdict)
- `warning` — Should fix before merge (blocks verdict)
- `suggestion` — Nice to have, does not block merge

**Verdict**:
- `VERDICT: APPROVE` — 0 blocking issues (critical + warning)
- `VERDICT: REQUEST_CHANGES` — 1+ blocking issues found

Each finding includes a **root cause hint** explaining why the mistake likely happened, so the fixing agent (or human) can address the systemic issue, not just the symptom.

---

### `/audit-service` — Codebase Audit

**Purpose**: Comprehensive health check of the entire codebase. Updates metrics, identifies new tech debt, and checks for security vulnerabilities.

**Usage**:
```
/audit-service
```

**What it does**:

1. **Automated checks**: `npm audit`, `npm outdated`, lint, typecheck, tests, bundle sizes
2. **Code quality scan**: Anti-patterns, missing error handling, hardcoded values, security issues, i18n gaps, dead code
3. **Updates `QUALITY_SCORE.md`**: Fresh test counts, lint status, type errors, bundle sizes, dependency health
4. **Updates DB schema docs**: Regenerates schema documentation from actual TypeScript interfaces
5. **Updates tech debt tracker**: Marks completed items as done, adds newly discovered issues
6. **Creates a PR** with all documentation updates

**Output**: A health assessment (healthy / needs attention / critical) with metrics trends and top 3 recommended actions.

**Cadence**: Automatically every 5 features (or run manually anytime).

---

### `/sweep` — Golden Principles Enforcement

**Purpose**: Scan the codebase for deviations from established standards. Auto-fix what's safe, track what needs design.

**Usage**:
```
/sweep
```

**Scan categories**:

| Category | Examples |
|----------|---------|
| **Code Quality** | Files > 300 lines, functions > 50 lines, `any` types, `console.log`, unused imports |
| **i18n** | Hardcoded user-facing strings, missing locale keys, locale sync mismatches |
| **Security** | Hardcoded URLs/secrets, unsanitized content, missing input validation |
| **Patterns** | Raw HTML instead of component library, hardcoded colors instead of theme tokens, direct DB access |
| **Architecture** | Cross-module imports, business logic in controllers, services importing transport types |

**Finding classification**:

| Type | Action | Example |
|------|--------|---------|
| **Auto-fix** | Fixed immediately in a micro-PR | Missing i18n keys, unused imports |
| **Simple fix** | Added to backlog as `medium` priority | Type annotations, error handling |
| **Needs design** | Added to backlog as `low` priority | Module restructuring, file splitting |

**Each auto-fix PR is designed to be reviewable in under 1 minute.**

**Cadence**: Automatically every 3 features (or run manually anytime).

---

### `/doc-garden` — Documentation Gardening

**Purpose**: Scan for stale, broken, or inconsistent documentation and auto-fix it.

**Usage**:
```
/doc-garden
```

**Checks performed**:

| Check | What It Does |
|-------|-------------|
| **Structural Integrity** | Verifies all files referenced in `CLAUDE.md` actually exist on disk |
| **Architecture vs Reality** | Compares documented modules to actual directory structure |
| **DB Schema Freshness** | Compares documented schema to actual TypeScript interfaces |
| **Quality Score Staleness** | Re-runs metrics and compares to documented values |
| **Tech Debt Consistency** | Verifies `done` tasks are actually fixed, and `todo` tasks aren't already addressed |
| **Cross-Link Validation** | Checks all relative markdown links resolve to existing files |
| **Core Beliefs vs Practice** | Spot-checks random code against documented engineering principles |

**Output**: A report with counts per category. If issues found, creates a fix-up PR.

**Cadence**: Runs automatically after every audit. Can be run manually anytime.

---

### `/retrospective` — Workflow Self-Improvement

**Purpose**: Analyze recent development patterns and **promote recurring issues into mechanical enforcement** (lint rules, architecture tests, CI checks).

**Usage**:
```
/retrospective
```

**This is the most critical command for long-term quality.** It closes the feedback loop:

```
Review finding (human taste) → Repeated pattern (3+ occurrences) → Promoted to rule → Enforced forever
```

**Process**:

1. **Gather data**: Reads the last 10 merged PRs, quality metrics, tech debt tracker, and learning memory
2. **Analyze patterns**: Looks for repeated review issues, scope problems, test gaps, validation failures
3. **Promote findings into code**:

| If the pattern is... | It gets promoted to... |
|---------------------|----------------------|
| A code style violation | ESLint rule (`no-restricted-syntax` with remediation message) |
| An architectural violation | Structural test in `architecture.spec.ts` |
| A process violation | CI check or command workflow update |
| A documentation gap | Updated docs with pointer from `CLAUDE.md` |

4. **Update learning memory**: Writes successful patterns to `patterns.md` and mistakes to `pitfalls.md`
5. **Report**: PRs analyzed, patterns found, rules promoted, improvements applied

**The key insight**: ESLint rule error messages are agent prompts. When the agent encounters a lint error, the message tells it exactly how to fix the issue. Human taste is encoded once, then enforced on every line of code, forever.

**Cadence**: Automatically every 10 features (or run manually anytime).

---

### `/i18n-dev` — Internationalization Guidelines

**Purpose**: Reference guide for adding user-facing strings. Not an autonomous workflow — it provides rules and patterns to follow.

**Usage**:
```
/i18n-dev
```

**Key rules**:
- All user-facing strings must use `t()` from the i18n library
- New keys must be added to **all locale files** simultaneously
- Use dot-separated namespaces for key naming (`sidebar.*`, `chat.*`, `errors.*`)
- Use `{{variable}}` interpolation syntax for dynamic values
- In non-UI modules (utilities, API clients) that lack i18n access, accept translated strings as parameters — don't hardcode them

---

## Maintenance Cadence

Maintenance tasks run automatically, triggered by feature count thresholds:

| Task | Trigger | What Happens |
|------|---------|-------------|
| `/sweep` | Every **3** features merged | Scans for code deviations, creates micro-fix PRs |
| `/audit-service` + `/doc-garden` | Every **5** features merged | Full codebase health check + documentation freshness scan |
| `/retrospective` | Every **10** features merged | Analyzes patterns, promotes findings to lint rules/tests |

### How it works

State is tracked in `maintenance-cadence.json`:

```json
{
  "counters": {
    "features_since_last_sweep": 2,
    "features_since_last_audit": 4,
    "features_since_last_retrospective": 8
  },
  "thresholds": {
    "sweep_every_n_features": 3,
    "audit_every_n_features": 5,
    "retrospective_every_n_features": 10
  }
}
```

After every feature merge, Phase 12 of `/develop-feature`:
1. Increments all counters
2. Checks if any counter >= its threshold
3. If yes: resets the counter, launches the maintenance task as a **background agent**
4. The maintenance agent runs independently — it reads its command file and executes

**Thresholds are tunable**: edit the `thresholds` object to change trigger points for your team's needs.

**Crash recovery**: If a session crashes before launching maintenance, the due tasks are saved in `pending_runs`. The next `/develop-feature` run will detect and launch them.

---

## Parallel Agent Execution

Multiple `/develop-feature` agents can run concurrently in separate terminals.

### How conflicts are avoided

| Resource | Mechanism |
|----------|-----------|
| **Task selection** | `active-work.json` registry — agents skip tasks claimed by others |
| **Dev server ports** | Port allocation by slot (slot 0: 3001/5173, slot 1: 3002/5174, ...) |
| **Server cleanup** | Port-specific `lsof` commands — each agent kills only its own servers |
| **Merge conflicts** | If merge fails due to concurrent PR, agent rebases and retries (bookkeeping files only — stops for source conflicts) |
| **Stale sessions** | Dead PIDs and sessions > 24h are auto-cleaned |

### Running agents in parallel

Open two (or more) terminals:

```bash
# Terminal 1
/develop-feature

# Terminal 2
/develop-feature
```

Agent 1 takes slot 0 (ports 3001/5173) and picks the highest-priority task. Agent 2 takes slot 1 (ports 3002/5174) and picks the next available task. They work independently.

---

## The Self-Improvement Loop

The most powerful aspect of this workflow is that **it improves itself over time**:

```
    ┌─────────────────────────────────────────────────────────┐
    │                                                         │
    │  /develop-feature                                       │
    │       │                                                 │
    │       ▼                                                 │
    │  Implement → Validate → Review → Merge                  │
    │       │                    │                             │
    │       │              Findings logged                     │
    │       │                    │                             │
    │       │                    ▼                             │
    │       │              /retrospective                      │
    │       │              (every 10 features)                 │
    │       │                    │                             │
    │       │              Promote to:                         │
    │       │              - ESLint rules                      │
    │       │              - Architecture tests                │
    │       │              - CI checks                         │
    │       │                    │                             │
    │       │                    ▼                             │
    │       │              Rules catch issues                  │
    │       │              earlier next time                   │
    │       │                    │                             │
    │       └────────────────────┘                             │
    │                                                         │
    │  /sweep (every 3 features)                               │
    │  → Enforces standards, creates micro-fix PRs             │
    │                                                         │
    │  /audit-service (every 5 features)                       │
    │  → Health check, metrics update, tech debt discovery     │
    │                                                         │
    │  /doc-garden (after every audit)                          │
    │  → Keeps documentation in sync with reality              │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
```

**Feedback loop tiers**:

| Tier | When | What | Outcome |
|------|------|------|---------|
| **Immediate** | During a feature (Phase 9b) | Root cause analysis of review findings | Written to learning memory, may update agent prompts |
| **Short-cycle** | Every 3 features (sweep) | Code deviation scan | Auto-fix PRs, new backlog items |
| **Medium-cycle** | Every 5 features (audit) | Full health check | Updated metrics, new discoveries |
| **Long-cycle** | Every 10 features (retrospective) | Pattern analysis | Promoted lint rules, architecture tests, CI checks |

Over time, the system catches issues earlier and earlier — eventually at lint time rather than review time.

---

## Key Files & Configuration

| File | Purpose | Committed? |
|------|---------|-----------|
| `CLAUDE.md` | Entry point for the agent. Table of contents to all docs (~60 lines) | Yes |
| `docs/CONVENTIONS.md` | Code standards and git conventions | Yes |
| `docs/WORKFLOW.md` | Workflow overview and command reference | Yes |
| `docs/QUALITY_SCORE.md` | Quality metrics dashboard (updated by audit/sweep) | Yes |
| `docs/design-docs/core-beliefs.md` | Engineering principles | Yes |
| `docs/exec-plans/tech-debt-tracker.md` | Machine-readable task backlog | Yes |
| `docs/exec-plans/maintenance-cadence.json` | Cadence counters and thresholds | Yes |
| `docs/exec-plans/active-work.json` | Active agent registry (runtime state) | No (gitignored) |
| `.claude/commands/*.md` | Command definitions (one per command) | Yes |
| `.claude/projects/.../memory/*.md` | Agent learning memory (patterns, pitfalls) | No (local) |

---

## Adapting to a New Project

To bring this workflow to a new project:

### 1. Create the entry point

Create a `CLAUDE.md` at the repo root. Keep it short (~60 lines). It should be a table of contents pointing to deeper docs, not a comprehensive manual.

### 2. Set up the command files

Copy `.claude/commands/` and adapt each command to your project:
- Update file paths, module names, and tech stack references
- Update lint/typecheck/test/build commands for your stack
- Update port numbers and dev server start commands

### 3. Create the backlog

Create a `tech-debt-tracker.md` with the format:
```markdown
| ID | Task | Area | Effort | Status | Notes |
|----|------|------|--------|--------|-------|
| B-H1 | Add input validation | backend | 1d | todo | |
```

Use a consistent ID scheme: `{Area}-{Priority}{Number}` (e.g., `B-H1` = Backend, High priority, #1).

### 4. Create the maintenance cadence file

```json
{
  "schema_version": 1,
  "counters": {
    "features_since_last_sweep": 0,
    "features_since_last_audit": 0,
    "features_since_last_retrospective": 0
  },
  "thresholds": {
    "sweep_every_n_features": 3,
    "audit_every_n_features": 5,
    "retrospective_every_n_features": 10
  },
  "pending_runs": [],
  "last_runs": {
    "sweep": "2026-01-01",
    "audit": "2026-01-01",
    "retrospective": "2026-01-01"
  },
  "last_updated": "2026-01-01"
}
```

### 5. Write your conventions

Create `docs/CONVENTIONS.md` covering:
- Code standards (testing, logging, validation, error handling)
- Git conventions (branch naming, commit messages, staging rules)
- Architecture rules (what's enforced mechanically by lint/tests)

### 6. Set up quality tracking

Create `docs/QUALITY_SCORE.md` as a dashboard. The audit and sweep commands will keep it updated.

### 7. Write your core beliefs

Create `docs/design-docs/core-beliefs.md` — your team's engineering principles. These guide review agents and retrospective analysis.

### 8. Configure your validation pipeline

Ensure `npm run validate` (or equivalent) runs: lint, typecheck, tests, and build. This is the quality gate that everything passes through.

---

## FAQ

**Q: Can I run commands manually without the full pipeline?**
A: Yes. Every command works standalone. `/validate` before a PR, `/sweep` for a quick cleanup, `/audit-service` for a health check. The full pipeline is `/develop-feature`.

**Q: What if the agent gets stuck?**
A: The agent has hard retry limits on every phase. If it exhausts retries, it stops and reports the blocker. You then fix the environment (not the agent) and re-run.

**Q: How do I change maintenance frequency?**
A: Edit `thresholds` in `maintenance-cadence.json`. Lower numbers = more frequent maintenance.

**Q: Can I skip maintenance tasks?**
A: Set `pending_runs` to `[]` and the counter to 0 in `maintenance-cadence.json`. Commit and push.

**Q: What if two agents pick the same task?**
A: The `active-work.json` registry prevents this. Each agent checks the registry before selecting a task and skips anything already claimed.

**Q: How do I add a new maintenance task type?**
A: Create a new command file in `.claude/commands/`, add a counter and threshold to `maintenance-cadence.json`, and update Phase 12 of `/develop-feature` to launch it.

**Q: Does this work with other AI coding tools?**
A: The architecture (repo-as-interface, backlog-driven, lint-as-enforcement) is universal. The command files (`.claude/commands/`) are specific to Claude Code but the patterns can be adapted to any agent framework.
