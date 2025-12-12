# Feature Specification: Provider-Aware Agent Capabilities

**Feature Branch**: `005-provider-capabilities`  
**Created**: 2025-12-12  
**Status**: Draft  
**Input**: User description: "decouple from claude and rely on AI providers (agents) but be aware that each agent may have different capabilities"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run Spec Workflow With Any Selected Provider (Priority: P1)

As a developer using SpecKit Companion, I want `/speckit.specify` (and handoffs like Plan/Clarify) to run using my selected AI provider, so that I can generate and evolve specs without being forced to use Claude.

**Why this priority**: This is the core value of the extension for users who do not use Claude—spec-driven workflow should still function.

**Independent Test**: Can be fully tested by selecting a non-Claude provider, triggering `/speckit.specify` with a feature description, and confirming the spec output is generated/updated without requiring Claude-specific setup.

**Acceptance Scenarios**:

1. **Given** an AI provider is selected, **When** I run `/speckit.specify` with a feature description, **Then** the spec is created/updated using the selected provider
2. **Given** I change the selected provider, **When** I re-run `/speckit.specify`, **Then** the command uses the newly selected provider
3. **Given** the selected provider is not available on my machine, **When** I run `/speckit.specify`, **Then** I receive a clear message explaining what is missing and how to fix it

---

### User Story 2 - Capability-Aware Experience (Priority: P2)

As a developer, I want SpecKit Companion to only offer actions that my selected provider and its agents can actually perform, so that I don’t waste time on unsupported commands and I understand what is available.

**Why this priority**: Different providers (and their “agents”) have different feature sets; the extension should guide users with predictable, accurate affordances.

**Independent Test**: Can be tested by selecting providers with different capability sets and verifying that unsupported features are disabled/hidden with clear explanations, while supported features remain available.

**Acceptance Scenarios**:

1. **Given** a provider that does not support a feature, **When** I view the UI or command surface, **Then** the feature is hidden by default and I see an explanation of why it’s unavailable
2. **Given** a provider that supports a feature, **When** I run the related command, **Then** it executes successfully using that provider
3. **Given** a capability is unknown for a provider/agent, **When** I attempt the action, **Then** the extension fails safely with guidance (rather than attempting provider-specific behavior that may be wrong)

---

### User Story 3 - Provider-Agnostic “Agent” Usage (Priority: P3)

As a developer, I want the extension’s “agents” concept to work across providers where possible (or degrade gracefully when not), so that I can reuse workflows without being tied to a single vendor’s conventions.

**Why this priority**: The extension should treat “agent” execution as a provider-mediated capability rather than an implementation detail of any one provider.

**Independent Test**: Can be tested by verifying that agent-backed commands behave consistently across providers, with clear fallbacks and predictable results.

**Acceptance Scenarios**:

1. **Given** a provider that supports agent execution, **When** I trigger a handoff action, **Then** the appropriate agent is invoked through that provider
2. **Given** a provider that does not support agent execution, **When** I trigger a handoff action, **Then** I receive a clear message and a safe alternative (e.g., a generic execution path) or a clear “not supported” outcome

---

### Edge Cases

