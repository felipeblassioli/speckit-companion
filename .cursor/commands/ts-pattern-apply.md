---
name: /ts-pattern-apply
summary: Safely apply a selected software/architectural design pattern to a TypeScript codebase with incremental, reversible changes.
description: Use after /pattern-review (or an explicit pattern choice) to implement the smallest viable version of the pattern in a TypeScript backend. Strong guardrails: scoped edits, tiny commits, verification at each step, and hard stop conditions.
alwaysApply: false
---

# /ts-pattern-apply — TypeScript Pattern Application (Safety-First)

## Objective (what “done” means)
- The selected pattern is applied in a **minimal viable form** that solves the stated forces.
- Changes are **scoped**, **reviewable**, and **reversible**.
- Typecheck + lint + tests (or best available verification) **pass**.
- A short **migration note** exists (what changed, why, how to extend).

---

## Required inputs
Provide at least one of:
- **pattern=<name>** (e.g., `strategy`, `ports-and-adapters`, `decorator`, `cqrs-lite`)
- **target=<path>** (file/dir/project) where the change should live
- The **Recommendation** section from `/pattern-review` (preferred)

Optional:
- `mode=scaffold|migrate|finish` (default: `scaffold`)
- `max_files=8` (default: 8)
- `max_loc=250` (default: 250 net new/changed LOC)
- `allow_behavior_change=false` (default: false)
- `allow_public_api_change=false` (default: false)
- `allow_dependency_change=false` (default: false)
- `verification=auto|nx|npm|pnpm|yarn|none` (default: `auto`)

If key inputs are missing, proceed with explicit assumptions and keep changes **scaffold-only**.

---

## Safety guardrails (hard rules)
1. **Default to scaffold-only** (`mode=scaffold`): create seams/abstractions without changing runtime behavior.
2. **No sweeping refactors**: stop if changes exceed `max_files` or `max_loc`.
3. **No public API breaks** unless `allow_public_api_change=true`.
4. **No behavior changes** unless `allow_behavior_change=true`.
5. **No new deps** unless `allow_dependency_change=true`.
6. **No mass renames/moves** (limit to at most 2 files moved/renamed).
7. **Never touch secrets/credentials** and never ask for them.
8. **Prefer additive changes** (new modules/types) over invasive edits.
9. **Verification is mandatory** unless `verification=none`. If tests are unavailable, do best-effort: typecheck + lint at minimum.
10. If any guardrail blocks progress, **stop and output a plan** rather than pushing through.

---

## Execution model (3 phases)

### Phase 0 — Preflight (read-only)
- Identify tooling: Nx / npm / pnpm / yarn; locate `package.json`, `nx.json`, tsconfig(s), test runner.
- Identify boundaries relevant to the pattern:
  - I/O edges: HTTP, DB, queues, filesystem, third-party SDKs
  - Existing abstractions: services/repos/adapters/clients
- Establish baseline verification commands (print them first):
  - Prefer repo scripts (`nx test <proj>`, `npm test`, etc.)
  - If unknown, fall back to `tsc --noEmit` and lint script.

**Stop condition:** if the target area cannot be located precisely, do not guess—output “next files to open”.

### Phase 1 — Plan (must be explicit)
Produce:
- A **tiny change plan** (2–6 steps) that respects guardrails
- A **file list** (new + modified) with purpose per file
- A **verification plan** (exact commands)
- A **rollback plan** (git-based)

**Stop condition:** if the minimal viable plan still exceeds thresholds, output a split plan (milestone 1 scaffold, milestone 2 migrate).

### Phase 2 — Apply (scaffold → migrate → finish)
#### mode=scaffold (default)
- Introduce the pattern as **structure only**:
  - interfaces/types, small adapter shells, a façade, strategy registry, command objects, etc.
- Wire it in behind an existing entrypoint without changing behavior:
  - keep old path as default implementation
  - add toggles only if already present in repo conventions

#### mode=migrate
- Move **one vertical slice** at a time behind the new abstraction.
- After each slice:
  - run verification
  - ensure no net behavior change (unless allowed)

#### mode=finish
- Remove dead code only if confidence is high and tests cover it.
- Add minimal docs (README section or `docs/` note) describing extension points.

**Hard stop conditions during Apply**
- A test failure that requires unrelated refactors to fix.
- Requires changing more than 2 call sites across unrelated domains.
- Requires new dependencies (unless allowed).
- Requires changing API contracts (unless allowed).

---

## Pattern-specific implementation constraints (TypeScript)
When applying patterns, enforce:
- **Explicit types** at boundaries (DTOs, ports, adapters). Avoid `any`.
- Prefer **discriminated unions** for results/state machines.
- Prefer **pure core, impure edges** when feasible (especially for ports/adapters, CQRS-lite).
- Keep DI lightweight:
  - constructor injection or factory functions
  - no container framework unless already used in repo

---

## Output format (MUST)
### 0) Inputs + guardrails
- Pattern, target, mode, thresholds, allowed toggles

### 1) Preflight findings (facts)
- Tooling detected
- Current structure snapshot (relevant modules only)
- Baseline verification commands

### 2) Change plan (small + numbered)
- Step list (2–6)
- File list (new/modified) with one-line purpose

### 3) Applied changes (what changed)
For each file:
- Intent
- Key diff summary (no walls of code)

### 4) Verification results
- Commands run (or proposed if execution unavailable)
- Pass/fail + what was done to remediate

### 5) Rollback + follow-ups
- How to revert safely
- Next migration slices (if any)
- Explicitly deferred improvements

---

## Verification strategy (auto)
If `verification=auto`, choose the narrowest applicable set:
- Nx repo: `nx test <project>` + `nx lint <project>` + `nx build <project>` (or affected variant)
- npm/pnpm/yarn: run the closest project-level scripts
- Always include: `tsc --noEmit` (or equivalent) if available

Before running any terminal command:
- Print the exact command(s) to be executed.
- Prefer read-only commands first.

---

## Usage examples
### Scaffold a Strategy pattern inside a risk module (no behavior changes)
/ts-pattern-apply pattern=strategy target=apps/guard-api/src/risk mode=scaffold

### Apply Ports & Adapters in a small slice (strict thresholds)
/ts-pattern-apply pattern=ports-and-adapters target=libs/payments max_files=6 max_loc=180 mode=scaffold

### Migrate one vertical slice behind the new port (requires behavior change toggle)
/ts-pattern-apply pattern=ports-and-adapters target=apps/api/src/orders mode=migrate allow_behavior_change=true

### Finish: prune old path and document extension points
/ts-pattern-apply pattern=strategy target=apps/api/src/pricing mode=finish
