---
name: /vscode-xray
summary: X-ray a VS Code extension repo: build a code-map, identify architectural patterns/quirks, and produce an onboarding pack for a new developer.
description: >
Read-only navigation + analysis of a VS Code extension codebase. Produces a structured
code-map (entrypoints, contributions, commands, services, webviews, language features,
storage, telemetry, tests, build/publish) plus “patterns & quirks” and a practical
onboarding guide (how to run, debug, test, package).
alwaysApply: false
---

# /vscode-xray — VS Code Extension X-Ray Onboarding Audit

## Operating constraints (hard)

* **Read-only**. Do not modify code, configs, dependencies, or lockfiles.
* Prefer **direct evidence** from the repo (files, code, `package.json`) over assumptions.
* If multiple packages exist (monorepo), scope your analysis to the **extension package** first, then note cross-package dependencies.

## Inputs (infer if not provided)

* Extension root (default: repo root).
* Target extension package (if monorepo): infer by locating `package.json` with `publisher`, `engines.vscode`, and `contributes`.

## What you will produce (deliverables)

Create a single Markdown report (paste into chat) with these sections:

1. **Repository Quick Facts**

   * Extension name, publisher, version, `engines.vscode`
   * Main entrypoint(s): `main`, `browser`, `activationEvents`, `extensionKind`
   * Build toolchain: TS compiler / bundler, lint/test runner, packaging tool

2. **High-level Architecture Map (one page)**

   * Entry points: activation, command wiring, services, adapters
   * Where cross-cutting concerns live: logging, config, telemetry, error handling

3. **Contributions Map (package.json X-ray)**

   * `contributes.commands`, menus, keybindings, views, webviews, configuration schema
   * Language features: grammars/snippets/language configuration/providers
   * Any `when` contexts and how they are set (`setContext`)

4. **Code Map (call graph + module map)**

   * Activation path: `activate()` → registrations → services
   * Command handlers (list command id → handler file → core behavior)
   * Key services / domain modules (what they own)
   * I/O boundaries: filesystem, network, child processes, git, OS

5. **Patterns & Quirks**

   * Patterns (what repeats): service locator, DI container, event bus, state machine, etc.
   * Quirks / footguns: global singletons, implicit state, heavy activation work, timing assumptions
   * Remote/web compatibility notes: direct `fs`, sockets, native deps, path assumptions

6. **How to Run / Debug / Test / Package (onboarding recipe)**

   * Dev loop (F5 / Extension Host)
   * Debug configuration(s): `.vscode/launch.json`, tasks
   * Tests (unit vs extension-host), how to run locally + CI
   * Packaging and publishing flow

7. **Risk & Quality Checklist**

   * Security: webview CSP/sanitization, command injection risk, unsafe filesystem writes
   * Reliability: disposables, cancellation, progress UX, error surfaces
   * Observability: logging, telemetry, user-facing errors, crash reporting

8. **First 5 Tasks for a New Developer**

   * A concrete onboarding sprint: reproduce build, run sample command, add a small feature, add a test, ship a pre-release

Include a final section:

* **“Questions to ask maintainers”** (5–10 pointed questions based on ambiguities you found).

---

## Step-by-step: how to perform the X-ray

### Step 0 — Identify the extension package

* Locate candidate `package.json` files.
* Pick the one that contains `engines.vscode` and `contributes`.
* Record:

  * `name`, `displayName`, `publisher`, `version`
  * `main` and/or `browser`
  * `activationEvents`, `extensionKind`
  * `contributes.*` keys present

### Step 1 — Build a repo index (file tree + “hot files”)

* Summarize the top-level structure (max depth 3):

  * `src/`, `out/`/`dist/`, `media/`, `resources/`, `syntaxes/`, `snippets/`, `test/`, `.vscode/`
* Identify hot files:

  * `src/extension.ts` (or equivalent)
  * command modules under `src/commands/`
  * webview sources under `src/webview/` or `media/`
  * any `client/` / `server/` language server code

### Step 2 — Activation X-ray

* Open the activation module and answer:

  * What does `activate(context)` do?
  * What is registered? (commands, providers, tree views, webviews, watchers)
  * Are disposables consistently pushed to `context.subscriptions`?
  * Is activation doing heavy synchronous work?
  * Are services lazily created or eagerly constructed?

### Step 3 — Commands map (the “what can the user do?” view)

* Build a table:

  * `commandId` → title → where contributed (command palette/menu/keybinding) → handler function → core dependencies
