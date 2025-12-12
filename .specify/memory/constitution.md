<!--
Sync Impact Report:
- Version change: 1.0.0 -> 1.1.0
- List of modified principles:
  - I. Extensibility and Configuration -> I. Provider Extensibility & Configuration
  - II. Spec-Driven Workflow -> II. Spec-Driven Workflow (Spec → Plan → Tasks)
  - III. Visual and Interactive -> III. UX First, Without Sacrificing Safety
  - NEW: IV. VS Code Extension Architecture Boundaries (Commands/Providers/Features/Webview)
  - NEW: V. Remote-Safe File I/O, Errors, and Observability
  - NEW: VI. Webview Security & Typed Message Contracts
  - NEW: VII. TypeScript Strictness & Runtime Safety (No any, no enums, no floating promises)
  - NEW: VIII. Testing Discipline (Unit-by-default, deterministic, integration when needed)
- Added sections:
  - Contribution/Manifest Discipline
  - Security & Privacy
- Removed sections:
  - AI Provider Integration (merged into Core Principles)
  - User Interface (merged into Core Principles)
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
  - ⚠️ .specify/templates/commands/*.md (missing in this repo; removed outdated reference from plan template)
- Follow-up TODOs:
  - TODO(RATIFICATION_DATE): Keep as-is unless you want to backdate to first adoption date.
-->
# SpecKit Companion Constitution

## Core Principles

### I. Provider Extensibility & Configuration
The extension MUST support multiple AI providers via a stable provider abstraction. Provider-specific
behavior MUST be isolated (no cross-provider branching scattered across unrelated modules). Adding a
new provider MUST be possible by implementing the provider interface and wiring it in one place
(factory/registry), without rewriting core UX flows.

Configuration MUST be:
- Explicitly defined in `package.json` contribution schema (types, defaults, enums).
- Validated at runtime (do not assume user config is valid).
- Exposed with clear UX (settings + actionable error messages).

### II. Spec-Driven Workflow (Spec → Plan → Tasks)
The extension MUST enforce and facilitate GitHub SpecKit’s workflow. The phases Spec → Plan → Tasks
are non-negotiable. Any new feature MUST either:
- Support this workflow directly (creating, editing, validating, navigating); or
- Be explicitly scoped as “supporting infrastructure” (e.g., provider detection, settings, watchers).

### III. UX First, Without Sacrificing Safety
The extension is a GUI tool; features SHOULD have a visual and interactive UX inside VS Code rather
than only exposing CLI commands. However, UX MUST NOT compromise:
- Security (webview CSP, sanitization, no unsafe command construction)
- Stability (typed contracts, bounded concurrency, predictable error handling)
- Remote compatibility (use VS Code filesystem APIs for workspace files)

### IV. VS Code Extension Architecture Boundaries (Commands/Providers/Features/Webview)
We maintain strict layering for testability and long-term maintainability:
- **Commands**: thin orchestration entry points (parse inputs → call service → show UI).
- **Providers**: VS Code UI adapters only (TreeDataProvider/custom editors), no business decisions.
- **Features/Managers/Services**: business logic + filesystem semantics; keep VS Code API usage minimal.
- **Watchers**: observe filesystem changes and trigger refreshes; no business logic.
- **Webview**: sandboxed UI that renders state and requests actions via typed messages.

Any PR that crosses these boundaries (e.g., providers doing filesystem writes directly) MUST be
refactored before merge.

Command IDs MUST remain stable. Prefer `speckit.*` as the canonical namespace. If legacy command IDs
exist, they MAY be retained as compatibility aliases but MUST not become the primary API.

### V. Remote-Safe File I/O, Errors, and Observability
All workspace file operations MUST use VS Code APIs (`vscode.Uri`, `workspace.fs`) and workspace-
relative paths. Node `fs` MUST NOT be used for workspace files.

All filesystem and external-command interactions MUST:
- Be wrapped in `try/catch` with actionable `showErrorMessage(...)` UX.
- Avoid shell injection: do not concatenate untrusted user/workspace input into shell commands.
  Prefer “prompt file redirection” patterns and safe quoting.

Observability MUST be minimal and safe:
- Log/notify once per error at the boundary.
- Never log secrets or sensitive workspace content.

### VI. Webview Security & Typed Message Contracts
Webviews MUST treat all workspace content as untrusted input.

Security requirements:
- Use a strict CSP; prefer nonce-based scripts and `webview.asWebviewUri(...)` for assets.
- Avoid string-concatenated HTML with unsanitized workspace-derived content.

Message passing requirements:
- All extension↔webview messages MUST be typed as discriminated unions.
- The extension host MUST validate inbound webview messages before acting.
- The extension host is the source of truth for document state; the webview requests actions.

### VII. TypeScript Strictness & Runtime Safety (No `any`, no enums, no floating promises)
This repo is TypeScript strict-mode. Changes MUST follow these baseline rules:
- No `any`. Use `unknown` + narrowing and validate at boundaries.
- No `enum`/`const enum`. Use literal unions and typed maps.
- Prefer `type` over `interface` unless merging/implements requires `interface`.
- No floating promises: always `await`/`return` or intentionally `void` with internal error handling.
- Prefer explicit, stable exported signatures. Avoid hidden side-effects.
- Treat `null` as foreign input; normalize to `undefined` at boundaries.

### VIII. Testing Discipline (Unit-by-default, deterministic, integration when needed)
Behavior changes MUST be covered by tests unless explicitly deferred with documented rationale.

Testing rules:
- Prefer unit tests colocated with sources (`*.test.ts`).
- Tests MUST be deterministic (no live network; freeze time/UUID where needed).
- Use stubs/fakes over deep mocks; keep tests black-box where possible.
- For VS Code-specific behavior, use integration tests when appropriate (commands, editors, providers).

## Contribution/Manifest Discipline
Any change that introduces or modifies a command, setting, view, or activation behavior MUST keep:
- `package.json` contributions and code registrations in sync.
- Activation events as narrow as practical to protect startup performance.
- Minimum `engines.vscode` compatibility conservative; raise only when required by used APIs.

## Security & Privacy
The extension MUST not exfiltrate sensitive workspace content. Any telemetry/logging MUST be
explicit, minimal, and avoid secrets/PII. Webview security requirements (CSP + sanitization) apply
to any rendered workspace-derived content.

## Governance

All pull requests and reviews must verify compliance with this constitution. Any deviation from these principles requires a formal amendment to this document. Amendments require documentation, approval, and a migration plan if they introduce breaking changes.

Amendment procedure:
- Propose the change (what principle changes, why, and how to migrate/verify).
- Bump version (SemVer):
  - MAJOR: backward-incompatible governance/principle removals or redefinitions
  - MINOR: new principle/section or materially expanded guidance
  - PATCH: clarifications/typos/non-semantic refinements
- Update dependent templates under `.specify/templates/` to keep gates aligned.

Compliance expectations:
- Reviewers MUST treat the “Constitution Check” as a merge gate for relevant changes.
- If a change cannot comply, the PR MUST document the exception and include an amendment proposal.

**Version**: 1.1.0 | **Ratified**: 2025-12-08 | **Last Amended**: 2025-12-12