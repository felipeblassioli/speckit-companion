import { BASELINE_CAPABILITIES, getBaselineCapability } from './providerCapabilities';

describe('providerCapabilities baseline map', () => {
  test('has baseline capabilities for all declared providers', () => {
    expect(Object.keys(BASELINE_CAPABILITIES).sort()).toEqual(
      ['claude', 'copilot', 'cursor-agent', 'gemini'].sort()
    );
  });

  test('declares workflow specify supported for claude', () => {
    const c = getBaselineCapability({
      provider: 'claude',
      agent: 'workflow',
      action: 'run_speckit_specify',
    });
    expect(c.kind).toBe('supported');
  });

  test('declares workflow specify unsupported for gemini (baseline)', () => {
    const c = getBaselineCapability({
      provider: 'gemini',
      agent: 'workflow',
      action: 'run_speckit_specify',
    });
    expect(c.kind).toBe('unsupported');
  });
});


