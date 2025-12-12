# Tasks: Provider-Aware Agent Capabilities

**Input**: `specs/005-provider-capabilities/spec.md`, `specs/005-provider-capabilities/plan.md`  
**Prerequisites**: plan.md (required), spec.md (required)

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish capability model scaffolding and shared guardrails without changing UX behavior yet.

- [x] T001 [US1] Create `src/ai-providers/providerCapabilities.ts` with typed action IDs, capability status shape, and baseline map per provider/agent/action
- [ ] T002 [US1] Add optional “safe probing” hooks interface (no probes on activation; only on-demand) and a small cache for probe results
- [ ] T003 [P] [US1] Add a minimal, provider-agnostic error message helper for “unsupported/not installed/misconfigured” outcomes (no provider names hard-coded)
- [ ] T003a [US1] Add acceptance checks for capability ADT: supported/unsupported/unknown must include reason for unsupported/unknown and be exhaustively handled in guard

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ensure the extension never requires Claude unless selected; align shared infrastructure to provider paths/capabilities.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T004 [US1] Implement a shared “capability guard” helper in `src/core/utils/capabilityGuard.ts` used by `/speckit.*` commands to block unsupported actions (no fallback by default)
- [x] T005 [US1] Update `src/features/specs/specCommands.ts` to use the capability guard before calling `getAIProvider().executeSlashCommand(...)`
- [x] T006 [US1] Ensure activation does not initialize provider-specific subsystems unless selected (audit `src/extension.ts` and provider init points)
- [x] T007 [US1] Ensure any direct `claude ...` command execution is gated behind provider selection (audit providers + MCP + other features)

**Remote-safe I/O groundwork (constitution compliance)**:

- [x] T008 [P] [US1] Replace Node `fs` reads of workspace files in `src/features/specs/specExplorerProvider.ts` with `vscode.workspace.fs` (document status + related docs scanning)
- [ ] T009 [P] [US1] Replace Node `fs` workspace access in `src/features/mcp/mcpExplorerProvider.ts` if any remains (keep CLI usage gated)
- [ ] T009a [US1] Add a “remote-safe I/O” acceptance check to any task touching workspace paths: must use `vscode.Uri` + `vscode.workspace.fs` (no Node `fs` for workspace)

**Checkpoint**: Non-Claude provider can run extension, Specs view lists `specs/*`, and commands block unsupported operations with actionable messages.

---

## Phase 3: User Story 1 - Run Spec Workflow With Any Selected Provider (Priority: P1) 🎯 MVP

**Goal**: `/speckit.specify` and workflow handoffs run via the currently selected provider without Claude requirements.

**Independent Test**: Select a non-Claude provider; run `/speckit.specify` and verify it executes via that provider (or blocks with a clear “not installed / not supported” message).

### Tests for User Story 1 ⚠️

> Write tests first when feasible; keep them deterministic (no real CLI calls).

- [x] T010 [P] [US1] Unit test capability baseline mapping for each provider in `src/ai-providers/providerCapabilities.test.ts`
- [x] T011 [P] [US1] Unit test “capability guard” behavior (supported vs unsupported vs unknown) without VS Code host
- [x] T012 [US1] Integration-ish test (unit style) for `specCommands` invoking guard before execution (use provider stub)
 - [x] T012a [US1] Add test case asserting “unknown” blocks with actionable message (no guessing, no fallback)

### Implementation for User Story 1

- [ ] T013 [US1] Define the extension-level “actions” needed for `/speckit.specify`, `/speckit.plan`, `/speckit.clarify`, `/speckit.tasks`, `/speckit.constitution`
- [ ] T014 [US1] Implement provider capability definitions (baseline) for existing providers (claude/gemini/copilot/cursor-agent)
- [ ] T015 [US1] Add optional probe: provider installed check (uses provider’s `isInstalled()`); cache results; never runs during activation
- [ ] T016 [US1] Ensure `/speckit.specify` uses the guard + the selected provider and produces a consistent outcome (execute or block)

**Checkpoint**: User Story 1 works end-to-end for at least one non-Claude provider (or blocks with actionable guidance if not installed).

---

## Phase 4: User Story 2 - Capability-Aware Experience (Priority: P2)

**Goal**: UX surfaces only supported actions by default, with a clear “not supported by current provider” informational affordance.

**Independent Test**: Switch providers; confirm unsupported features are hidden with a single info affordance, and supported features remain usable.

### Tests for User Story 2 ⚠️

- [ ] T017 [P] [US2] Unit tests for “unsupported surfacing” policy decisions (hide-by-default + info affordance content) in the capability/UX adapter layer

### Implementation for User Story 2

- [ ] T018 [US2] Add a small capability-aware adapter used by tree providers (e.g., “shouldShowFeatureX / whyNot”)
- [ ] T019 [US2] Apply gating to views that are currently Claude-centric (MCP/Hooks/Skills/Agents) so they don’t attempt provider-specific I/O when unsupported
- [ ] T020 [US2] Ensure the Specs view remains always visible and provider-agnostic
- [ ] T020a [US2] Implement a concrete “Not supported by current provider” informational affordance in at least one view (e.g., show a single info tree item with explanation) and verify it appears only when relevant
 - [ ] T020b [US2] Add a small policy helper that produces both “shouldShow” and “whyNot” values to avoid scattered provider branching in views

**Checkpoint**: UI never offers unsupported actions silently; users see a single, clear explanation when something is unavailable.

---

## Phase 5: User Story 3 - Provider-Agnostic “Agent” Usage (Priority: P3)

**Goal**: “Agents” work across providers where possible; otherwise fail safely and explain.

**Independent Test**: Trigger a handoff action; verify the selected provider routes to an appropriate agent or blocks with a clear message.

### Tests for User Story 3 ⚠️

- [ ] T021 [P] [US3] Unit tests for provider+agent+action capability resolution including “agent not supported” cases

### Implementation for User Story 3

- [ ] T022 [US3] Define agent roles used by workflows (e.g., specify/plan/clarify/tasks) and map them to providers
- [ ] T023 [US3] For providers without “agent” concepts, decide and encode the baseline behavior (likely “unsupported” for agent-specific features; still allow generic actions)
- [ ] T024 [US3] Ensure “no fallback by default” policy is enforced consistently across agent-backed actions

**Checkpoint**: Agent-dependent actions are either executed correctly for supporting providers or blocked with guidance (no magic fallback).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Clean up remaining Claude assumptions and improve maintainability.

- [ ] T025 [P] Convert `src/core/fileWatchers.ts` to be provider-aware (don’t watch `.claude` unless provider uses it)
- [ ] T026 [P] Convert `src/features/steering/*` to use provider steering file names/paths instead of hardcoding `CLAUDE.md`
- [ ] T027 [P] Ensure `cursor-agent` is handled consistently anywhere provider type switches exist (avoid falling into Claude paths)
- [ ] T028 [P] Update docs to reflect provider-agnostic behavior and capability gating (`docs/ai/**` + settings reference)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: can start immediately.
- **Phase 2 (Foundational)**: blocks all user story work (must be complete first).
- **Phases 3–5 (User Stories)**: proceed in priority order (P1 → P2 → P3); can be parallelized after Phase 2 if staffed.
- **Phase 6 (Polish)**: after core behavior is stable; can run in parallel with later story work.

### User Story Dependencies

- **US1 (P1)** depends on Phase 2.
- **US2 (P2)** depends on Phase 2; may build on US1 guard outputs.
- **US3 (P3)** depends on Phase 2 and capability model from US1.


