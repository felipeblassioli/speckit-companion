# Webviews

## 1) Workflow Editor webview (Custom Editor)
- **Type**: `CustomTextEditorProvider` webview (`vscode.window.registerCustomEditorProvider`)
- **View type**: `speckit.workflowEditor`
  - Declared in `package.json` (`contributes.customEditors`)
  - Registered in `src/features/workflow-editor/workflowEditorProvider.ts`
- **Resources**
  - Local: `dist/webview/workflow.css`, `dist/webview/workflow.js` (loaded via `asWebviewUri`)  
    - HTML generator: `src/features/workflow-editor/workflow/htmlGenerator.ts`
  - Remote: Mermaid and highlight.js from `https://cdn.jsdelivr.net` (`src/features/workflow-editor/workflow/htmlGenerator.ts`)
- **Security**
  - CSP includes `default-src 'none'` and uses a nonce for scripts (`src/features/workflow-editor/workflow/htmlGenerator.ts`)
  - `localResourceRoots` restricts file access (`src/features/workflow-editor/workflowEditorProvider.ts`)
- **Message protocol**
  - Message types defined in `src/core/types.ts`
  - Extension receives messages in `WorkflowEditorProvider.handleMessage(...)` (`src/features/workflow-editor/workflowEditorProvider.ts`)
  - Extension posts `documentChanged` messages on document edits (`src/features/workflow-editor/workflowEditorProvider.ts`)

## 2) Permission prompt webview (panel)
- **Type**: `vscode.window.createWebviewPanel(...)`
- **Panel id/title**: `claudePermission` / "Claude Code Permission" (`src/features/permission/permissionWebview.ts`)
- **Resource**: loads HTML from `media/permission.html` (`src/features/permission/permissionWebview.ts`, `media/permission.html`)
- **Message protocol**: simple `accept` / `cancel` / `openIssue` commands (`src/features/permission/permissionWebview.ts`)
- **Status**: appears **unused** (no references to `PermissionWebview` outside its own file).
