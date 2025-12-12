# Feature: Settings view (Welcome-only) + Open Settings command

## What it does
Provides a "Settings" tree view container entry that currently shows **welcome content only** (no tree items), with a command to open VS Code settings filtered to `speckit`.

## Entry points
- **View**: `speckit.views.settings` in `package.json`
  - Registered: `src/extension.ts` with `OverviewProvider` (`src/features/settings/overviewProvider.ts`)
- **Command**: `speckit.settings.open`
  - Declared: `package.json`
  - Registered: `src/speckit/utilityCommands.ts`
  - Implementation: `workbench.action.openSettings` query `speckit`

## User flow
1. Open "Settings" view (it is `visibility: collapsed` by default in `package.json`).
2. Use view welcome "Open Settings" button (`package.json` → `viewsWelcome`) or run command from palette.
3. VS Code Settings UI opens to SpecKit Companion settings.

## Configuration
- View visibility is controlled by VS Code setting `speckit.views.settings.visible` in `package.json` (used in `when` clauses).
- Note: `OverviewProvider.getChildren()` returns `[]` so the view shows only `viewsWelcome` content (`src/features/settings/overviewProvider.ts`).

## Telemetry/logging
- None specific (beyond global output channel).

## Failure modes
- None significant.

## Implementation map
- `src/features/settings/overviewProvider.ts`
- `src/speckit/utilityCommands.ts`
- `package.json` (`contributes.views`, `viewsWelcome`, `contributes.configuration`)
