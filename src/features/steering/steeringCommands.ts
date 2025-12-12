import * as vscode from 'vscode';
import { SteeringManager } from './steeringManager';
import { SteeringExplorerProvider } from './steeringExplorerProvider';
import { AgentsExplorerProvider } from '../agents/agentsExplorerProvider';
import { getConfiguredProviderType } from '../../ai-providers/aiProvider';

/**
 * Register steering-related commands
 */
export function registerSteeringCommands(
    context: vscode.ExtensionContext,
    steeringManager: SteeringManager,
    steeringExplorer: SteeringExplorerProvider,
    agentsExplorer: AgentsExplorerProvider,
    outputChannel: vscode.OutputChannel
): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('speckit.steering.create', async () => {
            await steeringManager.createCustom();
        }),

        vscode.commands.registerCommand('speckit.steering.refine', async (item: any) => {
            const uri = vscode.Uri.file(item.resourcePath);
            await steeringManager.refine(uri);
        }),

        vscode.commands.registerCommand('speckit.steering.delete', async (item: any) => {
            outputChannel.appendLine(`[Steering] Deleting: ${item.label}`);
            const result = await steeringManager.delete(item.label, item.resourcePath);
            if (!result.success && result.error) {
                vscode.window.showErrorMessage(result.error);
            }
        }),

        vscode.commands.registerCommand('speckit.steering.createUserRule', async () => {
            const providerType = getConfiguredProviderType();
            if (providerType !== 'claude') {
                vscode.window.showErrorMessage(
                    `This action is only supported when the AI provider is set to Claude (current: ${providerType}).`
                );
                return;
            }
            await steeringManager.createUserClaudeMd();
        }),

        vscode.commands.registerCommand('speckit.steering.createProjectRule', async () => {
            const providerType = getConfiguredProviderType();
            if (providerType !== 'claude') {
                vscode.window.showErrorMessage(
                    `This action is only supported when the AI provider is set to Claude (current: ${providerType}).`
                );
                return;
            }
            await steeringManager.createProjectClaudeMd();
        }),

        vscode.commands.registerCommand('speckit.steering.refresh', async () => {
            outputChannel.appendLine('[Manual Refresh] Refreshing steering explorer...');
            steeringExplorer.refresh();
        }),

        // Agents commands
        vscode.commands.registerCommand('speckit.agents.refresh', async () => {
            outputChannel.appendLine('[Manual Refresh] Refreshing agents explorer...');
            agentsExplorer.refresh();
        })
    );
}
