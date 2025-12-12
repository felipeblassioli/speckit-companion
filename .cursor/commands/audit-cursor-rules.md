# Audit Cursor Rules (v2.2) — quality, conflicts, scoping, and improvements

You are auditing the project’s Cursor configuration with a focus on:
- Correctness (format + metadata + discoverability)
- Load-efficiency (avoid bloated Always rules / overly broad auto-attach)
- Clarity (actionable instructions, minimal ambiguity)
- Maintainability (composable rules, clear ownership, minimal duplication)
- Safety (no secrets, no unsafe shell guidance)

## Scope to audit (MUST)
1) Rules:
   - `.cursor/rules/**/*.mdc`
   - `.cursor/rules/**/RULE.md` (folder-based rule format)
   - `AGENTS.md` (if present)
   - `.cursorrules` (if present; legacy)
2) Commands:
   - `.cursor/commands/*.md`

## Output format (MUST)
Produce a single report in Markdown with these sections:

### 1. Inventory
- List every discovered rule and command with:
  - Path
  - Detected type (Always / Auto-attached / Agent-requested / Manual) when inferable
  - Detected trigger (globs/path scope/manual invocation) when inferable
  - Approx size (#lines)

### 2. Findings (prioritized)
Use severity buckets: P0 (breaks or dangerous), P1 (high impact), P2 (nice-to-have).
Each finding MUST include:
- Evidence: file path + the exact snippet/line(s) you’re reacting to
- Why it matters (impact on agent behavior or token load)
- Concrete fix recommendation (what to change)

### 3. Rule Quality Scorecard (0–5)
Score and justify each rule across:
- Scope tightness
- Actionability
- Consistency with other rules
- Load-efficiency
- Example/template presence
- Verification steps

### 4. Consolidation & Refactor Plan
Propose a minimal-change plan:
- Which rules should be split (and into what)
- Which rules should be merged (and why)
- Which rules should be downgraded from Always → Auto-attached/Manual
- Recommended folder scoping using nested `.cursor/rules/` directories

### 5. Suggested patches (NO auto-edit)
Provide patch-style suggestions as “before/after” blocks.
Do NOT apply edits unless the user explicitly asks.

---

## Audit checks (MUST run all)

### A) Format + compatibility checks
1) For `.mdc` rules:
   - Validate YAML frontmatter exists and parses.
   - Check for `description`, `globs`, `alwaysApply`.
   - Flag empty/malformed frontmatter.
2) For folder-based rules:
   - Detect rule folders containing `RULE.md`.
   - Validate `RULE.md` has frontmatter metadata (if present in this project) and consistent naming.
3) Cross-compat:
   - If both formats exist, note which appears primary and recommend a safe compatibility approach.

### B) Type/trigger sanity checks
- If a rule is effectively “Always”, ensure it is small and truly cross-cutting.
- If a rule is auto-attached:
  - Globs must be specific (avoid `**/*` unless intentional).
  - Confirm it attaches to the files it claims.
- If a rule is agent-requested/manual:
  - Ensure the description is precise and helps the agent select it.

### C) Content quality checks
- Vague language (“try to”, “usually”, “as needed”) → rewrite into testable directives.
- Missing examples/templates where they would reduce ambiguity → recommend adding.
- Missing “verification steps” for workflows → recommend adding.
- Conflicting instructions across rules → propose a single source of truth.
- Duplicated content across rules → propose dedupe + shared “core” rule.

### D) Safety & hygiene checks
- Secrets: flag any tokens/keys/credentials or instructions to paste secrets.
- Shell commands: flag destructive commands without guardrails.
- Dependency drift: flag instructions that pin outdated paths/scripts that no longer exist.

### E) Commands quality checks
For each command in `.cursor/commands`:
- Is the goal clear?
- Are inputs/assumptions explicit?
- Does it specify outputs and a verification checklist?
- Does it avoid destructive steps unless explicitly asked?

---

## Minimal assumptions
- Do not assume a single rule format is “the one true way”; audit what exists.
- Prefer recommendations that preserve behavior unless there is a clear defect.

Begin by listing the inventory, then run the checks, then produce the final report.
