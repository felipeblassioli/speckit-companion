# Feature: Spec workflow (Specs view + SpecKit commands)

## What it does
Provides a Specs tree view and commands that drive the SpecKit workflow by sending **slash commands** (e.g. `/speckit.plan`) to the configured AI CLI in an integrated terminal.

## Entry points
- **View**: "Specs" tree view  
  - `package.json` → `contributes.views` id `speckit.views.explorer`
  - Provider registered in `src/extension.ts` (`registerTreeDataProvider(Views.explorer, ...)`)
- **Commands**
  - `speckit.create` (Create New Spec) — `package.json` and handler in `src/features/specs/specCommands.ts`
  - `speckit.specify`, `speckit.plan`, `speckit.tasks`, `speckit.implement`, `speckit.clarify`, `speckit.analyze`, `speckit.checklist` — `package.json`, registered in a loop in `src/features/specs/specCommands.ts`
  - `speckit.constitution` — `package.json`, handler in `src/features/specs/specCommands.ts`
  - `speckit.refresh` — `package.json`, handler in `src/features/specs/specCommands.ts`
  - `speckit.delete` — `package.json`, handler in `src/features/specs/specCommands.ts`

## User flow
1. Open the **SpecKit** activity bar container (`package.json` → `viewsContainers.activitybar` id `speckit`).
2. In the **Specs** view:
   - If SpecKit CLI isn't installed, the view welcome links to `speckit.installCli` (`package.json` → `viewsWelcome`).
   - If the workspace isn't initialized, the view welcome links to `speckit.initWorkspace` (`package.json` → `viewsWelcome`).
3. Run **Create New Spec**:
   - Command prompts for a description (`vscode.window.showInputBox`) and then runs `/speckit.specify <desc>` in the configured AI provider terminal (`src/features/specs/specCommands.ts`).
4. Use **Specify/Plan/Tasks/Implement**:
   - Each command resolves a spec directory (from active editor path under `specs/` or the argument) and runs `/speckit.<phase> <specDir>` in the AI provider terminal (`src/features/specs/specCommands.ts`).

## Configuration
- **Workspace state gates (contexts)**
  - `speckit.cliInstalled`, `speckit.detected` are set by SpecKit detection (`src/speckit/detector.ts`) and used in `package.json` `viewsWelcome` + command palette `when`.
- **AI provider**
  - Setting `speckit.aiProvider` (`package.json` → `contributes.configuration.properties`)
  - Read in `src/ai-providers/aiProvider.ts` (`getConfiguration('speckit').get('aiProvider')`)
  - Provider selected in `src/extension.ts` via `AIProviderFactory.getProvider(...)`

## Behavioral details
- **Safety**: `speckit.create` sanitizes the user input before embedding into the prompt (`src/core/utils/sanitize.ts`, called from `src/features/specs/specCommands.ts`).
- **Spec deletion**: deletes `specs/<specName>` recursively using `vscode.workspace.fs.delete` (`src/features/specs/specCommands.ts`).
- **Tree view content**:
  - Root items are spec folders under `specs/` (`src/features/specs/specExplorerProvider.ts`).
  - Child items are `spec.md`, `plan.md`, `tasks.md` opened with the custom editor `speckit.workflowEditor` via `vscode.openWith` (`src/features/specs/specExplorerProvider.ts`).

## Telemetry/logging
- Uses a dedicated output channel "SpecKit Companion" (`src/extension.ts`).
- Writes debug/trace lines (e.g. `outputChannel.appendLine(...)`) across spec commands (`src/features/specs/specCommands.ts`).

## Failure modes
- **No workspace folder**: many flows return early (`src/features/specs/specExplorerProvider.ts`, `src/features/specs/specCommands.ts`).
- **No spec directory**: phase commands show `No spec directory found...` (`src/features/specs/specCommands.ts`).
- **SpecKit not initialized**: `speckit.create` warns and offers to initialize (`src/features/specs/specCommands.ts`).

## Implementation map
- **Command registration**: `src/features/specs/specCommands.ts`
- **Specs tree**: `src/features/specs/specExplorerProvider.ts`
- **Activation / wiring**: `src/extension.ts`
- **SpecKit detection + context keys**: `src/speckit/detector.ts`
- **Custom editor openWith integration**: `src/features/specs/specExplorerProvider.ts` (uses viewType `speckit.workflowEditor`)
