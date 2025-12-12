# Command Reference

Source of truth for command declarations: `package.json` → `contributes.commands`.  
Source of truth for command wiring: `registerCommand(...)` in `src/**`.

## Command inventory (declared in `package.json`)
| Command ID | Title | Where exposed | Handler file | Side effects | Notes |
|---|---|---|---|---|---|
| `speckit.installCli` | Install SpecKit CLI | Specs view welcome (`package.json` → `viewsWelcome`), command palette | `src/speckit/cliCommands.ts` → `SpecKitDetector.installCli()` (`src/speckit/detector.ts`) | Opens terminal, runs `uv tool install ...` | Requires `uv` (`package.json` viewsWelcome text) |
| `speckit.initWorkspace` | Initialize SpecKit | Specs view welcome, command palette | `src/speckit/cliCommands.ts` → `SpecKitDetector.initializeWorkspace()` | Opens terminal, runs `specify init .` | |
| `speckit.upgradeCli` | Upgrade CLI | command palette (`when: speckit.cliInstalled`) | `src/speckit/cliCommands.ts` → `SpecKitDetector.upgradeCli()` | Opens terminal, runs `uv tool install ... --force ...` | |
| `speckit.upgradeProject` | Upgrade Project Files | command palette (`when: speckit.detected`) | `src/speckit/cliCommands.ts` → `SpecKitDetector.upgradeProject()` | Opens terminal, runs `specify init --here --force ...` | |
| `speckit.upgradeAll` | Upgrade All (CLI + Project) | command palette (`when: speckit.detected`) | `src/speckit/cliCommands.ts` → `SpecKitDetector.upgradeAll()` | Opens terminal, runs CLI + project upgrade | |
| `speckit.create` | Create New Spec | Specs view title menu, command palette (`when: speckit.detected`), Specs welcome | `src/features/specs/specCommands.ts` | Prompts for description, executes `/speckit.specify ...` via AI provider terminal | Sanitizes input (`src/core/utils/sanitize.ts`) |
| `speckit.specify` | Specify | command palette (`when: speckit.detected`) | `src/features/specs/specCommands.ts` (registered in a loop) | Executes AI provider terminal with `/speckit.specify <specDir>` | |
| `speckit.plan` | Plan | command palette (`when: speckit.detected`) | `src/features/specs/specCommands.ts` (loop) | Executes `/speckit.plan <specDir>` | |
| `speckit.tasks` | Tasks | command palette (`when: speckit.detected`) | `src/features/specs/specCommands.ts` (loop) | Executes `/speckit.tasks <specDir>` | |
| `speckit.implement` | Implement | command palette (`when: speckit.detected`) | `src/features/specs/specCommands.ts` (loop) | Executes `/speckit.implement <specDir>` | |
| `speckit.clarify` | Clarify | command palette (`when: speckit.detected`) | `src/features/specs/specCommands.ts` (loop) | Executes `/speckit.clarify <specDir>` | |
| `speckit.analyze` | Analyze | command palette (`when: speckit.detected`) | `src/features/specs/specCommands.ts` (loop) | Executes `/speckit.analyze <specDir>` | |
| `speckit.checklist` | Checklist | command palette (`when: speckit.detected`) | `src/features/specs/specCommands.ts` (loop) | Executes `/speckit.checklist <specDir>` | |
| `speckit.constitution` | Constitution | command palette (`when: speckit.detected`) + startup suggestion button | `src/features/specs/specCommands.ts` | Executes `/speckit.constitution` | Startup suggestion in `src/extension.ts` |
| `speckit.refresh` | Refresh Specs | Specs view title menu | `src/features/specs/specCommands.ts` | Refreshes Specs tree | |
| `speckit.delete` | Delete Spec | Specs view item context menu (`when: viewItem == spec`) | `src/features/specs/specCommands.ts` | Deletes `specs/<name>` recursively | |
| `speckit.steering.create` | Create Custom Steering | Steering view title menu + command palette | `src/features/steering/steeringCommands.ts` | AI provider terminal prompt to create file(s) | |
| `speckit.steering.createUserRule` | Create User Rule | Steering view welcome | `src/features/steering/steeringCommands.ts` → `SteeringManager.createUserClaudeMd()` | Writes `~/.claude/CLAUDE.md` | Claude-only path in code |
| `speckit.steering.createProjectRule` | Create Project Rule | Steering view welcome | `src/features/steering/steeringCommands.ts` → `SteeringManager.createProjectClaudeMd()` | Opens terminal and runs `claude ... "/init"` | |
| `speckit.steering.refine` | Refine Steering | Steering item context menu (`when: viewItem == steering-document`) | `src/features/steering/steeringCommands.ts` | AI provider terminal prompt | |
| `speckit.steering.delete` | Delete Steering | Steering item context menu | `src/features/steering/steeringCommands.ts` | Deletes file; runs AI headless prompt to update CLAUDE.md | |
| `speckit.steering.refresh` | Refresh Steering | Steering view title menu | `src/features/steering/steeringCommands.ts` | Refreshes Steering tree | |
| `speckit.agents.refresh` | Refresh Agents | Agents view title menu | `src/features/steering/steeringCommands.ts` | Refreshes Agents tree | |
| `speckit.skills.refresh` | Refresh Skills | Skills view title menu | `src/extension.ts` | Refreshes Skills tree | |
| `speckit.hooks.refresh` | Refresh Hooks | Hooks view title menu | `src/speckit/utilityCommands.ts` | Refreshes Hooks tree | |
| `speckit.mcp.refresh` | Refresh MCP Status | MCP view title menu | `src/speckit/utilityCommands.ts` | Refreshes MCP tree (re-runs CLI for Claude) | |
| `speckit.settings.open` | SpecKit Settings | Settings welcome + command palette | `src/speckit/utilityCommands.ts` | Opens VS Code settings for `speckit` | |
| `speckit.checkForUpdates` | Check for Updates | command palette | `src/speckit/utilityCommands.ts` | Network fetch to GitHub API | |
| `speckit.workflowEditor.editSource` | Edit Source | command palette | `src/features/workflow-editor/workflowEditorCommands.ts` | Logs only (no edit) | Webview uses a different message path to edit source |
| `speckit.workflowEditor.refineSection` | Refine Section | command palette | `src/features/workflow-editor/workflowEditorCommands.ts` | Sends provided prompt to AI provider terminal | |
| `speckit.workflowEditor.removeSection` | Remove Section | command palette | `src/features/workflow-editor/workflowEditorCommands.ts` | Logs only | |
| `speckit.workflowEditor.addUserStory` | Add User Story | command palette | `src/features/workflow-editor/workflowEditorCommands.ts` | Logs only | |
| `speckit.workflowEditor.approveAndContinue` | Approve & Continue | command palette | `src/features/workflow-editor/workflowEditorCommands.ts` | Logs only | Webview uses `WorkflowActionHandlers.approveAndContinue` instead |
| `speckit.workflowEditor.regenerate` | Regenerate | command palette | `src/features/workflow-editor/workflowEditorCommands.ts` | Logs only | |
| `speckit.workflowEditor.navigateToPhase` | Navigate to Phase | command palette | `src/features/workflow-editor/workflowEditorCommands.ts` | Logs only | |

## Commands referenced in code but not declared / not registered
These appear in code but aren't part of `package.json` `contributes.commands` (and/or lack `registerCommand`):
- `speckit.workflowEditor.refineLine`  
  - Referenced in `src/features/workflow-editor/workflow/actionHandlers.ts` but not declared in `package.json` and not registered in `src/features/workflow-editor/workflowEditorCommands.ts`.
- `kfc.hooks.copyCommand`  
  - Referenced in `src/features/hooks/hooksExplorerProvider.ts` but no registration exists in `src/**` (no `registerCommand` hits).
- `speckit.skills.openSkill`  
  - Present in constants (`src/core/constants.ts`) but not contributed/registered; the Skills tree uses `vscode.open` directly.

Treat these as **broken/legacy hooks** until implemented and contributed.
