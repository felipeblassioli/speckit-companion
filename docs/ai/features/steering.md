# Feature: Steering documents (Steering view)

## What it does
Manages "steering" (guidance) documents for the current AI provider:
- shows "Global" and "Project" steering files (provider-dependent)
- lists steering docs in a steering directory (provider-dependent)
- provides commands to create/refine/delete steering docs

## Entry points
- **View**: `speckit.views.steering` ("Steering") in `package.json`
  - Provider: `src/features/steering/steeringExplorerProvider.ts`
  - Registered in `src/extension.ts`
- **Commands**
  - `speckit.steering.create` → `src/features/steering/steeringCommands.ts` → `SteeringManager.createCustom()` (`src/features/steering/steeringManager.ts`)
  - `speckit.steering.refine` → `SteeringManager.refine(...)`
  - `speckit.steering.delete` → deletes file + asks AI to update references (`SteeringManager.delete(...)`)
  - `speckit.steering.refresh` → refreshes view
  - `speckit.steering.createUserRule` / `speckit.steering.createProjectRule` → creates steering "rule" files (`src/features/steering/steeringManager.ts`)

## User flow
1. Open "Steering" view in SpecKit activity bar.
2. Depending on provider (`speckit.aiProvider`):
   - Claude: shows `~/.claude/CLAUDE.md` and workspace `CLAUDE.md` if present, plus `.claude/steering/*.md`.
   - Gemini: shows `~/.gemini/GEMINI.md` and workspace `GEMINI.md` (no steering dir).
   - Copilot: shows workspace `.github/copilot-instructions.md` and `.github/instructions/*.instructions.md`.
   (Logic in `src/features/steering/steeringExplorerProvider.ts` and provider definitions in `src/ai-providers/aiProvider.ts`.)
3. Run "Create Custom Steering" to prompt AI to author a steering doc into the provider steering directory (`SteeringManager.createCustom()`).

## Configuration
- **AI provider selection**: `speckit.aiProvider` (`package.json`) read via `src/ai-providers/aiProvider.ts`.
- **Steering base path** comes from ConfigManager settings file (not VS Code settings):
  - Base path: `ConfigManager.getPath('steering')` (`src/features/steering/steeringManager.ts`)
  - Config file: `.claude/settings/speckit-settings.json` (see `src/core/utils/configManager.ts`)

## Behavioral details
- `delete`:
  - deletes the steering file (`vscode.workspace.fs.delete`)
  - runs a **headless AI prompt** to update `CLAUDE.md` references (`SteeringManager.delete(...)` in `src/features/steering/steeringManager.ts`)
- View menu integration:
  - context menu for steering documents uses `viewItem == steering-document` (`package.json` menus)
  - tree items set `contextValue: 'steering-document'` (`src/features/steering/steeringExplorerProvider.ts`)

## Telemetry/logging
- Output channel logs for deletes and refreshes (`src/features/steering/steeringCommands.ts`, `src/features/steering/steeringManager.ts`).

## Failure modes
- No workspace folder → operations error early (`src/features/steering/steeringManager.ts`).
- Provider-specific missing paths simply hide items (e.g. no `globalPath` for copilot) (`src/features/steering/steeringExplorerProvider.ts`).

## Implementation map
- **Commands**: `src/features/steering/steeringCommands.ts`
- **Manager (file ops + AI prompts)**: `src/features/steering/steeringManager.ts`
- **Tree view**: `src/features/steering/steeringExplorerProvider.ts`
- **Provider path model**: `src/ai-providers/aiProvider.ts`
