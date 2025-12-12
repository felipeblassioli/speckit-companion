Below are **two Cursor rules** and **two Cursor slash commands** distilled from your `CLAUDE.md` plus reconciled with your `ARCHITECTURE.md`. The resulting artifacts encode: extension layering, provider/manager patterns, `.claude/` storage + spec workflow, webview message contracts, and CLI integration expectations.  

---

## 1) `.cursor/rules/speckit-companion/extension-architecture.mdc`

```mdc
---
title: SpecKit Companion — Extension Architecture
description: Conventions for layering, commands, providers, watchers, webview messaging, and CLI integration in the SpecKit Companion VS Code extension.
glob: "{src,webview-src}/**/*.{ts,tsx}"
alwaysApply: false
---

@file ../../../ARCHITECTURE.md

# SpecKit Companion — Extension Architecture

## What this rule enforces

This repository is a VS Code extension that provides spec-driven development UX and integrates with AI CLIs. Keep a strict separation between:
- **Commands** (UI entry points)
- **Providers** (VS Code views/editors)
- **Services/Managers** (business logic + filesystem)
- **Webview** (sandboxed UI with typed message bridge) 

## Directory + responsibility boundaries

Use the repository’s existing layout as the source of truth:

- `src/extension.ts`: activation + wiring (register commands, instantiate providers, start watchers).
- `src/commands/`: command handlers (thin orchestration).
- `src/providers/`: TreeDataProviders and workflow editor provider(s).
- `src/watchers/`: filesystem watchers (not business logic).
- `src/services/`: pure services (prompt loading, etc.).
- `src/features/<feature>/`: feature modules (permission caching, etc.).
- `src/shared/types/`: shared message / contract types.
- `webview-src/`: webview TypeScript (rendering, parsing, UI components).
- `webview/`: compiled assets.

## Command naming + registration

There is a known namespace mismatch between docs:
- Some guidance references `kfc.{feature}.{action}`.
- `package.json` command IDs are `speckit.*` (and these map to slash commands and extension commands).

Policy:
- **Prefer `speckit.<feature>.<action>` for any new command IDs.**
- If the repo still contains `kfc.*` IDs, keep them as **aliases** only when needed for backward compatibility.

Implementation requirements:
- Add command IDs to `package.json` under `contributes.commands` and (if relevant) `contributes.menus`.
- Register handlers during activation (typically in `activate()`).

## Providers (TreeDataProvider + custom editors)

Providers must be **UI-only adapters**:
- No direct “business decisions”.
- Delegate filesystem and workflow semantics to services/managers.
- After any mutation that affects a tree view, call `refresh()` on the relevant provider(s).

## Watchers

- Watchers monitor `.claude/` (and any other configured workspace folders) and trigger refreshes.
- Use debouncing to avoid refresh storms (existing behavior: ~1 second).

## File operations + error handling

Hard requirements:
- Always use `vscode.Uri` and workspace-relative paths (never raw string paths).
- Wrap filesystem operations in `try/catch`.
- Report errors via VS Code notifications (`vscode.window.showErrorMessage`) with actionable context.

## Webview messaging contract (Workflow Editor)

The workflow editor is a webview custom editor:
- Extension host -> webview: `documentChanged`, `updatePhaseInfo` (and any other typed messages)
- Webview -> extension host: `editSource`, `removeLine`, `refineLine`, `generateContent`

Rules:
- Message payloads must be **typed** (use the shared message union types).
- The extension host is the source of truth for document content; webview renders and requests actions.
- Action handling belongs in the workflow `actionHandlers` layer; it may invoke AI CLI integration, then apply edits to the document, which naturally triggers re-render through `documentChanged`.

## AI CLI integration (Claude Code / SpecKit CLI)

- Prefer “prompt file redirection” patterns for long prompts (avoid shell-escaping huge inline strings).
- Detect required CLIs (e.g., `specify`) before presenting actions that depend on them.
- Any command execution should be funneled through the existing provider/service (e.g., ClaudeCodeProvider), not scattered across unrelated modules.

## Anti-patterns to avoid

- Providers calling `fs` directly for anything beyond trivial reads.
- Webview applying edits without going through the extension host.
- Un-typed `postMessage` payloads (“stringly typed” messages).
- Running shell commands by concatenating user input (shell injection risk); use temp files + safe quoting.
```

