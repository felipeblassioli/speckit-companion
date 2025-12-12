# Audit Cursor Commands — quality, safety, consistency, and improvement plan

You are auditing the project’s Cursor slash commands stored in `.cursor/commands/*.md`.

Goal: produce a high-signal report that identifies weak commands, risky commands, duplicated commands, and concrete edits to improve quality and reliability.

## Scope (MUST)
- `.cursor/commands/**/*.md`
- (If present) any team-shared command references in docs (e.g., `AGENTS.md`, `README.md`, `.cursor/rules/**`, internal “constitution” files)

## Output format (MUST)
Produce a single Markdown report with these sections:

### 1) Inventory
For every command file:
- Path
- One-line intent summary (what a human thinks it does)
- Approx size (#lines)
- Primary “mode” classification (choose one):
  - Analysis-only (no edits)
  - Code changes (edits)
  - Terminal-heavy (expects running commands)
  - Mixed / unclear

### 2) Findings (prioritized)
Use severity buckets:
- P0: dangerous / likely to cause data loss, security issues, or runaway edits
- P1: high-impact quality problems (ambiguity, nondeterminism, inconsistent outputs)
- P2: maintainability / style / nice-to-have

Each finding MUST include:
- Evidence: file path + exact excerpt
- Why it matters (agent behavior impact)
- Concrete fix (what to change, with suggested wording)

### 3) Command Quality Scorecard (0–5 per category)
Score EACH command and justify:
- Clarity & actionability
- Scope tightness (single objective vs “do everything”)
- Determinism (steps + outputs are reproducible)
- Safety guardrails (destructive ops, secrets, approvals)
- Verification/validation steps present
- Consistency with repo rules (lint/test conventions, naming, architecture)

### 4) Consolidation & refactor plan
Propose a minimal-change plan:
- Which commands should be split (and into what smaller commands)
- Which commands should be merged (and why)
- Which commands should be renamed for discoverability
- Which commands should be marked “analysis-only” vs “edits allowed”
- Recommend a consistent command template for the repo

### 5) Suggested patches (NO auto-edit)
Provide patch-style improvements as “before/after” blocks.
Do NOT apply edits unless the user explicitly asks.

---

## Audit checks (MUST run all)

### A) Discoverability + naming
- Flag filenames that are vague (`fix.md`, `do-stuff.md`) → propose descriptive names.
- Flag collisions/overlaps: multiple commands doing the same workflow.
- Flag “too broad” commands that encourage sweeping edits.
- Flag “hidden” commands (e.g., in subfolders) if they appear intended as slash commands.

### B) Structure and completeness
For each command, check for presence (or recommend adding) these sections:
- Objective (what “done” means)
- Inputs / assumptions (what the user must provide; what context the agent must collect)
- Constraints (what not to do, scope boundaries)
- Steps (ordered, numbered; include when to stop)
- Output format (exact structure)
- Verification (how to confirm success; tests/commands to run)
- Safety notes (destructive ops; secrets; approvals)

If missing, recommend adding in the smallest possible way.

### C) Safety & guardrails (P0 if violated)
Flag commands that:
- Instruct pasting secrets/tokens/keys
- Include destructive shell sequences (`rm -rf`, `git reset --hard`, `terraform apply`, `kubectl delete`, database drops) without explicit guardrails
- Encourage “YOLO” / unreviewed mass edits
- Request network access for sensitive operations
- Modify CI/CD, IAM, infra, or prod configs without verification + rollback steps

For terminal-heavy commands, require these guardrails:
- “Print the exact command(s) first”
- “Ask for user confirmation before running”
- “Prefer read-only probes before mutations”
- “Provide rollback instructions”

### D) Determinism & acceptance criteria
- Replace vague phrasing (“improve”, “clean up”, “refactor”) with:
  - explicit acceptance criteria
  - explicit stop conditions (how far to go, what not to touch)
- Ensure multi-step workflows include a checkpoint:
  - plan → execute → verify

### E) Consistency with repo governance
- Commands must not conflict with `.cursor/rules` (naming conventions, test policy, linting).
- Prefer commands that reference canonical scripts (`npm run test`, `nx test`, `task test`, etc.) rather than inventing new flows.
- If the repo has multiple stacks (e.g., apps vs libs), require commands to scope to a target project/package.

---

## Standard command template (use for recommendations)
When suggesting improvements, align toward this structure:

# <Command Title>
One sentence: what it does.

## Objective
- Bullet list of “done means …”

## Inputs / assumptions
- What user provides
- What files/dirs to inspect

## Constraints
- Hard boundaries (what not to change)
- Risk constraints (no secrets, no destructive ops)

## Steps
1. Context gathering
2. Analysis
3. Proposed plan (brief)
4. Execute (if allowed)
5. Verify (commands/tests)
6. Summarize (what changed, why)

## Output format
- Exact headings + any required tables

## Verification
- What to run / check

## Rollback
- How to undo safely (if applicable)

---

Start by producing the Inventory, then Findings, then Scorecard, then Plan, then Suggested patches.
