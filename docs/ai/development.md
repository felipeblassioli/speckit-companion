# Development

## Build & run (from repo root)
- Install dependencies:

```bash
npm install
```

- Compile TypeScript:

```bash
npm run compile
```

- Run in VS Code Extension Host:
  - Use the launch config in `.vscode/launch.json` ("Run Extension")
  - It runs `npm: compile` as `preLaunchTask` and uses `dist/**/*.js` as `outFiles`

## Webview build pipeline
The extension uses webpack for webview assets:
- `npm run compile-web` (dev build)
- `npm run watch-web` (watch)
- `npm run package-web` (production build, used by `vscode:prepublish`)
(from `package.json` scripts)

The workflow editor expects built assets at:
- `dist/webview/workflow.css`
- `dist/webview/workflow.js`
(see `src/features/workflow-editor/workflow/htmlGenerator.ts`)

## Tests
- Runs Jest:

```bash
npm test
```

(see `package.json` scripts)

## Packaging
- Build VSIX:

```bash
npm run package
```

- Prepublish step:
  - `vscode:prepublish` runs `npm run package-web` (`package.json`)

## Architecture entry points
- Activation / providers / commands: `src/extension.ts`
- SpecKit CLI detection + contexts: `src/speckit/detector.ts`
- Command modules:
  - Spec commands: `src/features/specs/specCommands.ts`
  - CLI commands: `src/speckit/cliCommands.ts`
  - Utility commands: `src/speckit/utilityCommands.ts`
  - Steering commands: `src/features/steering/steeringCommands.ts`
  - Workflow editor commands: `src/features/workflow-editor/workflowEditorCommands.ts`
- Webview custom editor: `src/features/workflow-editor/workflowEditorProvider.ts`

## Notes for contributors
- Many flows depend on a configured AI CLI. Provider selection is via `speckit.aiProvider` and provider implementations are in `src/ai-providers/*`.
- Context keys (`speckit.cliInstalled`, `speckit.detected`, etc.) control UI visibility through `package.json` `when` clauses; they are set in `src/speckit/detector.ts`.
