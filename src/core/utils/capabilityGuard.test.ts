import type { IAIProvider } from '../../ai-providers/aiProvider';
import { clearCapabilityGuardCachesForTest, ensureCapabilityOrExplain } from './capabilityGuard';
import type { ActionId } from '../../ai-providers/providerCapabilities';

function fakeProvider(name: string, installed: boolean): IAIProvider {
  return {
    name,
    isInstalled: async () => installed,
    executeInTerminal: async () => {
      throw new Error('not used');
    },
    executeHeadless: async () => ({ exitCode: 0 }),
    executeSlashCommand: async () => {
      throw new Error('not used');
    },
    executeHeadlessMutating: async () => ({ exitCode: 0 }),
  };
}

describe('capabilityGuard', () => {
  beforeEach(() => clearCapabilityGuardCachesForTest());

  test('blocks when provider is not installed (before capability check)', async () => {
    const provider = fakeProvider('Cursor Agent', false);
    const res = await ensureCapabilityOrExplain({
      providerId: 'cursor-agent',
      provider,
      agent: 'workflow',
      action: 'run_speckit_specify',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toMatch(/not installed/i);
    }
  });

  test('blocks unsupported baseline actions with reason (no fallback)', async () => {
    const provider = fakeProvider('Gemini CLI', true);
    const res = await ensureCapabilityOrExplain({
      providerId: 'gemini',
      provider,
      agent: 'workflow',
      action: 'run_speckit_specify',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toMatch(/not supported/i);
    }
  });

  test('blocks unknown actions with actionable message (no guessing)', async () => {
    const provider = fakeProvider('Claude Code', true);
    const res = await ensureCapabilityOrExplain({
      providerId: 'claude',
      provider,
      agent: 'workflow',
      // Force an unmapped action id to validate the "unknown blocks" policy.
      action: 'run_speckit__unknown_action' as unknown as ActionId,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toMatch(/(not available|unknown)/i);
    }
  });
});


