# SpecKit Companion — AI Docs

These docs are **evidence-driven** maps of SpecKit Companion’s user-facing surface: commands, settings, views, webviews, and workflows. They’re written for:
- onboarding new contributors
- supporting users (troubleshooting)
- enabling AI agents to implement/refactor safely

## Quick facts (from `package.json`)
- **Extension**: `speckit-companion` ("SpecKit Companion"), publisher `felipeblassioli`, version `0.2.0`
- **VS Code engine**: `^1.84.0`
- **Entrypoint**: `main: ./dist/extension.js`
- **Activation**: `onStartupFinished`, `onCustomEditor:speckit.workflowEditor` (`package.json`)
- **Primary UI**: Activity bar container `speckit` with tree views + a custom editor `speckit.workflowEditor` (`package.json`)

## Where to start
- **Features overview**: `docs/ai/features/index.md`
- **Command reference**: `docs/ai/reference/commands.md`
- **Settings reference**: `docs/ai/reference/settings.md`
- **Views & menus**: `docs/ai/reference/views-and-menus.md`
- **Webviews**: `docs/ai/reference/webviews.md`
- **Dev workflow**: `docs/ai/development.md`
- **Troubleshooting**: `docs/ai/troubleshooting.md`

## Repository anchors
- **Activation / wiring**: `src/extension.ts`
- **SpecKit detection + contexts**: `src/speckit/detector.ts`
- **Spec commands**: `src/features/specs/specCommands.ts`
- **Custom editor**: `src/features/workflow-editor/workflowEditorProvider.ts`
- **Tree views**: `src/features/*/*ExplorerProvider.ts`
- **AI provider implementations**: `src/ai-providers/*`
