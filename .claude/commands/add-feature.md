# Interactive Backlog Intake

You are an interactive intake agent. Your job is to help a human add a well-structured task (feature, bug fix, or tech debt) to `docs/exec-plans/tech-debt-tracker.md` — the single source of truth for all work.

## Input
$ARGUMENTS — Optional: a short description of the feature or task. If empty, ask the user to describe what they want.

## Workflow

### Phase 0: Context Loading & Pre-Flight

1. **Working tree check**: Run `git status --short`. If there are uncommitted changes on main, warn the user: "You have uncommitted changes on main. Please commit or stash them first." Do not proceed until the working tree is clean (untracked files are fine).
2. Load the sources of truth silently (do not dump contents to the user):
   - Read `docs/PRODUCT_SENSE.md` — design principles and personas
   - Read `docs/exec-plans/tech-debt-tracker.md` — current backlog (all sections)
   - Read `docs/PLANS.md` — roadmap phases
   - Read `docs/design-docs/core-beliefs.md` — engineering principles

### Phase 1: Intake Interview

1. If `$ARGUMENTS` is empty, ask: "What would you like to add to the backlog?"
2. Parse the user's description. Identify what information is already provided vs. missing.
3. **Ask clarifying questions in a single batch** using AskUserQuestion. Only ask questions whose answers aren't already obvious from the description. Typical questions (skip any that are already answered):
   - What problem does this solve? (if the description is vague)
   - Which area does this affect — backend, frontend, or fullstack?
   - Is this a new feature, a bug fix, or tech debt cleanup?
   - Any specific acceptance criteria?
4. **Design principle check** (non-blocking warnings): Evaluate the proposal against the 5 design principles from `PRODUCT_SENSE.md`:
   - Simple first — Does this add unnecessary complexity?
   - Self-hosted friendly — Does this introduce external service dependencies?
   - Model agnostic — Does this tie to a specific LLM provider?
   - Privacy by default — Does this leak data or add telemetry?
   - Keyboard first — Is this action keyboard-accessible?
   If any principle is at tension, mention it as a brief warning (e.g., "Note: this would add an external dependency — consider a self-hosted alternative"). Do NOT block on warnings.

### Phase 2: Duplicate Check

1. Search `tech-debt-tracker.md` for semantic duplicates or overlaps:
   - Exact ID match (if user mentioned one)
   - Similar task descriptions (keyword + intent match)
   - Tasks that would be partially or fully addressed by the proposal
2. If duplicates found:
   - Show the matching entries with their IDs and status
   - Ask: "This overlaps with existing task(s). Would you like to: (a) update the existing task, (b) create a new separate task, or (c) cancel?"
   - If updating, ask what to change (description, effort, priority, notes, or status), apply changes to the existing row, then proceed to Phase 5 with the modified entry
3. If no duplicates, proceed normally

### Phase 3: Classification

Determine the task's metadata:

1. **Type and ID prefix**:
   - `FEAT-#` — New user-facing feature (area = fullstack or any)
   - `B-#` — Backend task (bug fix, refactor, tech debt). Sub-prefix by priority: `B-C#` (critical), `B-H#` (high), `B-M#` (medium), `B-L#` (low)
   - `F-#` — Frontend task. Same sub-prefix pattern: `F-C#`, `F-H#`, `F-M#`, `F-L#`
   - For fullstack tech debt (not a feature), create separate `B-#` and `F-#` entries — one per layer. Only `FEAT-#` entries use area=fullstack as a single row.

2. **Priority section**: critical, high, medium, low, or features — based on:
   - Is it blocking production use? → critical
   - High impact, clear need? → high
   - Improves quality but not urgent? → medium
   - Nice-to-have polish? → low
   - New user-facing capability? → features

3. **Area**: backend, frontend, fullstack, infra

4. **Effort estimate** — calibrate against completed tasks in the tracker (loaded in Phase 0). Use this scale and cite 1-2 completed tasks at the same effort level as justification:
   | Effort | Guideline |
   |--------|-----------|
   | 0.1d | Config/doc-only changes |
   | 0.25d | Single-file fixes, adding attributes |
   | 0.5d | New hook/service, moderate refactor |
   | 1d | New module, significant feature |
   | 2d | Multi-module feature |
   | 3d+ | Cross-cutting feature |
   | 5d | Major feature |

5. **Subtask decomposition**: If effort is 3d or more, suggest breaking into subtasks (like B-C1 → B-C1a, B-C1b, B-C1c). Ask the user if they want subtasks now or later.

### Phase 4: ID Generation

1. Scan `tech-debt-tracker.md` for all existing IDs in the relevant prefix group
2. Determine the next available number. Each sub-prefix is an independent numeric sequence:
   - For `FEAT-#`: find the highest FEAT number, add 1
   - For `B-{P}#` or `F-{P}#`: scan only IDs matching the exact sub-prefix (e.g., `B-L`), find the highest number, add 1
   - Example: if B-L9 exists and B-M10 exists → next B-L is B-L10 (not B-L11)
   - Example: if FEAT-10 exists → next is FEAT-11
3. **Subtask IDs** (if Phase 3 step 5 triggered decomposition):
   - Generate the parent ID normally (steps 1-2 above)
   - Append lowercase letters: `{parent}a`, `{parent}b`, `{parent}c`, etc.
   - The parent row is also created as a summary row (effort = sum of subtasks)
4. Display the generated ID(s) for confirmation

### Phase 5: Entry Composition

1. Format the table row matching the tracker format:
   ```
   | {ID} | {Task description} | {area} | {effort} | todo | {notes} |
   ```
2. If the task is a feature (FEAT-#), also ask: "Should this be added to the roadmap in `docs/PLANS.md`?" If yes, add it to the relevant phase section.
3. **Present the complete entry to the user for confirmation** before writing:
   - Show the formatted row
   - Show which section it will be inserted into
   - Show the PLANS.md addition if applicable
   - Ask: "Does this look right? Any changes before I write it?"
4. If the user requests changes, adjust and re-confirm

### Phase 6: Write & Commit

1. Edit `docs/exec-plans/tech-debt-tracker.md`:
   - Insert the new row at the end of the appropriate priority section table
   - If subtasks were created, insert all rows together
2. If applicable, edit `docs/PLANS.md` to add the feature to the relevant phase
3. Stage files explicitly by name (never `git add .`):
   ```bash
   git add docs/exec-plans/tech-debt-tracker.md
   git add docs/PLANS.md  # only if modified
   ```
4. Commit directly to main (bookkeeping-style, same as develop-feature Phase 11):
   ```bash
   git commit -m "chore: add {ID} to backlog — {short description}"
   ```
5. Push to main: `git push origin main`
   - If push fails (non-fast-forward), run `git pull --rebase origin main`, re-read `tech-debt-tracker.md`, verify the ID is still unique, regenerate if needed, and retry push (max 1 retry)
6. Confirm success: "Added {ID} to the backlog. Run `/develop-feature {ID}` to implement it."

## Important Rules
- Ask clarifying questions in a **single batch**, not one at a time
- Design principle violations are **warnings**, not blockers
- Always present the entry for user confirmation before writing
- Stage files explicitly — never `git add .` or `git add -A`
- Commit directly to main (this is bookkeeping, not a feature change)
- If the user wants to update an existing task instead of creating a new one, handle that gracefully
