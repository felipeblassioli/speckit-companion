# Features Index

This extension exposes user-facing functionality through:
- Activity bar views (`package.json` → `contributes.viewsContainers` + `contributes.views`)
- Commands (`package.json` → `contributes.commands`)
- A custom editor (`package.json` → `contributes.customEditors`)
- Background watchers (registered in `src/extension.ts`, implemented in `src/core/fileWatchers.ts`)

## Feature inventory
1. **Spec workflow (Specs view + SpecKit slash commands)**  
   - File: `docs/ai/features/spec-workflow.md`
2. **Workflow Editor (custom editor for spec markdown)**  
   - File: `docs/ai/features/workflow-editor.md`
3. **Steering documents (Steering view)**  
   - File: `docs/ai/features/steering.md`
4. **Agents (Agents view)**  
   - File: `docs/ai/features/agents.md`
5. **Skills (Skills view, Claude-only)**  
   - File: `docs/ai/features/skills.md`
6. **MCP servers (MCP Servers view)**  
   - File: `docs/ai/features/mcp-servers.md`
7. **Hooks (Hooks view, Claude-only)**  
   - File: `docs/ai/features/hooks.md`
8. **Claude permission gate (startup permission flow)**  
   - File: `docs/ai/features/claude-permissions.md`
9. **Update checks (automatic + manual command)**  
   - File: `docs/ai/features/updates.md`
10. **Settings view (Welcome-only) + "Open Settings" command**  
   - File: `docs/ai/features/settings-view.md`
