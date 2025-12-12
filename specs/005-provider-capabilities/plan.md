## Implementation Plan: Provider-Aware Agent Capabilities

**Branch**: `005-provider-capabilities` | **Date**: 2025-12-12 | **Spec**: `specs/005-provider-capabilities/spec.md`  
**Input**: Feature specification from `/specs/005-provider-capabilities/spec.md`

## Summary

Decouple core SpecKit workflow UX (Specs listing, `/speckit.*` commands, workflow editor) from Claude-specific assumptions by introducing a provider/agent capability model and using it to:

- Gate UI/actions predictably (baseline map + optional safe probing).
- Avoid initializing or invoking Claude-only systems when a non-Claude provider is selected.
- Keep “specs are artifacts under `specs/*`” always available regardless of provider installation.

## Technical Context

**Language/Version**: TypeScript (strict)  
**Primary Dependencies**: VS Code Extension API (`vscode`), Node.js built-ins, `js-yaml`  
**Storage**: Workspace files + extension global storage (no database)  
**Testing**: Jest (`ts-jest`)  
**Target Platform**: VS Code desktop (remote-safe file APIs required)  
**Project Type**: VS Code extension (extension host + webview)  
**Performance Goals**: Keep activation fast; avoid provider CLI calls unless needed  
**Constraints**: Remote-safe I/O (`workspace.fs`), no shell injection, no `any`, no floating promises  
**Scale/Scope**: Multiple providers; mixed support levels; must degrade safely

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Workflow alignment**: Supporting infrastructure for Spec → Plan → Tasks and provider extensibility.
- [x] **Layering boundaries**: Provider gating and capabilities live in features/services; UI providers remain UI-only.
- [ ] **Remote-safe file I/O**: Several existing modules still use Node `fs` for workspace content; refactor is in scope.
- [x] **CLI safety**: Do not concatenate untrusted input into shell commands; continue prompt-file patterns.
- [x] **Webview security (if applicable)**: No new webview surface planned in this feature.
- [x] **TypeScript safety**: Use literal unions/typed maps; avoid `any`/`enum`; no floating promises.
- [ ] **Testing**: Add unit tests for capability resolution + gating; add minimal extension-level integration assertions if feasible.

## Project Structure

### Documentation (this feature)

```text
specs/005-provider-capabilities/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature spec (provider-aware capabilities)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── ai-providers/
│   ├── aiProvider.ts
│   ├── aiProviderFactory.ts
│   ├── claudeCodeProvider.ts
│   ├── cursorAgentProvider.ts
│   ├── geminiCliProvider.ts
│   ├── copilotCliProvider.ts
│   └── (new) providerCapabilities.ts
├── core/
│   ├── fileWatchers.ts
│   └── ...
├── features/
│   ├── specs/
│   ├── steering/
│   ├── agents/
│   ├── hooks/
│   ├── mcp/
│   └── permission/
└── extension.ts
```

**Structure Decision**: Keep changes within existing layout; introduce one small provider-capabilities module under `src/ai-providers/` and (optionally) a thin “capabilities service” used by commands/providers.

## Implementation Approach

### Phase 0: Stop provider-incorrect initialization and side effects (bug fix / guardrails)

Goal: ensure the extension can run without Claude installed and still list specs.

- Gate Claude permission initialization behind `speckit.aiProvider === 'claude'`.
- Gate any direct `claude ...` CLI calls (e.g., MCP listing) behind provider selection.
- Ensure Specs tree view stays provider-agnostic: reading `specs/*` must never depend on any provider.

Status: partially implemented (permission init gating + MCP gating already applied on this branch).

**Acceptance Gate (this feature)**:
- Any code changed or introduced by this feature that touches workspace files MUST use `vscode.Uri` + `vscode.workspace.fs`.
- Node `fs` MAY be used only for non-workspace paths (e.g., extension global storage, user home config) and must be documented in-code.
- The Specs explorer MUST list `specs/*` without invoking any provider CLI.

## Recommended Design Patterns (Minimal)

**Goal**: Explore broadly, decide narrowly. Adopt only patterns that pay rent for provider volatility and testability.

### Primary recommendation (Hexagonal-lite seam)

- **Core policy + types (pure-ish)**:
  - `src/ai-providers/providerCapabilities.ts`
  - Exposes: `ProviderId`, `AgentId`, `ActionId`, and an ADT-like `CapabilityStatus`:
    - supported
    - unsupported (+ reason)
    - unknown (+ reason)
- **Execution gatekeeper (impure edge)**:
  - `src/core/utils/capabilityGuard.ts`
  - Enforces: hide-by-default surfacing + no fallback on execute; returns actionable errors.
