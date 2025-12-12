import * as vscode from 'vscode';
import * as path from 'path';
import { getConfiguredProviderType } from '../../ai-providers/aiProvider';
import { shouldShowFeature } from '../../core/utils/capabilityPolicy';

export class HooksExplorerProvider implements vscode.TreeDataProvider<HookItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<HookItem | undefined | null | void> = new vscode.EventEmitter<HookItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<HookItem | undefined | null | void> = this._onDidChangeTreeData.event;
    private isLoading: boolean = false;
    
    constructor(private context: vscode.ExtensionContext) {
        // Start with loading state
        this.isLoading = true;
        this.loadHooks().then(() => {
            this.isLoading = false;
            this._onDidChangeTreeData.fire();
        });
    }
    
    refresh(): void {
        this.isLoading = true;
        this._onDidChangeTreeData.fire(); // Fire immediately to show loading state
        this.loadHooks().then(() => {
            this.isLoading = false;
            this._onDidChangeTreeData.fire(); // Fire again to show the loaded hooks
        });
    }
    
    private async loadHooks(): Promise<void> {
        // Simulate async loading (reading files is actually quite fast)
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    getTreeItem(element: HookItem): vscode.TreeItem {
        return element;
    }
    
    async getChildren(element?: HookItem): Promise<HookItem[]> {
        if (!vscode.workspace.workspaceFolders) {
            return [];
        }

        // Check capability policy for hooks feature
        if (!element) {
            const visibility = await shouldShowFeature('hooks', 'list_hooks');
            if (!visibility.show) {
                // Show single informational affordance
                return [
                    new HookItem(
                        visibility.whyNot || 'Hooks are not supported by the current provider.',
                        vscode.TreeItemCollapsibleState.None,
                        'hooks-not-supported',
                        'not-supported',
                        undefined,
                        this.context
                    )
                ];
            }
        }

        if (!element) {
            // Show loading state
            if (this.isLoading) {
                return [
                    new HookItem(
                        'Loading agent hooks...',
                        vscode.TreeItemCollapsibleState.None,
                        'loading',
                        'loading',
                        undefined,
                        this.context
                    )
                ];
            }

            // Show Claude Code hooks directly at root level
            const hooks = await this.getClaudeCodeHooks();
            if (hooks.length === 0) {
                return [
                    new HookItem(
                        'No Claude Code hooks configured',
                        vscode.TreeItemCollapsibleState.None,
                        'no-hooks',
                        'no-hooks',
                        undefined,
                        this.context
                    )
                ];
            }
            
            return hooks.map(hook => new HookItem(
                hook.name,
                vscode.TreeItemCollapsibleState.Collapsed,
                'hook',
                `claude-hook-${hook.name}`,
                undefined, // 移除 command，让点击默认展开/折叠
                this.context,
                hook.enabled,
                hook.config,
                hook.configPath // 保存 configPath 以便后续使用
            ));
        } else if (element.contextValue === 'hook' && element.hookConfig) {
            // Show hook details as children
            const config = element.hookConfig;
            const items: HookItem[] = [];
            
            // Show each trigger configuration
            if (Array.isArray(config)) {
                config.forEach((trigger, index) => {
                    items.push(new HookItem(
                        `Trigger ${index + 1}`,
                        vscode.TreeItemCollapsibleState.Expanded,
                        'hook-trigger',
                        `trigger-${element.id}-${index}`,
                        element.configPath ? {
                            command: 'vscode.open',
                            title: 'Open Configuration File',
                            arguments: [vscode.Uri.file(element.configPath)]
                        } : undefined,
                        this.context,
                        undefined,
                        trigger
                    ));
                });
            }
            
            return items;
        } else if (element.contextValue === 'hook-trigger' && element.hookConfig) {
            // Show trigger details
            const trigger = element.hookConfig;
            const items: HookItem[] = [];
            
            if (trigger.matcher !== undefined) {
                items.push(new HookItem(
                    `Matcher: ${trigger.matcher || '(empty)'}`,
                    vscode.TreeItemCollapsibleState.None,
                    'hook-detail',
                    `${element.id}-matcher`,
                    element.command, // Keep parent's command (open config)
                    this.context
                ));
            }
            
            if (trigger.hooks && Array.isArray(trigger.hooks)) {
                trigger.hooks.forEach((hook: any, index: number) => {
                    if (hook.type === 'command') {
                        items.push(new HookItem(
                            `Command: ${hook.command}`,
                            vscode.TreeItemCollapsibleState.None,
                            'hook-command', // 使用特定的 contextValue
                            `${element.id}-command-${index}`,
                            {
                                command: 'kfc.hooks.copyCommand',
                                title: 'Copy Command',
                                arguments: [hook.command]
                            },
                            this.context
                        ));
                    }
                });
            }
            
            return items;
        }
        
        return [];
    }
    
    private async getClaudeCodeHooks(): Promise<{name: string, enabled: boolean, config: any, configPath: string}[]> {
        const hooks: {name: string, enabled: boolean, config: any, configPath: string}[] = [];
        
        // Check workspace .claude/settings.json first (remote-safe I/O)
        if (vscode.workspace.workspaceFolders) {
            const workspaceConfigUri = vscode.Uri.joinPath(
                vscode.workspace.workspaceFolders[0].uri,
                '.claude',
                'settings.json'
            );
            try {
                await vscode.workspace.fs.stat(workspaceConfigUri);
                // File exists, read it
                const fileContent = await vscode.workspace.fs.readFile(workspaceConfigUri);
                const config = JSON.parse(Buffer.from(fileContent).toString('utf8'));
                if (config.hooks) {
                    Object.entries(config.hooks).forEach(([name, value]) => {
                        hooks.push({
                            name,
                            enabled: true,
                            config: value,
                            configPath: workspaceConfigUri.fsPath
                        });
                    });
                }
            } catch (error) {
                // File doesn't exist or read failed - ignore silently
                // (This is expected if workspace config doesn't exist)
            }
        }
        
        // Then check global ~/.claude/settings.json (home directory - still use fs for now)
        // Note: Home directory access is not workspace-related, so Node fs is acceptable here
        // but we could convert to vscode.workspace.fs for consistency if needed
        try {
            const claudeConfigPath = path.join(process.env.HOME || '', '.claude', 'settings.json');
            const claudeConfigUri = vscode.Uri.file(claudeConfigPath);
            try {
                await vscode.workspace.fs.stat(claudeConfigUri);
                // File exists, read it
                const fileContent = await vscode.workspace.fs.readFile(claudeConfigUri);
                const config = JSON.parse(Buffer.from(fileContent).toString('utf8'));
                if (config.hooks) {
                    Object.entries(config.hooks).forEach(([name, value]) => {
                        // Only add if not already added from workspace
                        if (!hooks.find(h => h.name === name)) {
                            hooks.push({
                                name,
                                enabled: true,
                                config: value,
                                configPath: claudeConfigPath
                            });
                        }
                    });
                }
            } catch (error) {
                // File doesn't exist or read failed - ignore silently
            }
        } catch (error) {
            // Ignore errors reading global config
        }
        return hooks;
    }
}

class HookItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly id: string,
        public readonly command?: vscode.Command,
        private readonly context?: vscode.ExtensionContext,
        public readonly enabled?: boolean,
        public readonly hookConfig?: any,
        public readonly configPath?: string
    ) {
        super(label, collapsibleState);
        
        // Set appropriate icons
        if (contextValue === 'loading') {
            this.iconPath = new vscode.ThemeIcon('sync~spin');
        } else if (contextValue === 'hooks-not-supported') {
            this.iconPath = new vscode.ThemeIcon('info');
            this.tooltip = 'Hooks are only available with Claude Code';
        } else if (contextValue === 'no-hooks') {
            this.iconPath = new vscode.ThemeIcon('info');
        } else if (contextValue === 'hook') {
            this.iconPath = new vscode.ThemeIcon('activate-breakpoints');
        } else if (contextValue === 'hook-trigger') {
            this.iconPath = new vscode.ThemeIcon('run');
        } else if (contextValue === 'hook-detail') {
            if (label.startsWith('Matcher:')) {
                this.iconPath = new vscode.ThemeIcon('filter');
            } else if (label.startsWith('Command:')) {
                this.iconPath = new vscode.ThemeIcon('terminal');
            } else {
                this.iconPath = new vscode.ThemeIcon('circle-outline');
            }
        } else if (contextValue === 'hook-command') {
            this.iconPath = new vscode.ThemeIcon('terminal');
        } else if (context) {
            this.iconPath = {
                light: vscode.Uri.file(context.asAbsolutePath('icons/zap.svg')),
                dark: vscode.Uri.file(context.asAbsolutePath('icons/zap.svg'))
            };
        } else {
            this.iconPath = new vscode.ThemeIcon('activate-breakpoints');
        }
        
        // 不需要显示 Active/Inactive，因为出现在配置文件中的都是激活的
        
        // Set tooltips
        if (contextValue === 'no-hooks') {
            this.tooltip = 'Configure hooks in Claude Code CLI';
        } else if (contextValue === 'hook-detail' && label.startsWith('Command:')) {
            this.tooltip = label.substring(9); // Show full command in tooltip
        } else {
            this.tooltip = label;
        }
    }
}