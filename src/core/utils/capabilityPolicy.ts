import type { AgentId, ActionId } from '../../ai-providers/providerCapabilities';
import { getBaselineCapability, getSelectedProviderId } from '../../ai-providers/providerCapabilities';

/**
 * Policy for capability-aware UX.
 * Centralizes decisions about feature visibility and informational affordances.
 */

export interface FeatureVisibilityResult {
    /** Whether the feature should be shown */
    visible: boolean;
    /** If not visible, the reason why (for informational affordance) */
    reason?: string;
}

/**
 * Determine if a feature should be visible for the current provider.
 * Policy: hide unsupported features by default.
 */
export async function isFeatureVisible(
    agent: AgentId,
    action: ActionId
): Promise<FeatureVisibilityResult> {
    const providerId = getSelectedProviderId();
    const baseline = getBaselineCapability({
        provider: providerId,
        agent,
        action,
    });

    if (baseline.kind === 'supported') {
        return { visible: true };
    }

    // Unsupported or unknown - hide by default
    return {
        visible: false,
        reason: baseline.reason || `Feature not available for current provider.`,
    };
}

/**
 * Get informational affordance content for unsupported features.
 * Returns a single message explaining what's unavailable and why.
 */
export async function getInfoAffordance(
    agent: AgentId,
    action: ActionId
): Promise<string | null> {
    const visibility = await isFeatureVisible(agent, action);
    if (visibility.visible) {
        return null; // No info needed if feature is visible
    }

    const featureName = getFeatureDisplayName(agent, action);
    
    return `${featureName} is not supported by the current provider. ${visibility.reason || 'This feature is not available for the current provider.'}`;
}

/**
 * Get human-readable feature name for display.
 */
function getFeatureDisplayName(agent: AgentId, action: ActionId): string {
    // Map agent+action to user-friendly names
    const featureMap: Record<string, string> = {
        'mcp.list_mcp_servers': 'MCP Servers',
        'mcp.get_mcp_server_details': 'MCP Server Details',
        'hooks.list_hooks': 'Hooks',
        'agents.list_agents': 'Agents',
        'agents.initialize_built_in_agents': 'Built-in Agents',
        'skills.list_skills': 'Skills',
        'skills.initialize_built_in_skills': 'Built-in Skills',
        'steering.create_steering_doc': 'Steering Documents',
        'steering.list_steering_docs': 'Steering Documents',
    };

    const key = `${agent}.${action}`;
    return featureMap[key] || `${agent} ${action}`;
}

/**
 * Check if a feature should be shown and get the reason if not.
 * This is a convenience function that combines visibility check and affordance.
 */
export async function shouldShowFeature(
    agent: AgentId,
    action: ActionId
): Promise<{ show: boolean; whyNot?: string }> {
    const visibility = await isFeatureVisible(agent, action);
    if (visibility.visible) {
        return { show: true };
    }

    const affordance = await getInfoAffordance(agent, action);
    return {
        show: false,
        whyNot: affordance || undefined,
    };
}

