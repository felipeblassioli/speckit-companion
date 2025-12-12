# Troubleshooting

## Specs view says "SpecKit CLI is not installed"
- Evidence: Specs `viewsWelcome` in `package.json` shows this when `!speckit.cliInstalled`.
- Fix:
  - Run **"Install SpecKit CLI"** (`speckit.installCli`) which runs `uv tool install specify-cli ...` (`src/speckit/detector.ts`).
  - Ensure `uv` is installed (note in `package.json` welcome text).

## Specs view says "SpecKit is not initialized in this workspace"
- Evidence: `package.json` welcome when `speckit.cliInstalled && !speckit.detected`.
- Fix:
  - Run **"Initialize SpecKit"** (`speckit.initWorkspace`) which runs `specify init .` in a terminal (`src/speckit/detector.ts`).

## "Create New Spec" does nothing / errors
Common causes:
- No workspace folder open (`src/features/specs/specCommands.ts` / `src/speckit/detector.ts`).
- AI provider isn't installed or fails to run (provider-specific; see `src/ai-providers/*`).

## Claude Code permission loop / extension says "permissions required"
- Evidence: startup calls `PermissionManager.initializePermissions()` (`src/extension.ts`).
- Fix:
  - Approve in the "Claude Code - Permission Setup" terminal spawned by `ClaudeCodeProvider.createPermissionTerminal()` (`src/ai-providers/claudeCodeProvider.ts`).
  - If the terminal was closed, retry when prompted (`src/features/permission/permissionManager.ts`).

## MCP Servers view is empty
- If provider is not Claude, the view only shows config guidance (`src/features/mcp/mcpExplorerProvider.ts`).
- If provider is Claude:
  - Ensure `claude` CLI is installed and `claude mcp list` works in your shell (`src/features/mcp/mcpExplorerProvider.ts` uses `exec`).

## Hooks view shows "not supported"
- Hooks are Claude-only (`src/features/hooks/hooksExplorerProvider.ts`).

## Update checks fail
- Evidence: update check uses `fetch` to GitHub API (`src/speckit/updateChecker.ts`).
- Fix:
  - Check network access / proxy settings.
  - Run "Check for Updates" (`speckit.checkForUpdates`) and inspect the extension output channel logs.

## Known inconsistencies / likely bugs
- `speckit.claudePath` setting is declared but not read anywhere in `src/**` (search shows no usage).
- `speckit.workflowEditor.refineLine` is referenced but not registered/contributed (see `src/features/workflow-editor/workflow/actionHandlers.ts`).
- `kfc.hooks.copyCommand` is referenced but not registered (see `src/features/hooks/hooksExplorerProvider.ts`).
