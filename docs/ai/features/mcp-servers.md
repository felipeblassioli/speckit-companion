# Feature: MCP Servers (MCP Servers view)

## What it does
Shows configured MCP servers and connection status. For Claude, it shells out to `claude mcp list` and `claude mcp get <name>`.

## Entry points
- **View**: `speckit.views.mcp` ("MCP Servers") in `package.json`
  - Provider: `src/features/mcp/mcpExplorerProvider.ts`
  - Registered in `src/extension.ts`
- **Command**
  - `speckit.mcp.refresh` in `package.json`
  - Registered: `src/speckit/utilityCommands.ts`

## User flow
1. Open "MCP Servers".
2. If provider is not Claude:
   - The view shows the config file path hint (Gemini: `~/.gemini/settings.json`, Copilot: `~/.copilot/mcp-config.json`) (`src/features/mcp/mcpExplorerProvider.ts`).
3. If provider is Claude:
   - The view lists servers and shows status (connected/disconnected) parsed from `claude mcp list` output (`src/features/mcp/mcpExplorerProvider.ts`).
   - Expanding a server loads details via `claude mcp get <name>` (`src/features/mcp/mcpExplorerProvider.ts`).

## Configuration
- Determined by `speckit.aiProvider` selection (`src/ai-providers/aiProvider.ts`).

## Behavioral details
- Uses `child_process.exec` (promisified) to run CLI commands (`src/features/mcp/mcpExplorerProvider.ts`).
- Loads list first, then asynchronously loads details per server and refreshes tree (`src/features/mcp/mcpExplorerProvider.ts`).

## Telemetry/logging
- Logs errors to output channel (`src/features/mcp/mcpExplorerProvider.ts`).

## Failure modes
- Claude CLI missing or `claude mcp list` fails → view may remain empty or show no servers (`src/features/mcp/mcpExplorerProvider.ts`).
- Non-Claude providers don't attempt CLI execution and only show guidance items (`src/features/mcp/mcpExplorerProvider.ts`).

## Implementation map
- **Tree view + CLI parsing**: `src/features/mcp/mcpExplorerProvider.ts`
- **Refresh command**: `src/speckit/utilityCommands.ts`
