import * as vscode from 'vscode';
import type { IAIProvider } from '../../ai-providers/aiProvider';
import { registerSpecKitCommands } from './specCommands';

jest.mock('../../extension', () => ({
  getAIProvider: () => mockedProvider,
}));

jest.mock('../../ai-providers/aiProvider', () => ({
  getConfiguredProviderType: () => 'gemini',
}));

const guardOrShowError = jest.fn<Promise<boolean>, [any]>();
jest.mock('../../core/utils/capabilityGuard', () => ({
  guardOrShowError: (args: any) => guardOrShowError(args),
}));

let mockedProvider: IAIProvider;

describe('specCommands capability gating', () => {
  beforeEach(() => {
    guardOrShowError.mockReset();
    mockedProvider = {
      name: 'Gemini CLI',
      isInstalled: async () => true,
      executeInTerminal: async () => {
        throw new Error('not used');
      },
      executeHeadless: async () => ({ exitCode: 0 }),
      executeSlashCommand: jest.fn(async () => ({} as unknown as vscode.Terminal)),
      executeHeadlessMutating: async () => ({ exitCode: 0 }),
    };
  });

  test('does not execute slash command when guard blocks', async () => {
    guardOrShowError.mockResolvedValue(false);

    const context = { subscriptions: [] as Array<{ dispose(): unknown }> } as any;
    const specExplorer = { refresh: jest.fn() } as any;
    const detector = { workspaceInitialized: true } as any;
    const outputChannel = { appendLine: jest.fn() } as any;

    registerSpecKitCommands(context, specExplorer, detector, outputChannel);

    const cmd = (vscode.commands as any).__getRegisteredCommand('speckit.specify') as
      | ((specDir?: string) => Promise<void>)
      | undefined;
    expect(cmd).toBeDefined();

    await cmd?.('/workspace/specs/foo');

    expect(guardOrShowError).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: 'gemini',
        agent: 'workflow',
        action: 'run_speckit_specify',
      })
    );
    expect((mockedProvider.executeSlashCommand as any).mock.calls.length).toBe(0);
  });

  test('executes slash command when guard allows', async () => {
    guardOrShowError.mockResolvedValue(true);

    const context = { subscriptions: [] as Array<{ dispose(): unknown }> } as any;
    const specExplorer = { refresh: jest.fn() } as any;
    const detector = { workspaceInitialized: true } as any;
    const outputChannel = { appendLine: jest.fn() } as any;

    registerSpecKitCommands(context, specExplorer, detector, outputChannel);

    const cmd = (vscode.commands as any).__getRegisteredCommand('speckit.specify') as
      | ((specDir?: string) => Promise<void>)
      | undefined;
    expect(cmd).toBeDefined();

    await cmd?.('/workspace/specs/foo');

    expect(mockedProvider.executeSlashCommand).toHaveBeenCalledWith(
      '/speckit.specify /workspace/specs/foo',
      'SpecKit - Specify'
    );
  });
});


