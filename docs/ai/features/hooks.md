# Feature: Hooks (Hooks view, Claude-only)

## What it does
Displays Claude Code hook configuration read from:
- workspace `.claude/settings.json`
- user `~/.claude/settings.json`

and shows hook triggers and hook commands in a tree.

## Entry points
- **View**: `speckit.views.hooks` ("Hooks") in `package.json`
  - Provider: `src/features/hooks/hooksExplorerProvider.ts`
  - Registered in `src/extension.ts`
- **Command**
  - `speckit.hooks.refresh` in `package.json`
  - Registered: `src/speckit/utilityCommands.ts`

## User flow
1. Select AI provider = Claude (otherwise the view shows an informational item).
2. Open "Hooks" view:
   - If no hooks exist, view shows "No Claude Code hooks configured" (`src/features/hooks/hooksExplorerProvider.ts`).
   - Otherwise, expand a hook to see triggers and command entries (`src/features/hooks/hooksExplorerProvider.ts`).

## Configuration
- Determined by `speckit.aiProvider` (`src/ai-providers/aiProvider.ts`).

## Behavioral details
- Reads JSON directly from disk using Node `fs`:
  - workspace: `<workspace>/.claude/settings.json`
  - global: `~/.claude/settings.json`
  (`src/features/hooks/hooksExplorerProvider.ts`)
- NOTE: Hook command items reference a command id `kfc.hooks.copyCommand` (`src/features/hooks/hooksExplorerProvider.ts`), but no registration for it exists in the repo (search shows no `registerCommand` for it). Treat as **declared-in-code but not implemented**.

## Telemetry/logging
- Some errors are logged via `console.error(...)` (`src/features/hooks/hooksExplorerProvider.ts`).

## Failure modes
- Provider not Claude → view shows "Hooks not supported…" (`src/features/hooks/hooksExplorerProvider.ts`).
- Invalid JSON in settings files → logs error and may show incomplete hook list (`src/features/hooks/hooksExplorerProvider.ts`).

## Implementation map
- **Tree view + parsing**: `src/features/hooks/hooksExplorerProvider.ts`
- **Refresh command**: `src/speckit/utilityCommands.ts`