* For each command, capture:

  * input source (args, selection, active editor, configuration)
  * outputs (edits, UI messages, file writes, network calls)
  * cancellation/progress behavior (if any)

### Step 4 — Contributions map (the “how does VS Code see this extension?” view)

* Enumerate and briefly describe:

  * views/viewContainers, activity bar, tree data providers
  * configuration settings schema
  * menus and `when` clauses
  * keybindings
  * languages/grammars/snippets
  * debuggers, tasks, notebooks (if any)

### Step 5 — Webview / UI X-ray (if applicable)

* Identify webview entrypoints:

  * `WebviewPanel`, `WebviewViewProvider`
* Verify security posture:

  * CSP present? nonces? `asWebviewUri` used?
  * workspace-derived strings sanitized before HTML injection?
* Document message protocol:

  * inbound message types, validation, actions
  * outbound message types (state updates)

### Step 6 — Language features X-ray (if applicable)

* Determine which features exist:

  * completion, hover, code actions, diagnostics, formatting, semantic tokens
  * language server usage (`vscode-languageclient`) vs in-process providers
* Note performance considerations:

  * debouncing, caching, workspace scanning strategy

### Step 7 — State & storage

* Identify where state is persisted:

  * `context.globalState`, `context.workspaceState`, `SecretStorage`
* Identify configuration reads:

  * `workspace.getConfiguration()` usage patterns
  * dynamic reloading via `onDidChangeConfiguration`

### Step 8 — I/O boundaries and external dependencies

* Identify:

  * filesystem writes (paths, safe-guards)
  * network calls (endpoints, auth)
  * child processes / shell commands
  * git operations
* Label each as:

  * **safe** (scoped, validated, cancellable)
  * **risky** (shell injection, writes outside workspace, unbounded scans)

### Step 9 — Tests and release engineering

* Identify test types:

  * unit tests (pure TS)
  * extension host tests
* Identify tooling:

  * `@vscode/test-cli` / `@vscode/test-electron` / mocha
* Packaging:

  * `vsce` usage, `vscode:prepublish`, `.vscodeignore`
* CI:

  * how builds/tests/package are run

---

## Evidence-driven search queries (use ripgrep)

Run these searches and include key hits in your report (file path + brief summary; no long snippets):

### Manifest and contributions

* `"contributes"` in extension `package.json`
* `activationEvents`
* `extensionKind`
* `main` / `browser`

### Activation and commands

* `export async function activate` / `function activate`
* `registerCommand\(`
* `commands\.executeCommand\(`

### Context, menus, and state

* `setContext\(`
* `globalState` / `workspaceState` / `secrets`
* `getConfiguration\(` / `onDidChangeConfiguration`

### Webviews

* `createWebviewPanel` / `WebviewViewProvider`
* `webview\.html` / `asWebviewUri` / `postMessage` / `onDidReceiveMessage`
* `Content-Security-Policy` / `nonce`

### Language features

* `registerCompletionItemProvider` / `registerHoverProvider`
* `registerCodeActionsProvider` / `createDiagnosticCollection`
* `vscode-languageclient` / `LanguageClient`

### I/O boundaries

* `child_process` / `exec` / `spawn`
* `fetch\(` / `axios` / `undici`
* `fs\.` and `workspace\.fs`

### Telemetry / logging

* `telemetry` / `ApplicationInsights` / `aiKey`
* `OutputChannel` / `createOutputChannel`
* `console\.` (note any production console usage)

### Tests

* `@vscode/test` / `@vscode/test-cli` / `@vscode/test-electron`
* `mocha` / `jest` / `vitest`

---

## Output format requirements

Your final report must contain:

### A. One-paragraph executive summary

* What the extension does, where it’s “clever,” where it’s “fragile.”

### B. A dependency map (bullets)

* Major packages + why they matter.

### C. A command inventory table

* Command ID | Title | Entry point | Core dependencies | Side effects | Notes.

### D. A module map

* 10–25 most important modules/directories with ownership descriptions.

### E. “Patterns & Quirks” list

* Each item must have: (1) evidence location, (2) impact, (3) recommendation.

### F. Onboarding recipe

* Exact commands to:

  * install
  * build
  * run Extension Host
  * run tests
  * package a VSIX

### G. First 5 tasks

* Concrete checklist a new dev can execute in 1–2 days.

---

## Quality bar

* Prefer **specific file paths** over vague prose.
* Do not speculate; if unknown, state “unknown” and list what to inspect next.
* Focus on **developer onboarding leverage**: what a new dev needs to be productive fast.
