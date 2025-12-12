import * as vscode from 'vscode';
import * as path from 'path';
import { SpecExplorerProvider } from '../features/specs/specExplorerProvider';
import { SteeringExplorerProvider } from '../features/steering/steeringExplorerProvider';
import { HooksExplorerProvider } from '../features/hooks/hooksExplorerProvider';
import { MCPExplorerProvider } from '../features/mcp/mcpExplorerProvider';
import { AgentsExplorerProvider } from '../features/agents/agentsExplorerProvider';
import {
    parseTasksFile,
    detectNewlyCompletedPhases,
    extractSpecNameFromPath,
    initializeCache,
} from '../speckit/taskProgressService';
import { NotificationUtils } from './utils/notificationUtils';
import { getConfiguredProviderType, getProviderPaths } from '../ai-providers/aiProvider';

/**
 * Set up file watchers for the extension
 */
export function setupFileWatchers(
    context: vscode.ExtensionContext,
    specExplorer: SpecExplorerProvider,
    steeringExplorer: SteeringExplorerProvider,
    hooksExplorer: HooksExplorerProvider,
    mcpExplorer: MCPExplorerProvider,
    agentsExplorer: AgentsExplorerProvider,
    outputChannel: vscode.OutputChannel
): void {
    // Watch canonical .speckit directory (provider-agnostic)
    setupCanonicalDirectoryWatcher(context, specExplorer, steeringExplorer, hooksExplorer, mcpExplorer, agentsExplorer, outputChannel);

    // Watch provider-specific directories (only if provider uses them)
    const providerType = getConfiguredProviderType();
    const providerPaths = getProviderPaths(providerType);

    // Watch legacy .claude directory only if provider uses it
    if (providerPaths.steeringDir.includes('.claude') || providerPaths.agentsDir.includes('.claude')) {
        setupClaudeDirectoryWatcher(context, specExplorer, steeringExplorer, hooksExplorer, mcpExplorer, agentsExplorer, outputChannel);
    }

    // Watch for changes in Claude settings (only if hooks are supported)
    if (providerPaths.supportsHooks) {
        setupClaudeSettingsWatcher(context, hooksExplorer, mcpExplorer);
    }

    // Watch for changes in steering files (canonical + legacy)
    setupSteeringWatchers(context, steeringExplorer, providerPaths);
}

/**
 * Watch canonical .speckit directory (provider-agnostic)
 */
function setupCanonicalDirectoryWatcher(
    context: vscode.ExtensionContext,
    specExplorer: SpecExplorerProvider,
    steeringExplorer: SteeringExplorerProvider,
    hooksExplorer: HooksExplorerProvider,
    mcpExplorer: MCPExplorerProvider,
    agentsExplorer: AgentsExplorerProvider,
    outputChannel: vscode.OutputChannel
): void {
    const speckitWatcher = vscode.workspace.createFileSystemWatcher('**/.speckit/**/*');

    let refreshTimeout: NodeJS.Timeout | undefined;
    const debouncedRefresh = (event: string, uri: vscode.Uri) => {
        outputChannel.appendLine(`[FileWatcher] ${event}: ${uri.fsPath}`);

        if (refreshTimeout) {
            clearTimeout(refreshTimeout);
        }
        refreshTimeout = setTimeout(() => {
            specExplorer.refresh();
            steeringExplorer.refresh();
            hooksExplorer.refresh();
            mcpExplorer.refresh();
            agentsExplorer.refresh();
        }, 1000);
    };

    speckitWatcher.onDidCreate((uri) => debouncedRefresh('Create', uri));
    speckitWatcher.onDidDelete((uri) => debouncedRefresh('Delete', uri));
    speckitWatcher.onDidChange((uri) => debouncedRefresh('Change', uri));

    context.subscriptions.push(speckitWatcher);
}

/**
 * Watch .claude directory with debouncing (legacy, provider-specific)
 */
