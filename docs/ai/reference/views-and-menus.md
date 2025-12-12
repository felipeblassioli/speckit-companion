# Views and Menus

## View containers and views
Declared in `package.json`:
- **Activity bar container**: `speckit` titled "SpecKit" (`contributes.viewsContainers.activitybar`)
- **Views in container `speckit`** (`contributes.views`):
  - `speckit.views.explorer` — Specs
  - `speckit.views.agents` — Agents
  - `speckit.views.skills` — Skills
  - `speckit.views.steering` — Steering
  - `speckit.views.mcp` — MCP Servers
  - `speckit.views.hooks` — Hooks
  - `speckit.views.settings` — Settings (collapsed by default)

Providers registered in `src/extension.ts` via `vscode.window.registerTreeDataProvider(...)`.

## `viewsWelcome` content
Declared in `package.json`:
- Specs view shows different welcome content gated by contexts:
  - `!speckit.cliInstalled` → "Install SpecKit CLI" button
  - `speckit.cliInstalled && !speckit.detected` → "Initialize SpecKit"
  - `speckit.detected` → "Create New Spec"
- Steering view shows create rule buttons.
- MCP and Skills views show informational guidance.
- Settings view shows "Open Settings".

## Menus (where commands appear)
Declared in `package.json` → `contributes.menus`:
- **`view/title`** (toolbar on view headers)
  - Specs: `speckit.create`, `speckit.refresh`
  - Steering: `speckit.steering.create`, `speckit.steering.refresh`
  - MCP: `speckit.mcp.refresh`
  - Hooks: `speckit.hooks.refresh`
  - Agents: `speckit.agents.refresh`
  - Skills: `speckit.skills.refresh`
- **`view/item/context`**
  - Specs: `speckit.delete` when `viewItem == spec`
  - Steering: `speckit.steering.refine` and `speckit.steering.delete` when `viewItem == steering-document`
- **`commandPalette`**
  - Many SpecKit phase commands are gated by `when: speckit.detected` (`package.json`).

## Tree item context values (`viewItem`)
These are set via `TreeItem.contextValue` in providers:
- Specs (`src/features/specs/specExplorerProvider.ts`)
  - spec root item: `contextValue = 'spec'`
  - documents: `contextValue = 'spec-document-spec' | 'spec-document-plan' | 'spec-document-tasks'`
  - related docs: `contextValue = 'spec-related-doc'`
- Steering (`src/features/steering/steeringExplorerProvider.ts`)
  - steering document: `contextValue = 'steering-document'`

## Context keys used by `when`
These are set by the extension (via `vscode.commands.executeCommand('setContext', ...)`) and referenced in `package.json`:
- `speckit.cliInstalled` (set in `src/speckit/detector.ts`)
- `speckit.detected` (set in `src/speckit/detector.ts`)
- `speckit.constitutionNeedsSetup` (set in `src/speckit/detector.ts`)
