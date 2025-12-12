# Feature: Agents (Agents view)

## What it does
Displays agent definitions depending on the selected provider, with grouping by source (plugin/user/project). For Claude, it also initializes built-in agents by copying them into the workspace.

## Entry points
- **View**: `speckit.views.agents` ("Agents") in `package.json`
  - Provider: `src/features/agents/agentsExplorerProvider.ts`
  - Registered in `src/extension.ts`
- **Command**
  - `speckit.agents.refresh` in `package.json`
  - Registered: `src/features/steering/steeringCommands.ts` (agents refresh is wired there)

## User flow
1. Open "Agents" view.
2. For Claude:
   - See groups: Plugin Agents, User Agents, Project Agents (`src/features/agents/agentsExplorerProvider.ts`).
   - Click an agent to open the underlying markdown file (`vscode.open` in `AgentsExplorerProvider`).
3. For Gemini:
   - View shows "Agents not supported for Gemini CLI" (`src/features/agents/agentsExplorerProvider.ts`).

## Configuration
- Determined by `speckit.aiProvider` (read via `src/ai-providers/aiProvider.ts`).

## Behavioral details
- Built-in agent initialization:
  - Runs on activation: `agentManager.initializeBuiltInAgents()` (`src/extension.ts`)
  - Copies built-in agents into `.claude/agents/kfc/*.md` (workspace) from `dist/resources/agents/*.md` (`src/features/agents/agentManager.ts`)
  - Also copies system prompt into `.claude/system-prompts/spec-workflow-starter.md` from `dist/resources/prompts/spec-workflow-starter.md` (`src/features/agents/agentManager.ts`)
- Agent discovery:
  - Project agents: `.claude/agents/**` excluding `kfc` directory (`src/features/agents/agentManager.ts`)
  - User agents: `~/.claude/agents/**` (`src/features/agents/agentManager.ts`)
  - Plugin agents: derived from `~/.claude/plugins/installed_plugins.json` (`src/features/agents/agentManager.ts`)

## Telemetry/logging
- Extensive output channel logging when scanning agents (`src/features/agents/agentManager.ts`).

## Failure modes
- No workspace root → built-in agent copy is skipped (`src/features/agents/agentManager.ts`).
- Missing or invalid YAML frontmatter → agent file may be skipped (`src/features/agents/agentManager.ts`).

## Implementation map
- **Tree view**: `src/features/agents/agentsExplorerProvider.ts`
- **Agent discovery + built-in copy**: `src/features/agents/agentManager.ts`
- **Activation wiring**: `src/extension.ts`
