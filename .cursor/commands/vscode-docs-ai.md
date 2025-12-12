---
name: /vscode-docs-ai
summary: Map and document all user-facing features of a VS Code extension into docs/ai (feature inventory, UX flows, settings, commands, and troubleshooting).
description: >
Read-only audit that converts a VS Code extension’s manifest + implementation into a
consistent documentation set under docs/ai. Produces Markdown files that describe
features, commands, settings, views, webviews, language features, and common flows,
optimized for onboarding and AI-assisted development.
alwaysApply: false
---

# /vscode-docs-ai — VS Code Extension AI Docs Feature Map

## Operating constraints (hard)

* **Read-only**. Do not change source code or configuration.
* Your output is **documentation only** (Markdown content to be copied into `docs/ai/`).
* Prefer **evidence from repo** over assumptions; cite file paths for each claim.

## Outputs (files under docs/ai)

Produce the following Markdown files as separate blocks (each with a clear filename header):

1. `docs/ai/README.md`
2. `docs/ai/features/index.md`
3. `docs/ai/features/<feature-slug>.md` (one per feature)
4. `docs/ai/reference/commands.md`
5. `docs/ai/reference/settings.md`
6. `docs/ai/reference/views-and-menus.md`
7. `docs/ai/reference/language-features.md` (if applicable)
8. `docs/ai/reference/webviews.md` (if applicable)
9. `docs/ai/troubleshooting.md`
10. `docs/ai/development.md` (how to run/debug/test/package)

If the extension is small, it’s acceptable to collapse feature pages into fewer docs, but you must still produce:

* `docs/ai/README.md`
* `docs/ai/reference/commands.md`
* `docs/ai/reference/settings.md`
* `docs/ai/development.md`

---

## What counts as a “feature”

A feature is any user-visible capability accessible via:

* Command palette command
* Menu item / keybinding
* View or Tree View (Explorer/Activity Bar)
* Webview panel/view
* Language integration (completion, hover, code actions, diagnostics, formatting)
* Background automation (watchers, scanners, sync jobs) that materially affects UX

Feature grouping rules:

* Group multiple commands into one feature when they represent one workflow (e.g., “Manage Datasets” with 3 commands).
* Split into separate features when UX flows differ or depend on different extension subsystems.

---

## Documentation style guide (strict)

* Use clear, developer-oriented language.
* Each feature page must include:

  1. **What it does** (1 paragraph)
  2. **Entry points** (commands/menus/views)
  3. **User flow** (step-by-step)
  4. **Configuration** (settings it reads)
  5. **Behavioral details** (edge cases, expected outputs)
  6. **Telemetry/logging** (if any)
  7. **Failure modes** (common errors + remediation)
  8. **Implementation map** (key files/modules)
* Avoid large code blocks; show only minimal snippets.
* Always include **file path references** for:

  * command registrations
  * config keys
  * webview message types
  * providers registrations

---

## Step-by-step workflow

### Step 0 — Confirm extension root

* Locate the extension `package.json` (contains `engines.vscode` and `contributes`).
* Record:

  * `name`, `displayName`, `publisher`, `version`
  * `activationEvents`, `main`/`browser`, `extensionKind`

### Step 1 — Extract the “contract surface” from package.json

Create raw inventories (these become the backbone of reference docs):

* Commands:

  * `contributes.commands[]`
  * `contributes.menus.*` (where commands appear)
  * `contributes.keybindings[]`
* Views:

  * `contributes.viewsContainers`, `contributes.views`
* Settings:

  * `contributes.configuration.properties`
* Language features:

  * `contributes.languages`, `grammars`, `snippets`, `languageConfiguration`
* Webviews:

  * identify view/panel registrations in code (not usually fully described in manifest)

### Step 2 — Build a command → handler map

For each command id:

* Find `registerCommand(commandId, handler)`.
* Record:

  * handler function name
  * module/file path
  * core services called
  * side effects (edits, file writes, network calls)

### Step 3 — Infer feature groups

* Group commands/views/providers into feature candidates.
* For each feature candidate, determine:

  * primary UX entry point
  * typical user workflow
  * key settings involved

### Step 4 — Webviews (if present)

For each webview:

* Identify creation site (`createWebviewPanel`, `WebviewViewProvider`).
* Document:

  * view/panel id
  * resource loading pattern
  * CSP approach
  * message protocol: inbound/outbound message types

### Step 5 — Language features (if present)

For each provider:

* Identify registration site.
* Document:

  * languages/selectors
  * provider types implemented
  * main algorithms/caches
  * performance strategy (debounce, caching, scanning)

### Step 6 — Settings and configuration behavior

* For each setting key:

  * type, default, description (from schema)
  * where read in code
  * whether changes are hot-reloaded (`onDidChangeConfiguration`)

### Step 7 — Development & troubleshooting

* Determine:

  * build command(s)
  * dev/debug loop (Extension Host)
  * tests (unit vs extension host) and commands
  * packaging (`vsce package`) and prepublish steps
* Capture common failure points:

  * missing dependencies
  * incompatible VS Code engine
  * webview CSP violations
  * remote/workspace permission issues

---

## Required reference doc content

### docs/ai/reference/commands.md

* Table:

  * Command ID | Title | Where exposed (palette/menu/keybinding) | Handler file | Side effects | Notes

### docs/ai/reference/settings.md

* Table:

  * Key | Type | Default | Description | Where read | Hot-reload behavior

### docs/ai/reference/views-and-menus.md

* Document:

  * views, view containers, view IDs
  * menu contributions and `when` clauses
  * contexts set by `setContext` and where

### docs/ai/reference/language-features.md (if applicable)

* For each language/provider:

  * selector
  * provider type
  * registration site
  * key files
  * performance notes

### docs/ai/reference/webviews.md (if applicable)

* For each webview:

  * id/type
  * entrypoint
  * resources
  * message protocol
  * security notes

---

## Evidence-driven search queries (use ripgrep)

Run these searches and use hits to populate docs (include file paths in docs):

### Contract surface

* `"contributes"` in extension `package.json`
* `contributes\\.commands` / `contributes\\.configuration` / `contributes\\.views` / `contributes\\.menus` / `contributes\\.keybindings`

### Command wiring

* `registerCommand\\(`
* `commands\\.executeCommand\\(`

### Views / contexts

* `registerTreeDataProvider` / `createTreeView`
* `setContext\\(`

### Webviews

* `createWebviewPanel` / `WebviewViewProvider`
* `onDidReceiveMessage` / `postMessage`
* `Content-Security-Policy` / `nonce` / `asWebviewUri`

### Language providers

* `registerCompletionItemProvider` / `registerHoverProvider`
* `registerCodeActionsProvider` / `createDiagnosticCollection`
* `vscode-languageclient` / `LanguageClient`

### Settings

* `getConfiguration\\(`
* `onDidChangeConfiguration`

### I/O + exec

* `child_process` / `exec` / `spawn`
* `fetch\\(` / `axios` / `undici`
* `workspace\\.fs` / `fs\\.`

---

## Output quality bar

* Every feature must have at least one **entry point** (command/view/provider) and at least one **implementation anchor** (file path).
* No “marketing” descriptions. Write docs as if they are used to:

  * onboard a dev
  * let an AI agent implement/refactor safely
  * support customer issues via troubleshooting.
* If you cannot find implementation for a contributed command/setting, label it clearly as:

  * **Declared but not implemented** (and list the evidence).