- **Provider probing (optional, lazy)**:
  - Implemented as on-demand refinement (e.g., “is installed?”), cached, never during activation.

### Patterns explicitly rejected

- **Chain of Responsibility** for fallback: encourages implicit “magic” behavior, conflicts with “no fallback by default”.
- **Full Command pattern** with per-command classes: too much ceremony; a single guard wrapper is sufficient.

## Verification Checklist (Definition of Done)

- **Capabilities**
  - Baseline map exists for each provider/agent/action (no probing required to answer).
  - Probing is lazy and cached (never runs during activation).
  - All decisions are expressed via the closed `CapabilityStatus` ADT (no ad-hoc booleans).
- **UX**
  - Unsupported features are hidden by default with a single “not supported by current provider” informational affordance.
  - Unsupported/unknown execution is blocked with actionable remediation messages.
- **Remote-safe I/O**
  - Any workspace file access in touched modules uses `vscode.Uri` + `vscode.workspace.fs` (no Node `fs` for workspace).
  - Specs listing works even if no provider CLI is installed.
- **Tests**
  - Unit tests cover capability resolution + guard behavior (supported/unsupported/unknown) without invoking CLIs.
  - At least one regression test asserts non-Claude activation does not invoke Claude permission setup.

### Phase 1: Capability model (provider + agent + action)

Goal: a single source of truth for what can be executed, used across UI + commands.

- Create `src/ai-providers/providerCapabilities.ts` defining:
  - **Action identifiers** (literal unions) representing high-level operations the extension can request.
  - **Capability status** shape that can represent: supported / unsupported / unknown + reason.
  - A **baseline capability map** for each provider and agent role.
  - Optional **safe probing hooks** that refine the baseline (e.g., “is CLI installed?”) without changing the baseline defaults.

Key policy decisions (from spec clarifications):
- Baseline map exists without probing.
- Probing refines, does not replace baseline.
- Granularity is provider + agent + action.
- Unsupported actions are hidden by default, with an info affordance; no automatic fallback by default.

### Phase 2: Wire capabilities into UX gating

Goal: consistent “what you see matches what will work”.

- **Commands**:
  - Add a single guard helper used by `/speckit.*` command handlers that:
    - Resolves capability for the selected provider + target agent + action.
    - If unsupported/unknown, shows a clear message with remediation (install/configure/switch provider).
    - Otherwise, proceeds to provider execution.
- **Views/Providers**:
  - Use the same capability resolution to:
    - Hide unsupported features by default.
    - Show a single informational item/tooltip for “not supported by current provider”.

### Phase 3: Remove remaining Claude-only assumptions in shared infrastructure

Goal: stop hard-coding `.claude` and Claude file names where provider-specific.

Targeted refactors (incremental; prioritize ones that currently break non-Claude flows):
- `src/core/fileWatchers.ts`: replace `.claude` watchers with provider-aware watchers based on `getProviderPaths(...)`.
- `src/features/agents/*`, `src/features/hooks/*`, `src/features/skills/*`:
  - Ensure they are gated by capability (and/or provider type) before touching `.claude`.
  - Replace hard-coded `.claude` paths with `PROVIDER_PATHS` where applicable.
- `src/features/steering/*`: ensure messages and file creation paths use provider paths (`steeringFile`, etc.), and handle `cursor-agent` explicitly (currently missing in some switches).

### Phase 4: Tests

Goal: deterministic tests covering the new decision logic and preventing regressions.

- **Unit tests** (Jest):
  - Capability resolution returns expected results for each provider.
  - Probing refinement behavior (baseline stays stable; refinement updates status/reason).
  - Guard helper blocks unsupported actions with actionable messaging data (structure, not UI snapshot).
- **Light integration tests (optional, if repo supports)**:
  - Activation with non-Claude provider does not attempt Claude permission init.
  - MCP provider does not run `claude mcp list` when provider is not Claude.

## Risks & Mitigations

- **Risk**: capability probing accidentally runs provider CLIs during activation.
  - **Mitigation**: do not probe on activation; probe lazily on first use of a capability group, cache results.
- **Risk**: providers have partial support and behavior differs (e.g., slash commands vs prompt translation).
  - **Mitigation**: model actions at the extension level (provider + agent + action), not at CLI subcommands; keep “unsupported” explicit.
- **Risk**: remote environments break due to Node `fs` usage.
  - **Mitigation**: prioritize converting workspace file access to `workspace.fs` in shared paths touched by this feature.

## Rollout / Compatibility

- Keep existing provider selection behavior (reload prompt on provider change).
- Default behavior: hide unsupported actions; no fallback; provide guidance to switch/install.
- Incrementally migrate `.claude`-dependent features behind capability gating to avoid breaking non-Claude sessions.