Why this is faithful: it encodes the “manager/provider pattern”, `.claude/` storage expectations, `refresh()` discipline, and the webview message bridge described in your docs.   

---

## 2) `.cursor/rules/speckit-companion/spec-workflow-and-storage.mdc`

```mdc
---
title: SpecKit Companion — Spec Workflow & Workspace Storage
description: Rules for editing spec artifacts and workspace state under .claude/, including phase transitions and approval gates.
glob: "{.claude,specs}/**/*.{md,json}"
alwaysApply: false
---

# SpecKit Companion — Spec Workflow & Workspace Storage

## Workspace storage model

User/workspace data lives under `.claude/`:
- `.claude/specs/<spec-name>/requirements.md`
- `.claude/specs/<spec-name>/design.md`
- `.claude/specs/<spec-name>/tasks.md`
- `.claude/steering/*.md`
- `.claude/settings/*.json` (repo may contain legacy naming; do not invent new filenames)

When writing code that reads/writes this:
- Be resilient to “legacy vs current” filename differences (prefer: detect existing file; do not hardcode one without fallback).
- Never assume `.claude/` exists: create it via workspace-safe APIs when needed.

## Spec workflow phase machine (approval-gated)

The spec flow is explicitly staged and requires approval gates:

1. Requirements → Review → Design
2. Design → Review → Tasks
3. Tasks → Review → Complete

Rule:
- Do not advance phases automatically.
- When implementing phase transitions, require an explicit user confirmation step in the UI (button, prompt, or command).

## Prompt ownership

- Prompt templates belong in `src/prompts/` and should reflect the phase machine.
- The “agent system prompt” and/or prompt loader must enforce phase constraints consistently across commands and webview actions.

## Editing rules for spec artifacts

When modifying `requirements.md`, `design.md`, or `tasks.md`:
- Preserve user content; do not reformat the entire file unless the user explicitly requests it.
- Prefer localized edits (line-level replace/insert) driven by webview actions (`refineLine`, `removeLine`, `generateContent`).
- Keep tasks actionable: one atomic task per bullet/checkbox where feasible.

## Safety + UX expectations

- Any destructive edit (delete section, remove line) should be:
  - previewable, or
  - reversible (at minimum via undo / editor history).

- Errors must be surfaced with actionable detail (what file, what operation, how to fix).
```

Why this is faithful: it encodes the `.claude/` layout and the 3-stage workflow with explicit approval requirements. 

---

## 3) `.cursor/commands/speckit-xray.md` (analysis-only)

```md
---
name: /speckit-xray
summary: Produce an architecture x-ray of the SpecKit Companion extension.
description: Scans the repo to map commands/providers/watchers/webview message contracts, highlights drift vs docs, and outputs a concise code-map for onboarding and maintenance.
alwaysApply: false
---

# /speckit-xray — SpecKit Companion Architecture X-Ray

## Objective
- Output a single Markdown report that maps:
  - command IDs → handlers
  - providers/editors → data sources → refresh triggers
  - watchers → what they watch → debounce behavior
  - webview message types → handlers → edit application path
  - CLI integration points (SpecKit CLI + Claude Code)
- Flag any drift vs documented expectations (namespace mismatches, storage path mismatches, untyped messaging, etc.).

## Inputs / assumptions
- Repository root is open.
- Inspect `package.json`, `src/extension.ts`, `src/commands/**`, `src/providers/**`, `src/watchers/**`, `src/shared/types/**`, `webview-src/**`.

## Constraints
- Analysis-only: do not modify files.
- If something is ambiguous, cite the exact file + symbol + snippet in the report.

## Steps
1. Inventory `contributes.commands` in `package.json`; list all command IDs.
2. Find where each command ID is registered/wired in activation code.
3. List providers:
   - Tree views (specs/steering/agents/hooks/mcp)
   - Custom editor provider(s) for workflow
4. Watchers:
   - Identify `.claude/` watchers and confirm debounce duration.
   - Identify the refresh targets (which provider refreshes on what event).
5. Webview bridge:
   - Locate `MessageTypes` unions and enumerate messages.
   - Map `refineLine/removeLine/editSource/generateContent` to handler entry points.
   - Trace end-to-end edit application (message → handler → document edit → onDidChange → documentChanged).
6. CLI integration:
   - Locate CLI detection (`specify` in PATH) and command building.
   - Locate Claude Code provider usage and the “prompt file redirection” approach.
7. Explicitly check for any placeholder/test behavior in CLI execution (e.g., the `echo "HELLO WORLD"` placeholder) and report exact location(s).

## Output format
Return `docs/ai/speckit-xray.md` content (do not write it; just output it) with:
- Overview (10 lines max)
- Code-map (bulleted)
- Drift findings (prioritized)
- Quick-fix recommendations (no patches, just bullet points)

## Verification
- Confirm every claim references a concrete file path + symbol name.
```

This command explicitly checks for the known placeholder CLI command mentioned in `CLAUDE.md`. 

---

## 4) `.cursor/commands/speckit-scaffold-command.md` (edits allowed, but controlled)

```md
---
name: /speckit-scaffold-command
summary: Scaffold a new Speckit command end-to-end (ID, handler, wiring, menus).
description: Adds a new command using the repo’s existing patterns: package.json contributes, activation wiring, handler module, and optional menus/context actions.
alwaysApply: false
---

# /speckit-scaffold-command — Scaffold a new command

## Objective
- Add a new command end-to-end with consistent naming and minimal diff:
  - command ID in `package.json`
  - handler in `src/commands/`
  - activation wiring in `src/extension.ts` (or existing registration module)
  - optional menu/context entry if requested

## Inputs
- `commandId`: prefer `speckit.<feature>.<action>`
- `title`: human name in command palette
- Optional:
  - `category` (for grouping)
  - menu contribution target (explorer/context/editor)

## Constraints
- Do not rename existing command IDs.
- Do not “refactor while here”.
- If a namespace mismatch exists (legacy `kfc.*`), keep behavior backward-compatible (alias only if necessary).

## Steps
1. Inspect current command registration approach:
   - Confirm how handlers are grouped (single register function vs inline registerCommand calls).
2. Update `package.json`:
   - Add `contributes.commands` entry for `commandId` + `title`.
   - If menu/context is requested, add minimal `contributes.menus` entry.
3. Create `src/commands/<feature>/<action>.ts` (or match existing naming layout):
   - Export a handler function with signature `(ctx) => Promise<void>` or the repo’s established signature.
   - Keep handler thin: validate inputs, call service/manager, refresh providers if needed.
4. Wire activation:
   - Register the handler in `activate()` and push disposable to subscriptions.
5. If the command mutates any `.claude/` or `specs/` state:
   - Ensure it uses `vscode.Uri`, try/catch, and refreshes affected views.
6. Add a minimal usage note:
   - Where the command appears (palette/context)
   - What it changes (files/dirs)
   - How to verify manually

## Output format
- Provide a patch-style “before/after” diff for each file touched:
  - `package.json`
  - `src/extension.ts` (or registration file)
  - new handler file(s)

## Verification
- `npm run compile` must succeed.
- If the repo uses `npm run watch`, confirm the new file is picked up.
```

This command aligns with how your docs describe command registration (package.json contributes + activation wiring) and the provider refresh discipline after data changes.  
