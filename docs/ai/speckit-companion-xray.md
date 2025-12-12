# SpecKit Companion: X-Ray

### A. Executive summary (1 paragraph)
SpecKit Companion is a VS Code extension that adds a **SpecKit-focused activity bar**, **tree views** (Specs/Agents/Skills/Steering/MCP/Hooks/Settings), and a **custom markdown editor** for `specs/**/*.md` that renders spec docs with phase navigation and “action” buttons that drive **AI/CLI workflows via VS Code terminals**. The clever part is the tight loop between the custom editor → command execution and the repo’s `.claude/` ecosystem; the fragile parts are **direct `fs`/`child_process` usage**, **several command/ID mismatches**, and **webview sanitization gaps** that could break features or weaken security.

---

### B. Dependency map (major packages + why they matter)
- **`vscode` API (`@types/vscode` ^1.84.0)**: activation, commands, tree views, terminals, custom editor, storage.
- **TypeScript (`typescript` ^5.3.0)**: extension + webview sources compiled to `dist/`.
- **Webpack (`webpack` + `ts-loader`)**: production bundling of extension and webview JS (`npm run package-web`).
- **VSCE (`vsce` ^2.15.0)**: packaging `.vsix` (`npm run package`).
- **Jest (`jest` + `ts-jest`)**: test runner configured, but **no tests/mocks present** in this repo snapshot.
- **`js-yaml`**: parses YAML frontmatter for **agents** and **skills** metadata.

---

### 1) Repository Quick Facts
- **Extension name**: `speckit-companion` (display: “SpecKit Companion”)  
- **Publisher**: `alfredoperez`  
- **Version**: `0.2.0`  
- **VS Code engine**: `^1.84.0`  
- **Entrypoint**: `main: ./dist/extension.js`  
- **Activation events**: `onStartupFinished`, `onCustomEditor:speckit.workflowEditor`  
- **extensionKind**: **not specified** in `package.json` (unknown; defaults apply)
- **Build toolchain**
  - **TS compile**: `npm run compile` → `tsc` to `dist/` (`outDir: ./dist`)
  - **Bundling**: `webpack.config.js` produces:
    - extension bundle: `dist/extension.js`
    - webview bundle: `dist/webview/workflow.js` + copies `webview/workflow.css`
  - **Packaging**: `vsce package` (`npm run package`), with `vscode:prepublish` → `npm run package-web`
  - **Tests**: `npm test` runs Jest, but **no `tests/` dir and no `*.test.ts` found** in this snapshot

---

### 2) High-level Architecture Map (one page)
- **Entry point**: `src/extension.ts`
  - Creates a shared **OutputChannel**
  - Runs **SpecKit detection** (`SpecKitDetector.detect()`), sets `setContext(...)` keys for `when` clauses
  - Initializes **AI provider** via `AIProviderFactory` (Claude/Gemini/Copilot)
  - Initializes **PermissionManager** (Claude permissions)
  - Initializes managers/providers and registers **TreeDataProviders** for all views
  - Registers commands via feature modules
  - Sets up **workspace file watchers** + a **tasks watcher** for phase completion notifications
  - Starts **UpdateChecker**
  - Registers the **Workflow custom editor provider** if enabled
- **Cross-cutting concerns**
  - **Config**: `src/core/utils/configManager.ts` (reads `.claude/settings/speckit-settings.json`)
  - **Notifications**: `src/core/utils/notificationUtils.ts`
  - **Shell input sanitization**: `src/core/utils/sanitize.ts`
  - **Logging**: `outputChannel` in `src/extension.ts` (but there are `console.error` uses in hooks provider)

---

