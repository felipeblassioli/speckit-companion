import { getConfiguredProviderType, type AIProviderType } from './aiProvider';
import type { IAIProvider } from './aiProvider';

export type ProviderId = AIProviderType;

/**
 * Agent roles are extension-level concepts (not necessarily provider-native).
 * Keep this small and stable; add new roles only when they "pay rent".
 */
export type AgentId =
    | 'workflow'  // spec workflow commands: specify/plan/tasks/implement/clarify/analyze/checklist/constitution
    | 'mcp'       // MCP server management
    | 'hooks'     // Hook configuration and management
    | 'agents'    // Agent management
    | 'skills'    // Skill management
    | 'steering'; // Steering document management

/**
 * Action identifiers represent extension-level operations that may or may not be supported per provider/agent.
 * These MUST remain stable and provider-agnostic.
 */
export type ActionId =
    // Workflow actions
    | 'run_speckit_specify'
    | 'run_speckit_plan'
    | 'run_speckit_tasks'
    | 'run_speckit_implement'
    | 'run_speckit_clarify'
    | 'run_speckit_analyze'
    | 'run_speckit_checklist'
    | 'run_speckit_constitution'
    // MCP actions
    | 'list_mcp_servers'
    | 'get_mcp_server_details'
    // Hooks actions
    | 'list_hooks'
    // Agents actions
    | 'list_agents'
    | 'initialize_built_in_agents'
    // Skills actions
    | 'list_skills'
    | 'initialize_built_in_skills'
    // Steering actions
    | 'create_steering_doc'
    | 'list_steering_docs';

export type CapabilityStatus =
    | { kind: 'supported' }
    | { kind: 'unsupported'; reason: string }
    | { kind: 'unknown'; reason: string };

/**
 * CapabilityMap is intentionally sparse at the per-agent action level.
 *
 * Each agent should only declare the actions it owns; missing actions resolve to `unknown`
 * via `getBaselineCapability()`.
 */
export type CapabilityMap = Record<
    ProviderId,
    Record<AgentId, Partial<Record<ActionId, CapabilityStatus>>>
>;

function supported(): CapabilityStatus {
    return { kind: 'supported' };
}

function unsupported(reason: string): CapabilityStatus {
    return { kind: 'unsupported', reason };
}

/**
 * Baseline map must exist without probing local environment.
 * We can refine on-demand (e.g., check CLI installed) at execution time.
 *
 * NOTE: Gemini/Copilot currently do not have a deterministic implementation for SpecKit slash-commands in this extension.
 * We intentionally mark them unsupported to avoid confusing “silent failures”.
 */
export const BASELINE_CAPABILITIES: CapabilityMap = {
    claude: {
        workflow: {
            run_speckit_specify: supported(),
            run_speckit_plan: supported(),
            run_speckit_tasks: supported(),
            run_speckit_implement: supported(),
            run_speckit_clarify: supported(),
            run_speckit_analyze: supported(),
            run_speckit_checklist: supported(),
            run_speckit_constitution: supported(),
        },
        mcp: {
            list_mcp_servers: supported(),
            get_mcp_server_details: supported(),
        },
        hooks: {
            list_hooks: supported(),
        },
        agents: {
            list_agents: supported(),
            initialize_built_in_agents: supported(),
        },
        skills: {
            list_skills: supported(),
            initialize_built_in_skills: supported(),
        },
        steering: {
            create_steering_doc: supported(),
            list_steering_docs: supported(),
        },
    },
    'cursor-agent': {
        workflow: {
            run_speckit_specify: supported(),
            run_speckit_plan: supported(),
            run_speckit_tasks: supported(),
            run_speckit_implement: supported(),
            run_speckit_clarify: supported(),
            run_speckit_analyze: supported(),
            run_speckit_checklist: supported(),
            run_speckit_constitution: supported(),
        },
        mcp: {
            list_mcp_servers: unsupported('Cursor Agent does not have an MCP feature.'),
            get_mcp_server_details: unsupported('Cursor Agent does not have an MCP feature.'),
        },
        hooks: {
            list_hooks: unsupported('Cursor Agent does not support hooks.'),
        },
        agents: {
            list_agents: supported(),
            initialize_built_in_agents: supported(),
        },
        skills: {
            list_skills: unsupported('Cursor Agent does not support skills.'),
            initialize_built_in_skills: unsupported('Cursor Agent does not support skills.'),
        },
        steering: {
            create_steering_doc: supported(),
            list_steering_docs: supported(),
        },
    },
    gemini: {
        workflow: {
            run_speckit_specify: unsupported('SpecKit slash-command execution is not implemented for Gemini provider yet.'),
            run_speckit_plan: unsupported('SpecKit slash-command execution is not implemented for Gemini provider yet.'),
            run_speckit_tasks: unsupported('SpecKit slash-command execution is not implemented for Gemini provider yet.'),
            run_speckit_implement: unsupported('SpecKit slash-command execution is not implemented for Gemini provider yet.'),
            run_speckit_clarify: unsupported('SpecKit slash-command execution is not implemented for Gemini provider yet.'),
            run_speckit_analyze: unsupported('SpecKit slash-command execution is not implemented for Gemini provider yet.'),
            run_speckit_checklist: unsupported('SpecKit slash-command execution is not implemented for Gemini provider yet.'),
            run_speckit_constitution: unsupported('SpecKit slash-command execution is not implemented for Gemini provider yet.'),
        },
        mcp: {
            list_mcp_servers: unsupported('Gemini CLI does not have an MCP feature.'),
            get_mcp_server_details: unsupported('Gemini CLI does not have an MCP feature.'),
        },
        hooks: {
            list_hooks: unsupported('Gemini CLI does not support hooks.'),
        },
        agents: {
            list_agents: unsupported('Gemini CLI has limited agent support.'),
            initialize_built_in_agents: unsupported('Gemini CLI has limited agent support.'),
        },
        skills: {
            list_skills: unsupported('Gemini CLI does not support skills.'),
            initialize_built_in_skills: unsupported('Gemini CLI does not support skills.'),
        },
        steering: {
            create_steering_doc: supported(),
            list_steering_docs: supported(),
        },
    },
    copilot: {
        workflow: {
            run_speckit_specify: unsupported('SpecKit slash-command execution is not implemented for Copilot provider yet.'),
            run_speckit_plan: unsupported('SpecKit slash-command execution is not implemented for Copilot provider yet.'),
            run_speckit_tasks: unsupported('SpecKit slash-command execution is not implemented for Copilot provider yet.'),
            run_speckit_implement: unsupported('SpecKit slash-command execution is not implemented for Copilot provider yet.'),
            run_speckit_clarify: unsupported('SpecKit slash-command execution is not implemented for Copilot provider yet.'),
            run_speckit_analyze: unsupported('SpecKit slash-command execution is not implemented for Copilot provider yet.'),
            run_speckit_checklist: unsupported('SpecKit slash-command execution is not implemented for Copilot provider yet.'),
            run_speckit_constitution: unsupported('SpecKit slash-command execution is not implemented for Copilot provider yet.'),
        },
        mcp: {
            list_mcp_servers: unsupported('GitHub Copilot CLI does not have an MCP feature.'),
            get_mcp_server_details: unsupported('GitHub Copilot CLI does not have an MCP feature.'),
        },
        hooks: {
            list_hooks: unsupported('GitHub Copilot CLI does not support hooks.'),
        },
        agents: {
            list_agents: supported(),
            initialize_built_in_agents: supported(),
        },
        skills: {
            list_skills: unsupported('GitHub Copilot CLI does not support skills.'),
            initialize_built_in_skills: unsupported('GitHub Copilot CLI does not support skills.'),
        },
        steering: {
            create_steering_doc: supported(),
            list_steering_docs: supported(),
        },
    },
};

