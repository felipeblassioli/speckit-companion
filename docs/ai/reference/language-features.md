# Language Features

This extension does not register VS Code language providers (no `registerCompletionItemProvider`, `registerHoverProvider`, diagnostics, etc. found in `src/**`).

It does register a **custom editor** (`speckit.workflowEditor`) for markdown files in `specs/` (see `package.json` → `contributes.customEditors` and `src/features/workflow-editor/workflowEditorProvider.ts`).