### 3) Contributions Map (package.json X-ray)
- **Views / Activity bar**
  - Container: `viewsContainers.activitybar[]` → id `speckit`, title “SpecKit”
  - Views in container:
    - `speckit.views.explorer` (Specs)
    - `speckit.views.agents` (Agents)
    - `speckit.views.skills` (Skills, gated on `config.speckit.aiProvider == 'claude'`)
    - `speckit.views.steering` (Steering)
    - `speckit.views.mcp` (MCP Servers)
    - `speckit.views.hooks` (Hooks)
    - `speckit.views.settings` (Settings, default collapsed)
- **Custom editor**
  - `viewType`: `speckit.workflowEditor`
  - Selector: `**/specs/**/*.md`
  - Activation includes `onCustomEditor:speckit.workflowEditor`
- **Menus**
  - `view/title`: adds create/refresh buttons per-view
  - `view/item/context`: spec delete, steering refine/delete
  - `commandPalette`: most workflow commands gated on `speckit.detected`, upgrades gated on `speckit.cliInstalled`, etc.
- **Configuration schema**
  - `speckit.workflowEditor.enabled` (window)
  - `speckit.aiProvider` + CLI paths (`claudePath`, `geminiPath`, `copilotPath`) (machine)
  - `speckit.views.*.visible` toggles (window)
- **Context keys used in `when` clauses**
  - Set via `setContext` in `src/speckit/detector.ts`:  
    `speckit.cliInstalled`, `speckit.detected`, `speckit.constitutionNeedsSetup`

---

### 4) Code Map (call graph + module map)
#### Activation path (what happens at startup)
`activate(context)` in `src/extension.ts`:
- Create `outputChannel`
- `SpecKitDetector.getInstance().detect()`:
  - Uses `child_process.exec` to find `specify` and checks workspace markers (`.specify/` or `.github/agents/...`)
  - Sets `setContext(...)` keys
- Initialize:
  - `aiProvider = AIProviderFactory.getProvider(...)`
  - `permissionManager = new PermissionManager(...).initializePermissions()`
  - `SteeringManager`, `AgentManager.initializeBuiltInAgents()`, `SkillManager`
- Register tree data providers for all views
- Register commands:
  - CLI commands (`src/speckit/cliCommands.ts`)
  - Steering (`src/features/steering/steeringCommands.ts`)
  - Specs (`src/features/specs/specCommands.ts`)
  - Utility (`src/speckit/utilityCommands.ts`)
  - Workflow editor commands (`src/features/workflow-editor/workflowEditorCommands.ts`)
- Watchers:
  - `.claude/**/*`, `~/.claude/settings.json`, `~/.claude/CLAUDE.md`, `**/CLAUDE.md`, and `**/specs/**/tasks.md`
- Update checker:
  - `UpdateChecker.checkForUpdates()`

#### I/O boundaries (filesystem/network/process)
- **Filesystem**
  - Uses `vscode.workspace.fs` in many places
  - Also uses **direct `fs`** heavily (`fs.existsSync`, `fs.readFileSync`, `fs.promises.writeFile`, `fs.watchFile`) in:
    - Spec explorer status checks (`src/features/specs/specExplorerProvider.ts`)
    - Workflow editor parsing (`src/features/workflow-editor/workflow/specInfoParser.ts`)
    - Permission system (`src/features/permission/configReader.ts`)
    - Hooks explorer (`src/features/hooks/hooksExplorerProvider.ts`)
    - AI providers temp files (`src/ai-providers/*.ts`)
- **Child process / shell**
  - `execAsync(...)` used in:
    - SpecKit CLI detection (`src/speckit/detector.ts`)
    - MCP listing/details via `claude mcp ...` (`src/features/mcp/mcpExplorerProvider.ts`)
    - AI provider “is installed” checks (`src/ai-providers/*.ts`)
  - Terminal execution via `vscode.window.createTerminal(...).sendText(...)` across the system
- **Network**
  - `fetch('https://api.github.com/.../releases/latest')` in `src/speckit/updateChecker.ts`

---

