# Feature: Claude permissions gate (startup permission flow)

## What it does
On extension activation, it initializes a permission manager that blocks Claude execution until permissions are granted, prompting the user to approve in a terminal.

## Entry points
- Activated on startup: `src/extension.ts` constructs `PermissionManager` and calls `initializePermissions()`.
- Enforced by Claude provider:
  - `ClaudeCodeProvider.ensurePermissions()` calls `getPermissionManager().checkPermission()` and then `showPermissionSetup()` if needed (`src/ai-providers/claudeCodeProvider.ts`).

## User flow
1. Extension activates and detects AI provider (`src/extension.ts`).
2. If provider is Claude and permission is missing:
   - A terminal opens titled "Claude Code - Permission Setup"
   - The terminal runs: `claude --permission-mode bypassPermissions` (`src/ai-providers/claudeCodeProvider.ts`)
   - The extension polls for permission status and will continue when detected (`src/features/permission/permissionManager.ts`).

## Configuration
- Permission state is derived from a ConfigReader + PermissionCache, watching a config file for changes (`src/features/permission/configReader.ts`, `src/features/permission/permissionCache.ts`, `src/features/permission/permissionManager.ts`).

## Behavioral details
- Uses a polling loop up to 5 minutes in `PermissionManager.showPermissionSetup()` (`src/features/permission/permissionManager.ts`).
- Also monitors config changes continuously (`PermissionManager.startMonitoring()`).

## Telemetry/logging
- Extensive output channel logging (`src/features/permission/permissionManager.ts`).

## Failure modes
- If user closes the permission terminal → permission setup resolves false and the extension may prompt retry/uninstall (`src/features/permission/permissionManager.ts`).
- If permission isn't granted within timeout → setup ends false (`src/features/permission/permissionManager.ts`).

## Notes on Permission Webview
There is a separate `PermissionWebview` implementation that creates a webview panel and loads `media/permission.html` (`src/features/permission/permissionWebview.ts`, `media/permission.html`), but it appears **unused** (no references outside its own file).
