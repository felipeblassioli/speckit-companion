import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ConfigManager } from '../core/utils/configManager';
import { ConfigKeys, Timing } from '../core/constants';
import { IAIProvider, AIExecutionResult } from './aiProvider';

const execAsync = promisify(exec);

/**
 * Cursor Agent provider implementation
 * Uses cursor-agent CLI with non-interactive mode by default
 */
export class CursorAgentProvider implements IAIProvider {
    public readonly name = 'Cursor Agent';

    private context: vscode.ExtensionContext;
    private outputChannel: vscode.OutputChannel;
    private configManager: ConfigManager;

    constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
        this.context = context;
        this.outputChannel = outputChannel;

        this.configManager = ConfigManager.getInstance();
        this.configManager.loadSettings();

        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(ConfigKeys.namespace)) {
                this.configManager.loadSettings();
            }
        });
    }

    /**
     * Check if Cursor Agent CLI is installed
     */
    async isInstalled(): Promise<boolean> {
        try {
            const cliPath = this.getCliPath();
            await execAsync(`${cliPath} --help`);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get the CLI command path
     */
    private getCliPath(): string {
        const config = vscode.workspace.getConfiguration('speckit');
        return config.get<string>('cursorAgentPath', 'cursor-agent');
    }

    /**
     * Create a temporary file with content
     */
    private async createTempFile(content: string, prefix: string = 'prompt'): Promise<string> {
        const tempDir = this.context.globalStorageUri.fsPath;
        await vscode.workspace.fs.createDirectory(this.context.globalStorageUri);

        const tempFile = path.join(tempDir, `${prefix}-${Date.now()}.md`);
        await fs.promises.writeFile(tempFile, content);

        return tempFile;
    }

    /**
     * Execute a prompt in a visible terminal (non-interactive mode)
     */
    async executeInTerminal(prompt: string, title: string = 'SpecKit - Cursor Agent'): Promise<vscode.Terminal> {
        try {
            const cliPath = this.getCliPath();
            const promptFilePath = await this.createTempFile(prompt, 'prompt');

            // Use non-interactive mode (-p) with text output for human readability
            const commandLine = `${cliPath} -p --output-format text "$(cat "${promptFilePath}")"`;

            const terminal = vscode.window.createTerminal({
                name: title,
                cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
                location: {
                    viewColumn: vscode.ViewColumn.Two
                }
            });

            terminal.show();

            const delay = this.configManager.getTerminalDelay();
            setTimeout(() => {
                terminal.sendText(commandLine, true);
            }, delay);

            // Clean up temp file after delay
            setTimeout(async () => {
                try {
                    await fs.promises.unlink(promptFilePath);
                    this.outputChannel.appendLine(`[CursorAgent] Cleaned up prompt file: ${promptFilePath}`);
                } catch (e) {
                    this.outputChannel.appendLine(`[CursorAgent] Failed to cleanup temp file: ${e}`);
                }
            }, Timing.tempFileCleanupDelay);

            return terminal;

        } catch (error) {
            this.outputChannel.appendLine(`ERROR: Failed to send to Cursor Agent: ${error}`);
            vscode.window.showErrorMessage(`Failed to run Cursor Agent: ${error}`);
            throw error;
        }
    }

    /**
     * Execute a prompt in headless/background mode (non-interactive)
     */
    async executeHeadless(prompt: string): Promise<AIExecutionResult> {
        this.outputChannel.appendLine(`[CursorAgentProvider] Invoking Cursor Agent in headless mode`);
        this.outputChannel.appendLine(`========================================`);
        this.outputChannel.appendLine(prompt);
        this.outputChannel.appendLine(`========================================`);

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const cwd = workspaceFolder?.uri.fsPath;
        const cliPath = this.getCliPath();

        const promptFilePath = await this.createTempFile(prompt, 'background-prompt');

        // Use non-interactive mode with JSON output for machine readability
        const commandLine = `${cliPath} -p --output-format json "$(cat "${promptFilePath}")"`;

        const terminal = vscode.window.createTerminal({
            name: 'Cursor Agent Background',
            cwd,
            hideFromUser: true
        });

        return new Promise((resolve) => {
            let shellIntegrationChecks = 0;

            const checkShellIntegration = setInterval(() => {
                shellIntegrationChecks++;

                if (terminal.shellIntegration) {
                    clearInterval(checkShellIntegration);

                    const execution = terminal.shellIntegration.executeCommand(commandLine);

                    const disposable = vscode.window.onDidEndTerminalShellExecution(event => {
                        if (event.terminal === terminal && event.execution === execution) {
                            disposable.dispose();

                            if (event.exitCode !== 0) {
                                this.outputChannel.appendLine(`[CursorAgent] Command failed with exit code: ${event.exitCode}`);
                                this.outputChannel.appendLine(`[CursorAgent] Command was: ${commandLine}`);
                            }

                            resolve({
                                exitCode: event.exitCode,
                                output: undefined
                            });

                            setTimeout(async () => {
                                terminal.dispose();
                                try {
                                    await fs.promises.unlink(promptFilePath);
                                    this.outputChannel.appendLine(`[CursorAgent] Cleaned up temp file: ${promptFilePath}`);
                                } catch (e) {
                                    this.outputChannel.appendLine(`[CursorAgent] Failed to cleanup temp file: ${e}`);
                                }
                            }, Timing.terminalDisposeDelay);
                        }
                    });
                } else if (shellIntegrationChecks > Timing.shellIntegrationMaxChecks) {
                    clearInterval(checkShellIntegration);
                    this.outputChannel.appendLine(`[CursorAgent] Shell integration not available, using fallback mode`);
                    terminal.sendText(commandLine);

                    setTimeout(async () => {
                        resolve({ exitCode: undefined });
                        terminal.dispose();
                        try {
                            await fs.promises.unlink(promptFilePath);
                        } catch (e) {
                            // Ignore cleanup errors
                        }
                    }, Timing.shellIntegrationFallbackTimeout);
                }
            }, Timing.shellIntegrationCheckInterval);
        });
    }

    /**
     * Execute a prompt in headless/background mode (mutating - uses --force)
     */
    async executeHeadlessMutating(prompt: string): Promise<AIExecutionResult> {
        this.outputChannel.appendLine(`[CursorAgentProvider] Invoking Cursor Agent in headless mutating mode`);
        this.outputChannel.appendLine(`========================================`);
        this.outputChannel.appendLine(prompt);
        this.outputChannel.appendLine(`========================================`);

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const cwd = workspaceFolder?.uri.fsPath;
        const cliPath = this.getCliPath();

        const promptFilePath = await this.createTempFile(prompt, 'background-mutating-prompt');

        // Use non-interactive mode with JSON output and --force for mutating operations
        const commandLine = `${cliPath} -p --force --output-format json "$(cat "${promptFilePath}")"`;

        const terminal = vscode.window.createTerminal({
            name: 'Cursor Agent Background (Mutating)',
            cwd,
            hideFromUser: true
        });

        return new Promise((resolve) => {
            let shellIntegrationChecks = 0;

            const checkShellIntegration = setInterval(() => {
                shellIntegrationChecks++;

                if (terminal.shellIntegration) {
                    clearInterval(checkShellIntegration);

                    const execution = terminal.shellIntegration.executeCommand(commandLine);

                    const disposable = vscode.window.onDidEndTerminalShellExecution(event => {
                        if (event.terminal === terminal && event.execution === execution) {
                            disposable.dispose();

                            if (event.exitCode !== 0) {
                                this.outputChannel.appendLine(`[CursorAgent] Mutating command failed with exit code: ${event.exitCode}`);
                                this.outputChannel.appendLine(`[CursorAgent] Command was: ${commandLine}`);
                            }

                            resolve({
                                exitCode: event.exitCode,
                                output: undefined
                            });

                            setTimeout(async () => {
                                terminal.dispose();
                                try {
                                    await fs.promises.unlink(promptFilePath);
                                    this.outputChannel.appendLine(`[CursorAgent] Cleaned up mutating prompt file: ${promptFilePath}`);
                                } catch (e) {
                                    this.outputChannel.appendLine(`[CursorAgent] Failed to cleanup temp file: ${e}`);
                                }
                            }, Timing.terminalDisposeDelay);
                        }
                    });
                } else if (shellIntegrationChecks > Timing.shellIntegrationMaxChecks) {
                    clearInterval(checkShellIntegration);
                    this.outputChannel.appendLine(`[CursorAgent] Shell integration not available, using fallback mode`);
                    terminal.sendText(commandLine);

                    setTimeout(async () => {
                        resolve({ exitCode: undefined });
                        terminal.dispose();
                        try {
                            await fs.promises.unlink(promptFilePath);
                        } catch (e) {
                            // Ignore cleanup errors
                        }
                    }, Timing.shellIntegrationFallbackTimeout);
                }
            }, Timing.shellIntegrationCheckInterval);
        });
    }

    /**
     * Execute a slash command (mutating mode)
     * Translates SpecKit slash commands into prompts for cursor-agent
     */
    async executeSlashCommand(command: string, title: string = 'SpecKit - Cursor Agent', autoExecute: boolean = true): Promise<vscode.Terminal> {
        try {
            // Ensure command starts with /
            const slashCommand = command.startsWith('/') ? command : `/${command}`;

            // Translate slash command to a cursor-agent prompt
            const prompt = this.translateSlashCommandToPrompt(slashCommand);
            const cliPath = this.getCliPath();
            const promptFilePath = await this.createTempFile(prompt, 'slash-command');

            // Use non-interactive mode with --force since slash commands are mutating
            const commandLine = `${cliPath} -p --force --output-format text "$(cat "${promptFilePath}")"`;

            const terminal = vscode.window.createTerminal({
                name: title,
                cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
                location: {
                    viewColumn: vscode.ViewColumn.Two
                }
            });

            terminal.show();

            const delay = this.configManager.getTerminalDelay();
            setTimeout(() => {
                // autoExecute=false: show command but don't press Enter (user can add more input)
                terminal.sendText(commandLine, autoExecute);
            }, delay);

            // Clean up temp file after delay
            setTimeout(async () => {
                try {
                    await fs.promises.unlink(promptFilePath);
                    this.outputChannel.appendLine(`[CursorAgent] Cleaned up slash command file: ${promptFilePath}`);
                } catch (e) {
                    this.outputChannel.appendLine(`[CursorAgent] Failed to cleanup temp file: ${e}`);
                }
            }, Timing.tempFileCleanupDelay);

            return terminal;

        } catch (error) {
            this.outputChannel.appendLine(`ERROR: Failed to execute slash command: ${error}`);
            vscode.window.showErrorMessage(`Failed to run Cursor Agent: ${error}`);
            throw error;
        }
    }

    /**
     * Translate SpecKit slash commands into cursor-agent prompts
     */
    private translateSlashCommandToPrompt(command: string): string {
        const parts = command.split(' ');
        const baseCommand = parts[0];
        const args = parts.slice(1);

        switch (baseCommand) {
            case '/speckit.specify':
                return this.createSpecifyPrompt(args[0]);

            case '/speckit.plan':
                return this.createPlanPrompt(args[0]);

            case '/speckit.tasks':
                return this.createTasksPrompt(args[0]);

            case '/speckit.implement':
                return this.createImplementPrompt(args[0]);

            case '/speckit.clarify':
                return this.createClarifyPrompt(args[0]);

            case '/speckit.analyze':
                return this.createAnalyzePrompt(args[0]);

            case '/speckit.checklist':
                return this.createChecklistPrompt(args[0]);

            case '/speckit.constitution':
                return this.createConstitutionPrompt();

            default:
                // Fallback: create a generic prompt
                return `Execute the following SpecKit command: ${command}

Please interpret this command and perform the appropriate actions in the workspace.`;
        }
    }

    private createSpecifyPrompt(specDir?: string): string {
        if (specDir) {
            return `Update the requirements specification for the spec located at: specs/${specDir}

Please read the existing spec.md file (if it exists) and refine/improve the requirements section with more detailed and specific requirements. Focus on functional and non-functional requirements that would help guide the implementation.`;
        } else {
            return `Create a new requirements specification. Please ask me what feature I want to build, then create a new folder under specs/ with a descriptive name and write a spec.md file with detailed requirements.`;
        }
    }

    private createPlanPrompt(specDir: string): string {
        return `Create/update the implementation plan for the spec located at: specs/${specDir}

Please:
1. Read the existing spec.md file to understand the requirements
2. Create or update plan.md with a detailed implementation plan
3. Break down the work into logical phases and components
4. Include technical decisions and architecture considerations
5. Estimate complexity and dependencies for each part`;
    }

    private createTasksPrompt(specDir: string): string {
        return `Create/update the task breakdown for the spec located at: specs/${specDir}

Please:
1. Read the existing spec.md and plan.md files
2. Create or update tasks.md with a detailed breakdown of implementation tasks
3. Break down the work into specific, actionable development tasks
4. Include acceptance criteria for each task
5. Prioritize tasks and identify dependencies`;
    }

    private createImplementPrompt(specDir: string): string {
        return `Begin implementation of the spec located at: specs/${specDir}

Please:
1. Read the existing spec.md, plan.md, and tasks.md files
2. Start implementing the code according to the specifications
3. Create necessary files and implement the required functionality
4. Update task status as you complete work
5. Follow the established patterns and architecture from the plan`;
    }

    private createClarifyPrompt(specDir: string): string {
        return `Review and clarify the spec located at: specs/${specDir}

Please:
1. Read all existing documentation (spec.md, plan.md, tasks.md)
2. Identify areas that need clarification or are ambiguous
3. Ask specific questions about unclear requirements
4. Suggest improvements to make the specifications more complete and actionable`;
    }

    private createAnalyzePrompt(specDir: string): string {
        return `Analyze the current state of the spec located at: specs/${specDir}

Please:
1. Read all existing documentation
2. Assess the completeness and quality of the specifications
3. Identify risks, gaps, or potential issues
4. Provide recommendations for improvement
5. Evaluate the feasibility of the proposed implementation`;
    }

    private createChecklistPrompt(specDir: string): string {
        return `Create a completion checklist for the spec located at: specs/${specDir}

Please:
1. Read all existing documentation
2. Create a comprehensive checklist of all requirements and tasks
3. Mark completed items and identify remaining work
4. Identify any blocking issues or dependencies
5. Provide a clear status summary`;
    }

    private createConstitutionPrompt(): string {
        return `Review and update the project constitution.

Please check if .specify/memory/constitution.md exists. If it does, read it and suggest improvements to the project principles and guidelines. If it doesn't exist, explain that SpecKit needs to be initialized first to have a constitution file.

Focus on:
1. Code quality standards
2. Architecture principles
3. Development practices
4. Project-specific guidelines`;
    }

    // Legacy method aliases for backwards compatibility
    async invokeCursorAgentSplitView(prompt: string, title?: string): Promise<vscode.Terminal> {
        return this.executeInTerminal(prompt, title);
    }

    async invokeCursorAgentHeadless(prompt: string): Promise<AIExecutionResult> {
        return this.executeHeadless(prompt);
    }
}