### C. Command inventory table (Command ID | Title | Entry point | Core dependencies | Side effects | Notes)
| Command ID | Title (manifest) | Entry point / handler | Core deps | Side effects | Notes |
|---|---|---|---|---|---|
| `speckit.installCli` | Install SpecKit CLI | `src/speckit/cliCommands.ts` → `SpecKitDetector.installCli()` | `SpecKitDetector` | Opens terminal, runs `uv tool install ...` | Uses terminal text injection (static) |
| `speckit.initWorkspace` | Initialize SpecKit | `src/speckit/cliCommands.ts` → `SpecKitDetector.initializeWorkspace()` | `SpecKitDetector` | Opens terminal, runs `specify init` | Quotes workspace path |
| `speckit.upgradeCli` | Upgrade CLI | `src/speckit/cliCommands.ts` → `SpecKitDetector.upgradeCli()` | `SpecKitDetector` | Opens terminal, runs `uv tool install --force ...` |  |
| `speckit.upgradeProject` | Upgrade Project Files | `src/speckit/cliCommands.ts` → `SpecKitDetector.upgradeProject()` | `SpecKitDetector` | Opens terminal, runs `specify init --force ...` |  |
| `speckit.upgradeAll` | Upgrade All | `src/speckit/cliCommands.ts` → `SpecKitDetector.upgradeAll()` | `SpecKitDetector` | Opens terminal, runs chained CLI+project upgrade |  |
| `speckit.create` | Create New Spec | `src/features/specs/specCommands.ts` | `getAIProvider()`, `sanitizeShellInput` | Opens terminal, sends `/speckit.specify ...` | Input sanitized |
| `speckit.refresh` | Refresh Specs | `src/features/specs/specCommands.ts` | Spec explorer provider | Refreshes tree |  |
| `speckit.delete` | Delete Spec | `src/features/specs/specCommands.ts` | `workspace.fs` | Deletes `specs/<name>` recursively | Confirmation prompt |
| `speckit.specify` | Specify | `src/features/specs/specCommands.ts` | `getAIProvider()` | Opens terminal, sends `/speckit.specify <specDir>` | Spec dir derived from active editor or arg |
| `speckit.plan` | Plan | same as above | same | same |  |
| `speckit.tasks` | Tasks | same as above | same | same |  |
| `speckit.implement` | Implement | same as above | same | same |  |
| `speckit.clarify` | Clarify | same as above | same | same |  |
| `speckit.analyze` | Analyze | same as above | same | same |  |
| `speckit.checklist` | Checklist | same as above | same | same |  |
| `speckit.constitution` | Constitution | `src/features/specs/specCommands.ts` | `getAIProvider()` | Opens terminal, sends `/speckit.constitution` |  |
| `speckit.steering.create` | Create Custom Steering | `src/features/steering/steeringCommands.ts` → `SteeringManager.createCustom()` | `SteeringManager`, AI provider | Terminal prompt to generate doc(s) | Writes to `.claude/steering` |
| `speckit.steering.refine` | Refine Steering | `src/features/steering/steeringCommands.ts` → `SteeringManager.refine(uri)` | `SteeringManager`, AI provider | Terminal prompt |  |
| `speckit.steering.delete` | Delete Steering | `src/features/steering/steeringCommands.ts` → `SteeringManager.delete(...)` | `SteeringManager`, AI provider | Deletes file + headless AI update of `CLAUDE.md` |  |
| `speckit.steering.createUserRule` | Create User Rule | `SteeringManager.createUserClaudeMd()` | `workspace.fs`, `HOME` | Writes `~/.claude/CLAUDE.md` | Uses `process.env.HOME` |
| `speckit.steering.createProjectRule` | Create Project Rule | `SteeringManager.createProjectClaudeMd()` | terminal | Opens terminal, runs `claude ... "/init"` | Claude-only |
| `speckit.steering.refresh` | Refresh Steering | `src/features/steering/steeringCommands.ts` | steering explorer | Refreshes tree |  |
| `speckit.agents.refresh` | Refresh Agents | `src/features/steering/steeringCommands.ts` | agents explorer | Refreshes tree |  |
| `speckit.skills.refresh` | Refresh Skills | `src/extension.ts` | skills explorer | Refreshes tree |  |
| `speckit.hooks.refresh` | Refresh Hooks | `src/speckit/utilityCommands.ts` | hooks explorer | Refreshes tree |  |
| `speckit.mcp.refresh` | Refresh MCP Status | `src/speckit/utilityCommands.ts` | mcp explorer | Refreshes tree + execs `claude mcp list` | Claude-only shows real servers |
| `speckit.settings.open` | SpecKit Settings | `src/speckit/utilityCommands.ts` | vscode commands | Opens Settings UI to `speckit` |  |
| `speckit.checkForUpdates` | Check for Updates | `src/speckit/utilityCommands.ts` → `UpdateChecker.checkForUpdates(true)` | `UpdateChecker` | Network fetch + notification | **Extension ID mismatch risk** (see quirks) |
| `speckit.workflowEditor.editSource` | Edit Source | `src/features/workflow-editor/workflowEditorCommands.ts` | (currently logs) | None | **Not wired to editor behavior** (webview uses messages instead) |
| `speckit.workflowEditor.refineSection` | Refine Section | `workflowEditorCommands.ts` | AI provider | Opens terminal with provided prompt |  |
| `speckit.workflowEditor.removeSection` | Remove Section | `workflowEditorCommands.ts` | (logs only) | None | Placeholder |
| `speckit.workflowEditor.addUserStory` | Add User Story | `workflowEditorCommands.ts` | (logs only) | None | Placeholder |
| `speckit.workflowEditor.approveAndContinue` | Approve & Continue | `workflowEditorCommands.ts` | (logs only) | None | Placeholder |
| `speckit.workflowEditor.regenerate` | Regenerate | `workflowEditorCommands.ts` | (logs only) | None | Placeholder |
| `speckit.workflowEditor.navigateToPhase` | Navigate to Phase | `workflowEditorCommands.ts` | (logs only) | None | Placeholder |

