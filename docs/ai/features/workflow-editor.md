# Feature: Workflow Editor (custom editor for spec markdown)

## What it does
Provides a **custom editor** (`speckit.workflowEditor`) for spec markdown files (anything matching `**/specs/**/*.md`) that renders content and exposes workflow actions via buttons (phase navigation, regenerate, edit source, etc.).

## Entry points
- **Custom Editor**
  - Declared: `package.json` → `contributes.customEditors` viewType `speckit.workflowEditor`
  - Registered at runtime when enabled: `src/extension.ts` (`WorkflowEditorProvider.register(...)`)
- **Commands (declared in `package.json`)**
  - `speckit.workflowEditor.editSource`
  - `speckit.workflowEditor.refineSection`
  - `speckit.workflowEditor.removeSection`
  - `speckit.workflowEditor.addUserStory`
  - `speckit.workflowEditor.approveAndContinue`
  - `speckit.workflowEditor.regenerate`
  - `speckit.workflowEditor.navigateToPhase`
  - Registered: `src/features/workflow-editor/workflowEditorCommands.ts`

## User flow
1. Click `spec.md` / `plan.md` / `tasks.md` in the Specs view:
   - The provider opens with `vscode.openWith` → editor `speckit.workflowEditor` (`src/features/specs/specExplorerProvider.ts`).
2. In the webview UI:
   - **Edit Source** opens the file in the default text editor (`src/features/workflow-editor/workflow/actionHandlers.ts`).
   - **Regenerate** invokes `speckit.specify|plan|tasks` based on phase (`src/features/workflow-editor/workflow/actionHandlers.ts`).
   - **Approve & Continue** opens/creates the next phase document and may run `speckit.implement` on tasks completion (`src/features/workflow-editor/workflow/actionHandlers.ts`).

## Configuration
- `speckit.workflowEditor.enabled` (boolean)  
  - Declared in `package.json` settings
  - Read in `src/extension.ts` via `getConfiguration('speckit').get('workflowEditor.enabled', true)`

## Behavioral details
- **Message protocol**
  - Webview → extension message union: `src/core/types.ts`
  - Handler: `WorkflowEditorProvider.handleMessage(...)` in `src/features/workflow-editor/workflowEditorProvider.ts`
- **CSP**
  - Webview HTML includes CSP + nonce (`src/features/workflow-editor/workflow/htmlGenerator.ts`).
  - Loads external scripts from `https://cdn.jsdelivr.net` (Mermaid + highlight.js) (`src/features/workflow-editor/workflow/htmlGenerator.ts`).
- **Local assets**
  - Uses `webview.asWebviewUri` to load `dist/webview/workflow.css` and `dist/webview/workflow.js` (`src/features/workflow-editor/workflow/htmlGenerator.ts`).
  - `localResourceRoots` includes extension `webview` and `dist/webview` (`src/features/workflow-editor/workflowEditorProvider.ts`).

## Telemetry/logging
- Logs open/close + messages to output channel (`src/features/workflow-editor/workflowEditorProvider.ts`, `src/features/workflow-editor/workflow/actionHandlers.ts`).

## Failure modes
- **Missing next file**: navigation shows warning if file doesn't exist (`src/features/workflow-editor/workflow/actionHandlers.ts`).
- **Refine line command appears incomplete**:
  - `WorkflowActionHandlers.refineLine(...)` executes `vscode.commands.executeCommand('speckit.workflowEditor.refineLine', ...)` (`src/features/workflow-editor/workflow/actionHandlers.ts`)
  - But `speckit.workflowEditor.refineLine` is **not contributed** in `package.json` and is **not registered** in `src/features/workflow-editor/workflowEditorCommands.ts`. This likely means "refine line" paths won't work end-to-end as written.

## Implementation map
- **Custom editor provider**: `src/features/workflow-editor/workflowEditorProvider.ts`
- **Webview HTML + CSP**: `src/features/workflow-editor/workflow/htmlGenerator.ts`
- **Actions**: `src/features/workflow-editor/workflow/actionHandlers.ts`
- **Message types**: `src/core/types.ts`
- **Command registrations (workflow-editor.*)**: `src/features/workflow-editor/workflowEditorCommands.ts`
