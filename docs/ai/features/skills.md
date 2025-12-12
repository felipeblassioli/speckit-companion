# Feature: Skills (Skills view, Claude-only)

## What it does
Lists "skills" (each skill is a folder containing `SKILL.md`) from:
- workspace `.claude/skills/**/SKILL.md`
- user `~/.claude/skills/**/SKILL.md`
- plugin installs (via `~/.claude/plugins/installed_plugins.json`)

## Entry points
- **View**: `speckit.views.skills` ("Skills") in `package.json`
  - Provider: `src/features/skills/skillsExplorerProvider.ts`
  - Registered in `src/extension.ts`
- **Command**
  - `speckit.skills.refresh` in `package.json`
  - Registered directly in `src/extension.ts`

## User flow
1. Select AI provider = Claude (otherwise the view shows an informational item).
2. Open "Skills" view:
   - groups are "Plugin Skills", "User Skills", "Project Skills" (`src/features/skills/skillsExplorerProvider.ts`)
3. Click a skill item to open the `SKILL.md` file (`vscode.open` in `SkillsExplorerProvider`).

## Configuration
- Determined by `speckit.aiProvider` selection (`src/ai-providers/aiProvider.ts`).

## Behavioral details
- YAML frontmatter parsing:
  - If missing or invalid, the skill still appears but uses folder name and shows a warning icon (`src/features/skills/skillManager.ts`, `src/features/skills/skillsExplorerProvider.ts`).
- Plugin skills:
  - Derived from `~/.claude/plugins/installed_plugins.json` and namespaced as `<pluginName>:<skillName>` (`src/features/skills/skillManager.ts`).

## Telemetry/logging
- Output channel logs discovery and YAML parsing (`src/features/skills/skillManager.ts`).

## Failure modes
- Provider not Claude → "Skills only available for Claude Code" (`src/features/skills/skillsExplorerProvider.ts`).
- Skills directories missing → handled as "no skills" (`src/features/skills/skillManager.ts`, `src/features/skills/skillsExplorerProvider.ts`).

## Implementation map
- **Tree view**: `src/features/skills/skillsExplorerProvider.ts`
- **Discovery + parsing**: `src/features/skills/skillManager.ts`
- **Provider selection**: `src/ai-providers/aiProvider.ts`