**Notable missing/extra commands referenced in code**
- **Missing handler**: `speckit.workflowEditor.refineLine` is invoked by the workflow editor action handler but **never registered** → refine-line flow likely broken.
- **Missing handler**: `kfc.hooks.copyCommand` is used as a TreeItem command but **not contributed/registered**.

---

### D. Module map (10–25 important modules/directories)
- **`src/extension.ts`**: activation, wiring, global output channel, command registration orchestration.
- **`src/core/constants.ts`**: canonical command IDs/config keys/context keys/view IDs.
- **`src/core/fileWatchers.ts`**: `.claude`/`CLAUDE.md` watchers + `tasks.md` completion notifications.
- **`src/core/utils/configManager.ts`**: reads/saves `.claude/settings/speckit-settings.json`.
- **`src/core/utils/notificationUtils.ts`**: progress-based notifications.
- **`src/core/utils/sanitize.ts`**: shell input sanitization for user-entered descriptions.
- **`src/speckit/detector.ts`**: SpecKit CLI + workspace detection; runs install/init/upgrade via terminals.
- **`src/speckit/updateChecker.ts`**: GitHub releases polling + skip logic (globalState).
- **`src/speckit/taskProgressService.ts`**: parses tasks.md and caches completion state (used by watcher).
- **`src/ai-providers/*Provider.ts`**: adapters for Claude/Gemini/Copilot execution; temp-file handling; terminal + shellIntegration.
- **`src/features/specs/specExplorerProvider.ts`**: Spec tree view with status indicators + related docs.
- **`src/features/specs/specCommands.ts`**: all `/speckit.*` workflow commands and delete/refresh.
- **`src/features/steering/steeringManager.ts`**: create/refine/delete steering docs under `.claude/steering`.
- **`src/features/agents/agentManager.ts`**: discovers/copies agents; parses YAML frontmatter.
- **`src/features/skills/skillManager.ts`**: discovers skills in `.claude/skills`; parses YAML frontmatter.
- **`src/features/mcp/mcpExplorerProvider.ts`**: reads MCP server list/details via `claude mcp ...`.
- **`src/features/hooks/hooksExplorerProvider.ts`**: reads `hooks` from `.claude/settings.json` (workspace + global).
- **`src/features/permission/*`**: Claude permission detection via `~/.claude.json` + terminal-based approval.
- **`src/features/workflow-editor/workflowEditorProvider.ts`**: custom editor provider; message loop.
- **`src/features/workflow-editor/workflow/*`**: spec-info parsing + HTML generation + action handlers.
- **`webview-src/*`**: webview runtime: markdown rendering, UI, message protocol.