function setupClaudeDirectoryWatcher(
    context: vscode.ExtensionContext,
    specExplorer: SpecExplorerProvider,
    steeringExplorer: SteeringExplorerProvider,
    hooksExplorer: HooksExplorerProvider,
    mcpExplorer: MCPExplorerProvider,
    agentsExplorer: AgentsExplorerProvider,
    outputChannel: vscode.OutputChannel
): void {
    const claudeWatcher = vscode.workspace.createFileSystemWatcher('**/.claude/**/*');

    let refreshTimeout: NodeJS.Timeout | undefined;
    const debouncedRefresh = (event: string, uri: vscode.Uri) => {
        outputChannel.appendLine(`[FileWatcher] ${event}: ${uri.fsPath}`);

        if (refreshTimeout) {
            clearTimeout(refreshTimeout);
        }
        refreshTimeout = setTimeout(() => {
            specExplorer.refresh();
            steeringExplorer.refresh();
            hooksExplorer.refresh();
            mcpExplorer.refresh();
            agentsExplorer.refresh();
        }, 1000);
    };

    claudeWatcher.onDidCreate((uri) => debouncedRefresh('Create', uri));
    claudeWatcher.onDidDelete((uri) => debouncedRefresh('Delete', uri));
    claudeWatcher.onDidChange((uri) => debouncedRefresh('Change', uri));

    context.subscriptions.push(claudeWatcher);
}

/**
 * Watch Claude settings file
 */
function setupClaudeSettingsWatcher(
    context: vscode.ExtensionContext,
    hooksExplorer: HooksExplorerProvider,
    mcpExplorer: MCPExplorerProvider
): void {
    const claudeSettingsWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(process.env.HOME || '', '.claude/settings.json')
    );

    claudeSettingsWatcher.onDidChange(() => {
        hooksExplorer.refresh();
        mcpExplorer.refresh();
    });

    context.subscriptions.push(claudeSettingsWatcher);
}

/**
 * Watch steering files (canonical + legacy provider-specific)
 */
function setupSteeringWatchers(
    context: vscode.ExtensionContext,
    steeringExplorer: SteeringExplorerProvider,
    providerPaths: ReturnType<typeof getProviderPaths>
): void {
    // Watch canonical steering file
    const canonicalSteeringWatcher = vscode.workspace.createFileSystemWatcher('**/.speckit/STEERING.md');
    canonicalSteeringWatcher.onDidCreate(() => steeringExplorer.refresh());
    canonicalSteeringWatcher.onDidDelete(() => steeringExplorer.refresh());
    canonicalSteeringWatcher.onDidChange(() => steeringExplorer.refresh());
    context.subscriptions.push(canonicalSteeringWatcher);

    // Watch canonical steering directory
    const canonicalSteeringDirWatcher = vscode.workspace.createFileSystemWatcher('**/.speckit/steering/**/*');
    canonicalSteeringDirWatcher.onDidCreate(() => steeringExplorer.refresh());
    canonicalSteeringDirWatcher.onDidDelete(() => steeringExplorer.refresh());
    canonicalSteeringDirWatcher.onDidChange(() => steeringExplorer.refresh());
    context.subscriptions.push(canonicalSteeringDirWatcher);

    // Watch legacy provider-specific steering files (for backward compatibility)
    if (providerPaths.steeringFile) {
        // Watch project-level legacy file
        const legacyProjectWatcher = vscode.workspace.createFileSystemWatcher(`**/${providerPaths.steeringFile}`);
        legacyProjectWatcher.onDidCreate(() => steeringExplorer.refresh());
        legacyProjectWatcher.onDidDelete(() => steeringExplorer.refresh());
        legacyProjectWatcher.onDidChange(() => steeringExplorer.refresh());
        context.subscriptions.push(legacyProjectWatcher);

        // Watch global legacy file (if applicable)
        if (providerPaths.steeringFile !== '.github/copilot-instructions.md') {
            // Most providers have a global steering file in home directory
            const home = process.env.HOME || '';
            const globalPath = providerPaths.steeringFile.startsWith('.')
                ? path.join(home, providerPaths.steeringFile.replace(/^\./, ''))
                : path.join(home, '.claude', providerPaths.steeringFile);
            const legacyGlobalWatcher = vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(home, providerPaths.steeringFile)
            );
            legacyGlobalWatcher.onDidCreate(() => steeringExplorer.refresh());
            legacyGlobalWatcher.onDidDelete(() => steeringExplorer.refresh());
            legacyGlobalWatcher.onDidChange(() => steeringExplorer.refresh());
            context.subscriptions.push(legacyGlobalWatcher);
        }
    }
}

