# Developing and Using a Local VS Code Extension in Cursor

## Purpose

This document is a pragmatic guide for building, running, debugging, and installing a **local VS Code extension** while using **Cursor** as your editor. Cursor is *largely compatible* with the VS Code extension ecosystem, but there are operational differences that can impact activation, debugging, and telemetry/noise in logs.

---

## 1) Mental model: what Cursor is (for extension developers)

Cursor is a **VS Code-derived editor** that runs extensions inside an **Extension Host** process similar to VS Code.

Implications:

* Most VS Code extension APIs work as expected.
* Some Microsoft marketplace-specific behaviors and “engine compatibility” constraints can differ.
* Cursor ships with its own **embedded VS Code engine version**; your extension must be compatible with that version.

---

## 2) The single biggest compatibility constraint: `engines.vscode`

Your extension’s `package.json` declares a required VS Code engine version:

```json
{
  "engines": {
    "vscode": "^1.90.0"
  }
}
```

If Cursor’s embedded VS Code engine is *lower* than what your extension declares, you can see symptoms like:

* Extension does not activate.
* Commands do not appear.
* Activation events seem ignored.
* No obvious errors, or only vague “incompatible” messages.

### How to align versions

1. In Cursor, open **About** and note the VS Code engine version it reports.
2. Set:

   * `engines.vscode` to a range compatible with Cursor’s engine.
   * `@types/vscode` to the same major/minor API line.

Example:

```json
{
  "engines": { "vscode": "^1.88.0" },
  "devDependencies": {
    "@types/vscode": "1.88.0"
  }
}
```

### Practical rule

* Prefer targeting the **lowest engine version** you need (within reason), and use feature detection when possible.

---

## 3) Recommended dev workflows (choose one)

### Workflow A (recommended for reliability): edit in Cursor, debug in VS Code

If you want the most predictable extension debugging:

* Use Cursor to edit code.
* Use VS Code to run the official **Extension Development Host** flow.

Benefits:

* Lowest friction when Cursor engine/API differs.
* Best support for extension debugging features and documentation.

### Workflow B: debug inside Cursor (works often, but expect edge cases)

Cursor generally supports extension debugging, but if you hit friction:

* Prefer packaging to VSIX (Workflow C) and install locally.
* Verify the engine version alignment.

### Workflow C (highly practical): package & install VSIX locally

For local testing that mirrors “real install”, package your extension and install it into Cursor.

#### Steps

1. Build your extension (TypeScript example):

```bash
npm run build
```

2. Package:

```bash
npx @vscode/vsce package
```

3. Install into Cursor:

* Extensions view → “…” menu → **Install from VSIX…**
* Select the generated `.vsix`

4. Reload Cursor window.

Benefits:

* Avoids some dev-host weirdness.
* Tests the extension exactly as installed.

---

## 4) Handling noisy logs and telemetry errors in Cursor

You may see logs like:

* `OTLPExporterError: Bad Request (400) ... Trace spans collection is not enabled for this user`
* `ECONNRESET` originating from Cursor internal extensions

Key point:

* These are typically **Cursor-internal** telemetry/export behaviors, not your extension.

### What to do

* If a profiler/telemetry extension is enabled (e.g., an LSP profiler), disable it while developing.
* If you must keep it enabled, filter logs and focus on your extension’s output channels.

### Best practice for your extension logs

* Create an OutputChannel:

```ts
const out = vscode.window.createOutputChannel('SpecKit Companion');
out.appendLine('Activated');
```

* Add a config flag:

  * `myExtension.enableLogging: boolean`
  * When false, avoid verbose logs.

---

## 5) Running locally: launch configs and extension host

### Launch configuration (typical)

In your extension repo, ensure you have a `launch.json` similar to:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}"
      ],
      "outFiles": [
        "${workspaceFolder}/out/**/*.js"
      ],
      "preLaunchTask": "npm: build"
    }
  ]
}
```

If Cursor’s debugger flow is inconsistent, fall back to:

* VS Code for debugging, Cursor for editing
* or package+install VSIX

---

## 6) Fast checks when “my extension doesn’t activate”

1. **Engine mismatch**

   * Check Cursor VS Code engine vs `engines.vscode`.

2. **Activation events**

   * Example:

```json
"activationEvents": [
  "onCommand:speckit.run",
  "workspaceContains:spec.md"
]
```

3. **Command registration matches `contributes.commands`**

* `package.json`:

```json
"contributes": {
  "commands": [{
    "command": "speckit.run",
    "title": "SpecKit: Run"
  }]
}
```

* `extension.ts`:

```ts
context.subscriptions.push(
  vscode.commands.registerCommand('speckit.run', async () => {
    // ...
  })
);
```

4. **Extension host logs**

* Use OutputChannel.
* Add explicit “Activated” log line.

5. **Build output is present**

* Ensure `main` points to built JS:

```json
"main": "./out/extension.js"
```

---

## 7) Local workspace testing patterns

### Test with a dedicated “example workspace”

Keep:

* `examples/todo-gemini/` (or similar)

Run your extension host with that folder opened.

### Use workspace-based activation

If your extension is spec-driven, these activation events are high-signal:

* `workspaceContains:spec.md`
* `workspaceContains:.specify/`
* `onLanguage:markdown` (if relevant)

---

## 8) Packaging and versioning for local forks

If you fork an extension and want to install it side-by-side:

* Change `publisher` and `name` (or at least `publisher`).
* Change `displayName` to avoid confusion.
* Bump version.

Example:

```json
{
  "publisher": "felipeblassioli",
  "name": "speckit-companion-fork",
  "displayName": "SpecKit Companion (Fork)",
  "version": "0.0.1"
}
```

---

## 9) Cursor-specific operational tips

* Treat Cursor as “VS Code-like”, but don’t assume its engine version matches latest VS Code.
* For stubborn issues, prefer:

  1. VS Code for debugging, Cursor for editing, or
  2. VSIX install for local testing

This gives you deterministic behavior and reduces time spent fighting editor-specific quirks.

---

## 10) Minimal checklist (copy/paste)

* [ ] Cursor engine version checked
* [ ] `engines.vscode` aligned
* [ ] `@types/vscode` aligned
* [ ] `main` points to built output (`out/`)
* [ ] `activationEvents` correct
* [ ] `contributes.commands` matches registered commands
* [ ] OutputChannel present for activation logs
* [ ] VSIX packaging works; install-from-VSIX works
* [ ] Noisy profiler/telemetry extensions disabled while debugging