---

### E. Patterns & Quirks (evidence → impact → recommendation)
- **Extension ID mismatch**
  - **Evidence**: `vscode.extensions.getExtension('alfredo-dev.speckit-companion')` in `src/speckit/updateChecker.ts`; uninstall/open uses `alfredo-dev.speckit-companion` in `src/features/permission/permissionManager.ts`; launch config enables proposed API for `alfredo-dev.speckit-companion` in `.vscode/launch.json`; but publisher in `package.json` is `alfredoperez`.
  - **Impact**: update checks may never find the extension; uninstall flow may target wrong extension.
  - **Recommendation**: align to the real extension identifier (`${publisher}.${name}`) everywhere; keep one constant.

- **Workflow editor “refine line” is wired to a missing command**
  - **Evidence**: `WorkflowActionHandlers.refineLine()` executes `speckit.workflowEditor.refineLine` (`src/features/workflow-editor/workflow/actionHandlers.ts`), but there is **no `registerCommand('speckit.workflowEditor.refineLine')`** anywhere.
  - **Impact**: clicking “refine” likely does nothing or errors.
  - **Recommendation**: implement and register `speckit.workflowEditor.refineLine`, or have the action handler call the AI provider directly (like `refineSection` does).

- **Webview HTML injection surface via unvalidated link URLs**
  - **Evidence**: `parseInlineMarkdown` emits `<a href="$2">$1</a>` without scheme validation in `webview-src/markdown/parser.ts`; `renderContent` assigns `contentEl.innerHTML = html` in `webview-src/render/contentRenderer.ts`.
  - **Impact**: a spec file containing `[x](javascript:...)` or other malicious URLs could create unsafe navigation/XSS behavior in the webview.
  - **Recommendation**: validate/normalize URLs (allow `https:`, `http:`, maybe `mailto:`), escape attributes, and intercept clicks to route through `vscode.env.openExternal`.

- **Permission webview lacks CSP**
  - **Evidence**: `media/permission.html` contains inline `<script>` and is loaded verbatim by `src/features/permission/permissionWebview.ts` without a CSP meta tag.
  - **Impact**: weaker defense-in-depth vs injection; harder to audit.
  - **Recommendation**: add a CSP with nonce, avoid inline scripts, and use `asWebviewUri` for any local assets.

- **Remote / web compatibility footguns (direct `fs`, `child_process`, `HOME`)**
  - **Evidence**: direct `fs.*` across providers/managers; `exec` in detector/MCP provider; watchers use `process.env.HOME`.
  - **Impact**: potential breakage in remote extension hosts, restricted environments, or future web-extension ambitions.
  - **Recommendation**: prefer `vscode.workspace.fs`, avoid `child_process` where possible, and gate platform-specific logic.

- **Missing build resources for built-in agents/system prompts**
  - **Evidence**: `AgentManager` copies from `dist/resources/agents/*.md` and `dist/resources/prompts/spec-workflow-starter.md` (`src/features/agents/agentManager.ts`), but `dist/resources/**` is not present in this snapshot.
  - **Impact**: built-in agent initialization likely fails silently (agents/prompts never copied).
  - **Recommendation**: ensure resources are generated/copied during build (or commit them) and verify packaging includes them.

