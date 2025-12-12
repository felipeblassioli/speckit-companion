import * as vscode from 'vscode';
import type { IAIProvider } from '../../ai-providers/aiProvider';
import type { ActionId, AgentId, ProviderId, ICapabilityProber } from '../../ai-providers/providerCapabilities';
import { refineCapabilityWithInstalledCheck, getCapabilityWithProbe, clearProbeCache, type CapabilityQuery } from '../../ai-providers/providerCapabilities';
import { formatCapabilityMessage, formatNotInstalledMessage } from './capabilityMessages';
import { validateCapabilityStatus } from './capabilityValidation';

export type CapabilityGuardResult =
    | { ok: true }
    | { ok: false; message: string };

export interface CapabilityGuardInput {
    providerId: ProviderId;
    provider: IAIProvider;
    agent: AgentId;
    action: ActionId;
}

const installedCache: Map<string, boolean> = new Map();

function cacheKey(providerId: ProviderId): string {
    return providerId;
}

async function isInstalledCached(providerId: ProviderId, provider: IAIProvider): Promise<boolean> {
    const key = cacheKey(providerId);
    const cached = installedCache.get(key);
    if (cached !== undefined) {
        return cached;
    }
    const installed = await provider.isInstalled();
    installedCache.set(key, installed);
    return installed;
}

/**
 * Guard execution of a provider-backed action.
 *
 * Policy:
 * - No fallback by default.
 * - Unsupported/unknown MUST block with actionable message.
 * - Probing is lazy: installation check runs only at execution time.
 */
export async function ensureCapabilityOrExplain(
    input: CapabilityGuardInput,
    prober?: ICapabilityProber
): Promise<CapabilityGuardResult> {
    // Installation check is an allowed "safe probe" on-demand.
    const installed = await isInstalledCached(input.providerId, input.provider);
    if (!installed) {
        const message = formatNotInstalledMessage({ provider: input.provider });
        return { ok: false, message };
    }

    // Use generalized probing interface if provided, otherwise fall back to installed check
    const query: CapabilityQuery = {
        provider: input.providerId,
        agent: input.agent,
        action: input.action,
    };

    let status;
    if (prober) {
        status = await getCapabilityWithProbe(query, prober);
    } else {
        // Default: use installed check refinement
        status = await refineCapabilityWithInstalledCheck(input.provider, query);
    }

    // Validate status is well-formed (acceptance check)
    validateCapabilityStatus(status);

    if (status.kind === 'supported') {
        return { ok: true };
    }

    // Use centralized message formatting
    const message = formatCapabilityMessage(status, { provider: input.provider });
    return { ok: false, message };
}

export async function guardOrShowError(input: CapabilityGuardInput): Promise<boolean> {
    const result = await ensureCapabilityOrExplain(input);
    if (result.ok) {
        return true;
    }
    await vscode.window.showErrorMessage(result.message);
    return false;
}

export function clearCapabilityGuardCachesForTest(): void {
    installedCache.clear();
    // Also clear probe cache from providerCapabilities
    clearProbeCache();
}