export interface CapabilityQuery {
    provider: ProviderId;
    agent: AgentId;
    action: ActionId;
}

export function getBaselineCapability(query: CapabilityQuery): CapabilityStatus {
    return BASELINE_CAPABILITIES[query.provider]?.[query.agent]?.[query.action] ?? {
        kind: 'unknown',
        reason: `No baseline capability declared for provider=${query.provider}, agent=${query.agent}, action=${query.action}`,
    };
}

/**
 * On-demand refinement: checks provider installation status and converts supported→unsupported when not installed.
 * This is intentionally lazy (execution-time) and safe (no activation probing).
 */
export async function refineCapabilityWithInstalledCheck(
    provider: IAIProvider,
    query: Omit<CapabilityQuery, 'provider'> & { provider: ProviderId }
): Promise<CapabilityStatus> {
    const baseline = getBaselineCapability(query);
    if (baseline.kind !== 'supported') {
        return baseline;
    }

    const installed = await provider.isInstalled();
    if (!installed) {
        return {
            kind: 'unsupported',
            reason: `${provider.name} is not installed or not available on PATH.`,
        };
    }

    return baseline;
}

export function getSelectedProviderId(): ProviderId {
    return getConfiguredProviderType();
}

/**
 * Optional probe interface for refining baseline capabilities at runtime.
 * Probes are lazy (execution-time only) and safe (no activation-time execution).
 */
export interface ICapabilityProber {
    /**
     * Probe a capability to refine the baseline status.
     * Should return the baseline if no refinement is needed, or a refined status.
     * @param providerId The provider to probe
     * @param agentId The agent context
     * @param actionId The action to probe
     * @param baseline The baseline capability status
     * @returns Refined capability status
     */
    probe(
        providerId: ProviderId,
        agentId: AgentId,
        actionId: ActionId,
        baseline: CapabilityStatus
    ): Promise<CapabilityStatus>;
}

/**
 * Cache for probe results to avoid redundant probing.
 * Key format: `${providerId}-${agentId}-${actionId}`
 */
const probeCache = new Map<string, CapabilityStatus>();

/**
 * Get cached probe result or run probe and cache it.
 */
export async function getCapabilityWithProbe(
    query: CapabilityQuery,
    prober?: ICapabilityProber
): Promise<CapabilityStatus> {
    const cacheKey = `${query.provider}-${query.agent}-${query.action}`;
    
    // Return cached result if available
    if (probeCache.has(cacheKey)) {
        return probeCache.get(cacheKey)!;
    }

    // Get baseline
    const baseline = getBaselineCapability(query);

    // If no prober or baseline is not supported, return baseline
    if (!prober || baseline.kind !== 'supported') {
        probeCache.set(cacheKey, baseline);
        return baseline;
    }

    // Run probe to refine
    const refined = await prober.probe(query.provider, query.agent, query.action, baseline);
    probeCache.set(cacheKey, refined);
    return refined;
}

/**
 * Clear probe cache (useful for testing or when provider configuration changes).
 */
export function clearProbeCache(): void {
    probeCache.clear();
}