- What happens when the provider is changed while a command is in progress? (Should not corrupt state; user sees a clear outcome and can retry)
- What happens when a provider supports some but not all actions required by a workflow? (Only supported actions are offered; unsupported ones are clearly explained)
- What happens when an agent referenced by a workflow is missing or not recognized for that provider? (Safe failure with guidance; no silent no-ops)
- What happens when a provider is installed but requires additional setup before it can run? (Clear actionable message)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST execute `/speckit.specify` using the currently selected AI provider
- **FR-002**: System MUST execute spec workflow handoffs (e.g., Plan, Clarify) using the currently selected AI provider
- **FR-003**: System MUST support a capability model that can express which features are supported by each provider and (when applicable) by provider-specific agents
- **FR-003a**: System MUST define a baseline capability map per provider/agent that is available without probing the local environment
- **FR-003b**: System MAY refine baseline capabilities using optional runtime probing when safe to do so, without breaking offline predictability
- **FR-003c**: System MUST model capabilities at provider + agent + action granularity
- **FR-004**: System MUST ensure users are not offered actions that are known to be unsupported for the selected provider/agent (or MUST clearly label them as unavailable with an explanation)
- **FR-004a**: System MUST hide unsupported actions by default while providing a clear, discoverable “not supported by current provider” informational affordance
- **FR-005**: System MUST provide a safe behavior when capabilities are unknown (fail safely with guidance rather than guessing provider-specific behavior)
- **FR-005a**: System MUST not apply automatic fallback behavior for unsupported actions by default; it MUST block the action, explain why, and suggest supported alternatives (e.g., switching provider)
- **FR-006**: System MUST not require Claude-specific setup or permissions when a non-Claude provider is selected
- **FR-007**: System MUST provide clear, actionable feedback when the selected provider cannot run an action (not installed, not configured, or missing capability)
- **FR-008**: System MUST keep the spec workflow user experience consistent across providers where capabilities overlap (same intent, same outcomes)
- **FR-009**: System MUST use VS Code filesystem APIs for workspace file access (remote-safe), and MUST NOT depend on provider CLIs for listing or browsing `specs/*`
- **FR-010**: System MUST represent capability decisions with a closed set of states (supported/unsupported/unknown) and an explicit reason for unsupported/unknown outcomes
- **FR-011**: System MUST centralize capability policy (hide-by-default surfacing + no-fallback execution) so provider-specific branching does not spread across unrelated modules

### Key Entities *(include if feature involves data)*

- **Provider**: A configured AI assistant integration chosen by the user
- **Agent**: A provider-mediated execution role used by workflows (may not exist for all providers)
- **Capability**: A named feature or action the provider/agent can perform (e.g., run a workflow step, run a background action, manage provider-specific resources)
- **Workflow Step**: A user-triggered action (e.g., Specify, Plan, Clarify) that may require specific capabilities

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete `/speckit.specify` using at least one non-Claude provider without encountering Claude-specific prompts or setup steps
- **SC-002**: Unsupported actions are never “silent failures”; 100% of unsupported attempts yield an explicit, actionable message
- **SC-003**: For a provider with partial feature support, the UI/commands reflect the correct availability state for all surfaced features
- **SC-004**: Switching providers changes behavior immediately (or with a single guided reload), with no ambiguous mixed-provider behavior
- **SC-005**: Specs browsing remains functional even when no provider CLIs are installed (spec list renders and opens documents)

## Assumptions

- Providers vary in feature support; “agent” concepts may be richer for some providers and minimal or absent for others
- When a provider cannot support an action, a clear “not supported” experience is acceptable if no safe fallback exists

## Clarifications

### Session 2025-12-12

- Q: Capability “Source of Truth” → A: Baseline capability map per provider/agent, refined by optional runtime probing
- Q: How should “unsupported” be surfaced? → A: Hide unsupported actions by default, while showing a clear “not supported by current provider” informational affordance
- Q: Capability granularity → A: Provider + agent + action
- Q: Fallback behavior when an action is unsupported → A: No fallback by default; block + explain + suggest alternatives

## Acceptance Criteria (Cross-cutting)

- **AC-001**: Commands that invoke providers (`/speckit.*`) MUST pass through a single capability guard that enforces:
  - supported → execute
  - unsupported → block with actionable message
  - unknown → block with actionable message (no guessing)
- **AC-002**: Any code that reads workspace files for specs (listing, status, related docs) MUST use `vscode.Uri` + `vscode.workspace.fs` (remote-safe)
- **AC-003**: The UI MUST hide unsupported features by default and provide a single informational affordance explaining unavailability
- **AC-004**: Capability probing MUST be lazy/on-demand (never runs during activation)
