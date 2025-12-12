# Settings Reference

Source of truth for settings schema: `package.json` → `contributes.configuration.properties`.  
"Where read" below points to evidence in `src/**`.

## Settings table
| Key | Type | Default | Description | Where read | Hot-reload behavior |
|---|---|---:|---|---|---|
| `speckit.workflowEditor.enabled` | boolean | `true` | Enable custom workflow editor for spec files | `src/extension.ts` (reads `getConfiguration('speckit').get('workflowEditor.enabled', true)`) | Not dynamically toggled; checked during activation only |
| `speckit.claudePath` | string | `claude` | Path to Claude Code CLI executable | **Declared but not read** in code (no `claudePath` usage in `src/**`) | N/A |
| `speckit.aiProvider` | string enum | `claude` | AI assistant provider | `src/ai-providers/aiProvider.ts` (`getConfiguredProviderType`) + `src/extension.ts` | Partially hot: `src/extension.ts` listens for changes and prompts "Reload window" |
| `speckit.geminiPath` | string | `gemini` | Path to Gemini CLI executable | `src/ai-providers/geminiCliProvider.ts` (`getConfiguration('speckit').get('geminiPath', 'gemini')`) | Effectively hot if provider reloads; extension suggests reload on provider change |
| `speckit.copilotPath` | string | `ghcs` | Path to GitHub Copilot CLI executable | `src/ai-providers/copilotCliProvider.ts` (`getConfiguration('speckit').get('copilotPath', 'ghcs')`) | Same as above |
| `speckit.views.specs.visible` | boolean | `true` | Show Specs view | Used in `package.json` `contributes.views[*].when` | Hot: VS Code `when` updates on setting change |
| `speckit.views.agents.visible` | boolean | `true` | Show Agents view | Used in `package.json` `when` | Hot via VS Code context/when |
| `speckit.views.skills.visible` | boolean | `true` | Show Skills view | Used in `package.json` `when` | Hot via VS Code context/when |
| `speckit.views.hooks.visible` | boolean | `true` | Show Hooks view | Used in `package.json` `when` | Hot via VS Code context/when |
| `speckit.views.steering.visible` | boolean | `true` | Show Steering view | Used in `package.json` `when` | Hot via VS Code context/when |
| `speckit.views.mcp.visible` | boolean | `true` | Show MCP Servers view | Used in `package.json` `when` | Hot via VS Code context/when |
| `speckit.views.settings.visible` | boolean | `false` | Show Settings view | Used in `package.json` `when` | Hot via VS Code context/when |

## Non–VS Code settings file
There is a separate JSON settings file used by `ConfigManager`:
- Location: `<workspace>/.claude/settings/speckit-settings.json` (see `src/core/utils/configManager.ts`)
- Used for paths and view defaults by `ConfigManager` (not the same as VS Code Settings UI).