/**
 * Watch tasks.md files for phase completion notifications
 */
export function setupTasksWatcher(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel
): void {
    // Watch for tasks.md files in specs directories
    const tasksWatcher = vscode.workspace.createFileSystemWatcher('**/specs/**/tasks.md');

    // Debounce to avoid multiple notifications for rapid saves
    let debounceTimeout: NodeJS.Timeout | undefined;

    const handleTasksChange = async (uri: vscode.Uri) => {
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        debounceTimeout = setTimeout(async () => {
            try {
                const content = await vscode.workspace.fs.readFile(uri);
                const specName = extractSpecNameFromPath(uri.fsPath);
                const progress = parseTasksFile(content.toString(), specName, uri.fsPath);
                const completedPhases = detectNewlyCompletedPhases(uri.fsPath, progress);

                for (const phaseName of completedPhases) {
                    outputChannel.appendLine(`[TasksWatcher] Phase completed: "${phaseName}" in ${specName}`);
                    await NotificationUtils.showPhaseCompleteNotification(specName, phaseName, uri.fsPath);
                }
            } catch (error) {
                outputChannel.appendLine(`[TasksWatcher] Error processing ${uri.fsPath}: ${error}`);
            }
        }, 500);
    };

    // Initialize cache when file is created (avoid false notifications on first open)
    const handleTasksCreate = async (uri: vscode.Uri) => {
        try {
            const content = await vscode.workspace.fs.readFile(uri);
            const specName = extractSpecNameFromPath(uri.fsPath);
            const progress = parseTasksFile(content.toString(), specName, uri.fsPath);
            initializeCache(uri.fsPath, progress);
            outputChannel.appendLine(`[TasksWatcher] Initialized cache for ${specName}`);
        } catch (error) {
            outputChannel.appendLine(`[TasksWatcher] Error initializing ${uri.fsPath}: ${error}`);
        }
    };

    tasksWatcher.onDidChange(handleTasksChange);
    tasksWatcher.onDidCreate(handleTasksCreate);

    context.subscriptions.push(tasksWatcher);

    // Initialize cache for existing tasks.md files on startup
    initializeExistingTasksCache(outputChannel);
}

/**
 * Scan workspace for existing tasks.md files and initialize their cache
 * This prevents false "phase completed" notifications on first file change
 */
async function initializeExistingTasksCache(outputChannel: vscode.OutputChannel): Promise<void> {
    try {
        const tasksFiles = await vscode.workspace.findFiles('**/specs/**/tasks.md', '**/node_modules/**');
        outputChannel.appendLine(`[TasksWatcher] Found ${tasksFiles.length} existing tasks.md files`);

        for (const uri of tasksFiles) {
            try {
                const content = await vscode.workspace.fs.readFile(uri);
                const specName = extractSpecNameFromPath(uri.fsPath);
                const progress = parseTasksFile(content.toString(), specName, uri.fsPath);
                initializeCache(uri.fsPath, progress);
                outputChannel.appendLine(`[TasksWatcher] Cached: ${specName} (${progress.completedTasks}/${progress.totalTasks} tasks)`);
            } catch (error) {
                outputChannel.appendLine(`[TasksWatcher] Error caching ${uri.fsPath}: ${error}`);
            }
        }
    } catch (error) {
        outputChannel.appendLine(`[TasksWatcher] Error scanning for tasks.md files: ${error}`);
    }
}
