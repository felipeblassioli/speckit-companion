# Feature: Update checks (automatic + manual command)

## What it does
Checks GitHub Releases for updates (once per 24h) and prompts the user to view changelog or skip a version.

## Entry points
- Automatic check on startup: `src/extension.ts` → `updateChecker.checkForUpdates()`
- Manual command:
  - `speckit.checkForUpdates` in `package.json`
  - Registered: `src/speckit/utilityCommands.ts`

## User flow
1. On startup, update check is triggered silently.
2. If newer version found:
   - notification offers "View Changelog" or "Skip" (`src/speckit/updateChecker.ts`).
3. Manual: run "Check for Updates" command any time.

## Configuration
- Stores state in `context.globalState`:
  - last check timestamp key `speckit.lastUpdateCheck`
  - skipped version key `speckit.skipVersion`
  (`src/speckit/updateChecker.ts`)

## Behavioral details
- Fetches from GitHub API: `https://api.github.com/repos/alfredoperez/speckit-companion/releases/latest` (`src/speckit/updateChecker.ts`).
- Opens release page on "View Changelog" selection.

## Telemetry/logging
- Logs to output channel (`src/speckit/updateChecker.ts`).

## Failure modes
- Network blocked / GitHub API failure → logs error and no notification (`src/speckit/updateChecker.ts`).
