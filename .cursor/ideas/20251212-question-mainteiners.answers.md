---
date: 2025-12-12
repo: speckit-companion (personal fork)
---

## Maintainer Q&A (proposed “sensible” answers for this repo)

### 1) “What is the intended extension ID (publisher/name)?”
- **Answer**: Treat the extension identifier as **`${publisher}.${name}`** from `package.json`.
- **For this fork**: `felipeblassioli.speckit-companion`.
- **Action implied**: Any runtime lookups (e.g. `vscode.extensions.getExtension(...)`) and debug configs should reference that exact ID.

### 2) “Should built-in agents/system prompts be shipped? If yes, where are they generated?”
- **Answer**: Yes—this extension’s value proposition depends on `.claude/agents/...` + system prompts being available.
- **Sensible approach**:
  - Store them as **static extension assets** (e.g. `resources/agents/*.md`, `resources/prompts/*.md`) committed to the repo.
  - During build/package, ensure they’re included in the VSIX (via webpack copy or `files` + `.vscodeignore` exceptions).
  - On activation, copy/update them into the workspace `.claude/...` folder (already the design).
- **Why**: Relying on `dist/resources/**` without a deterministic build step to create them is fragile.

### 3) “Is workflow editor refine-line supposed to call Claude directly, or route through a command?”
- **Answer**: Route through a **registered VS Code command** (extension-side), not direct webview execution.
- **Why**: It keeps the webview “dumb”, makes it testable, and aligns with the core rule: “Every contributed/used command is registered.”
- **Implementation note**: Ensure `speckit.workflowEditor.refineLine` exists (currently the webview sends `refineLine` messages and the extension action handler tries to `executeCommand` a command with that ID).

### 4) “Do you want the webview to be offline-capable?”
- **Answer**: Prefer **offline-capable** by default.
- **Sensible approach**:
  - Bundle Mermaid/highlight.js (or an equivalent) into `dist/webview/` and reference via `webview.asWebviewUri(...)`.
  - Keep CSP strict and avoid remote script CDNs.
- **Why**: CDN dependencies are a reliability risk (offline/airgapped/enterprise) and complicate CSP.

### 5) “Are Remote-SSH/Codespaces scenarios a goal?”
- **Answer**: Yes, “works in Remote” should be a goal (even if not a web extension).
- **Sensible approach**:
  - Prefer `vscode.workspace.fs` over `fs` for workspace files.
  - Minimize assumptions about `HOME` and local paths; use VS Code storage APIs where possible.
  - Gate `child_process` usage carefully and avoid shell-string composition when you can (use argument vectors / safer APIs).

### 6) “What’s the intended UX for links inside spec docs?”
- **Answer**: Links should open via the extension layer using `vscode.env.openExternal(...)` (or `vscode.open` for workspace files).
- **Sensible approach**:
  - In the webview renderer, disallow `javascript:`/`data:` and other unsafe schemes.
  - Intercept clicks and `postMessage` the URL to the extension for validation + `openExternal`.
- **Why**: Treat workspace markdown as untrusted input; avoid giving the webview direct navigation power.

### 7) “Is the permission system meant to rely on ~/.claude.json long-term?”
- **Answer**: Short-term “yes” (pragmatic), long-term “ideally no”.
- **Sensible approach**:
  - Keep current behavior as a compatibility bridge.
  - Move toward a provider abstraction where Claude permission flows are handled by the Claude CLI UX itself (and the extension only detects/assists).
  - Avoid writing to user home in tests; in production, be explicit and transparent about what is read/written.

### 8) “Should MCP support exist for non-Claude providers beyond the info view?”
- **Answer**: Keep MCP server enumeration **Claude-only** unless Gemini/Copilot CLIs provide a stable equivalent.
- **Sensible approach**:
  - For Gemini/Copilot, show guidance (config path + docs) rather than attempting incompatible CLI calls.
  - If future provider CLIs standardize MCP listing, add provider-specific adapters under `src/ai-providers/`.

## Extra repo notes (not questions, but high-signal alignment items)
- **Command discipline**: ensure every command referenced by code or UI is registered (and if it’s user-facing, contributed in `package.json`).
- **Webview security**: enforce strict CSP + sanitize URLs + validate incoming messages (treat webview as untrusted).
- **Publishing hygiene**: keep `.vscodeignore` aligned so VSIX includes required runtime assets (webview bundle + resources) and excludes tests/dev-only files.


