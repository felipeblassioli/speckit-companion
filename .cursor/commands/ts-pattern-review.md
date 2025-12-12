---
name: /ts-pattern-review
summary: Deeply analyze a situation and propose (or reject) design/architecture patterns with explicit justification.
description: Use this when you have a design problem, code smell, scaling concern, or messy module and want a senior-level pattern-fit analysis (including “do nothing” when appropriate). Default is analysis-only (no edits).
alwaysApply: false
---

# /ts-pattern-review — Pattern Fit Analysis (Overengineer Mode)

## What this command does

Performs a **deep, engineer-grade** analysis of the current situation and produces:
- A **shortlist of candidate patterns** (architectural + OO + functional).
- A **clear justification** for each (problem → forces → fit).
- A **strong recommendation** (including “do nothing” when patterns add needless complexity).
- A **pragmatic adoption plan** (incremental, reversible steps) if a pattern is recommended.

Default posture: **explore broadly, decide narrowly**.

---

## Inputs (what I need in context)

Provide at least one of:
- A specific **problem statement** (bug-prone area, changing requirements, test pain, scaling issue).
- One or more **code locations** (files/folders) that represent the situation.
- A **target outcome** (“make it testable”, “enable multiple providers”, “reduce coupling”, “support new workflows”).

Optional but useful:
- Constraints: deadlines, team familiarity, perf/SLOs, deployment model, compliance.
- Non-goals: what must not change.

If you don’t provide these, I will infer from the referenced code, and I will explicitly list assumptions.

---

## Constraints (hard guardrails)

1. **Analysis-only by default**: do not edit files, do not run terminal commands, do not refactor.
2. If an “implementation sketch” is requested, keep it **pseudocode + file-level proposals**, not mass diffs.
3. Prefer **smallest viable structure**. Patterns are only “worth it” if they pay rent.
4. Always include at least one **“No pattern / simpler alternative”** option.

---

## Actions (how I will work)

### 1) Clarify the situation (minimal questions)
- Ask at most **3** high-leverage questions *only if* the decision is materially ambiguous.
- Otherwise proceed with explicit assumptions.

### 2) Build a factual baseline (from code + requirements)
- Summarize the “as-is” state:
  - Domain boundaries (or lack thereof)
  - Call graph shape / dependency direction
  - I/O boundaries (DB, HTTP, queue, filesystem)
  - State handling (mutable, async, concurrency, caching)
  - Testability constraints (what makes tests hard today)
- Extract the **forces** (tradeoffs) driving the design:
  - volatility, coupling, cohesion, fan-in/fan-out, latency, failure modes, ownership boundaries.

### 3) Identify candidate patterns (overengineer pass)
I will propose candidates across 3 layers:

**A) Architectural patterns (system/module level)**
Examples: Hexagonal/Ports & Adapters, Layered, Modular Monolith, DDD-lite, CQRS, Event-driven, Strangler Fig.

**B) OO design patterns (code level)**
Examples: Strategy, Adapter, Facade, Decorator, Template Method, Command, Chain of Responsibility, State, Factory.

**C) Functional patterns (type/system level)**
Examples: ADTs / discriminated unions, Result/Either, pipe/compose, pure core + impure edges, effect isolation.

### 4) Evaluate each candidate with a strict rubric
For each pattern (including “do nothing”), I will score:

- **Fit**: does it directly address the forces?
- **Cost**: new abstractions, cognitive overhead, refactor surface area.
- **Risk**: migration risk, partial adoption failure modes, runtime perf impact.
- **Reversibility**: can we roll back or stop halfway safely?
- **Team economics**: will reviewers + oncall benefit or suffer?

### 5) Decide (narrow pass)
- Recommend **one primary direction** and optionally one “runner-up”.
- Explicitly reject patterns that are tempting but unjustified (with reasons).

### 6) If a pattern is recommended: propose an incremental adoption plan
- “Step 0” = scaffolding and seams (no behavior change).
- “Step 1..N” = small migrations with checkpoints.
- Include clear “stop conditions” and rollback notes.

### 7) Confidence gate
- Provide a confidence score (0–100%).
- If confidence < 80%: propose **what to inspect next** (specific files/questions) rather than guessing.

---

## Output format (MUST follow exactly)

### 0. Problem framing
- **Goal**
- **Constraints / non-goals**
- **Assumptions** (if any)

### 1. As-is snapshot (facts from code)
- Current structure (modules, dependencies, boundaries)
- Pain points (with references to concrete code locations)

### 2. Forces (why the system is “pushing” toward change)
- Volatility sources
- Coupling/cohesion issues
- Runtime concerns (latency, reliability, scaling)
- Testability concerns

### 3. Candidate patterns (overengineer pass)
For each candidate:
- **Pattern**
- **Symptoms it matches**
- **What it would buy us**
- **Costs / risks**
- **Why it might be overkill**
- **Minimal viable variant** (smallest useful form)

### 4. Decision matrix
A table like:

| Option | Fit | Cost | Risk | Reversible | Team Fit | Notes |
|---|---:|---:|---:|---:|---:|---|

### 5. Recommendation
- **Recommended approach**
- **Rejected approaches** (explicit)
- **Key tradeoffs** (blunt + candid)

### 6. Implementation sketch (only if recommended)
- Proposed boundaries (modules/dirs/interfaces)
- Example APIs/types (TypeScript)
- Migration steps (incremental)
- Verification checklist (tests/observability)

### 7. Confidence + next questions
- **Confidence %**
- If <80%: exact next info needed

---

## Usage examples

### Analyze a messy area (default: analysis-only)
/ts-pattern-review target=apps/guard-api scope=transaction-risk

### “Overengineer mode” (force broader candidate list)
/ts-pattern-review target=libs/ scope=pricing mode=overengineer

### Force an explicit “do nothing” option comparison
/ts-pattern-review target=apps/api scope=checkout require_no_change_option=true

### Ask for an ADR-style summary in the recommendation
/ts-pattern-review target=apps/api scope=billing output=adr

---

## Notes for the agent (behavioral expectations)

- Be opinionated, but **show your work**: every recommendation must map back to forces and concrete code facts.
- Prefer patterns that **reduce incidental complexity** (test seams, boundary clarity, explicit types) over patterns that add ceremony.
- Always include at least one “simpler than patterns” alternative, even if you recommend a pattern.
- If the best answer is “leave it alone”, say so clearly and explain why.