- **Hooks view references an unregistered command**
  - **Evidence**: Tree item command `kfc.hooks.copyCommand` in `src/features/hooks/hooksExplorerProvider.ts`, but no registration/contribution found.
  - **Impact**: clicking those items likely errors.
  - **Recommendation**: register the command and contribute it, or remove the command from items.

---

### 6) How to Run / Debug / Test / Package (onboarding recipe)
- **Install**
  - `npm install`
- **Build (extension host JS)**
  - `npm run compile`
- **Build (webview bundle)**
  - `npm run compile-web` (dev) or `npm run package-web` (prod)
- **Run / Debug**
  - Use **VS Code** → press **F5** (uses `.vscode/launch.json`: “Run Extension”)
- **Tests**
  - `npm test`  
  - Note: Jest is configured, but this snapshot has **no `tests/` dir and no `*.test.ts`**, so test health is currently **unknown / likely failing** due to missing `tests/__mocks__/vscode.ts` referenced in `jest.config.js`.
- **Package VSIX**
  - `npm run package` (runs `vsce package`; prepublish runs `npm run package-web`)

---

### 7) Risk & Quality Checklist
- **Security**
  - **Command injection risk**: reduced for `speckit.create` via `sanitizeShellInput`, but **`execAsync(\`claude mcp get ${name}\`)`** in MCP provider should be treated as risky (prefer `execFile` with args).
  - **Webview XSS/navigation**: link URL sanitization is a concern (see quirks).
  - **Permission webview CSP**: missing CSP (see quirks).
- **Reliability**
  - Disposables: generally pushed via `context.subscriptions`, but some manual disposals exist too.
  - Watchers: multiple watchers + workspace scan on activation (`findFiles('**/specs/**/tasks.md')`) could impact large repos.
- **Observability**
  - Output channel exists, but some errors go to `console.error` (hooks provider).
- **Remote/web compatibility**
  - Direct Node APIs (`fs`, `child_process`) and `HOME` usage reduce portability.

---

### 8) First 5 Tasks for a New Developer (1–2 day onboarding sprint)
1. **Run the extension host** (F5) and verify views appear under the “SpecKit” activity bar.
2. **Validate detection contexts**:
   - Open a workspace with/without SpecKit and confirm welcome views flip based on `speckit.cliInstalled` and `speckit.detected`.
3. **Smoke-test the workflow editor**:
   - Open `specs/<spec>/spec.md` and verify phase navigation + regenerate/approve works.
4. **Fix the top broken wiring**:
   - Implement/register `speckit.workflowEditor.refineLine` and reconcile `kfc.hooks.copyCommand`.
5. **Get tests into a green baseline**:
   - Add `tests/__mocks__/vscode.ts`, one unit test for `sanitizeShellInput`, and one for webview markdown URL filtering.

---

### Questions to ask maintainers (5–10)
1. **What is the intended extension ID** (publisher/name)? Several places reference `alfredo-dev.speckit-companion` but `package.json` says `alfredoperez`.
2. Should **built-in agents/system prompts** be shipped? If yes, where are `dist/resources/agents` and `dist/resources/prompts` generated?
3. Is the workflow editor’s **refine-line** feature supposed to call Claude directly, or route through a command? (It currently routes to a missing command.)
4. Do you want the webview to be **offline-capable**? It currently loads Mermaid + Highlight.js from `cdn.jsdelivr.net`.
5. Are you targeting **Remote-SSH/Codespaces** scenarios? If so, should direct `fs`/`child_process` be refactored to remote-safe APIs?
6. What’s the intended UX for links inside spec docs: **open inside webview** or **open externally** via `vscode.env.openExternal`?
7. Is the permission system meant to rely on `~/.claude.json` long-term, or should it integrate with a more official permission API?
8. Should MCP support exist for non-Claude providers beyond the “info” view, or is Claude the only supported runtime for MCP listing?

