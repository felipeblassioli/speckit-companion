import type { IAIProvider } from '../../ai-providers/aiProvider';
import type { CapabilityStatus } from '../../ai-providers/providerCapabilities';

/**
 * Provider-agnostic capability message formatting.
 * Messages avoid hardcoded provider names and use dynamic provider display names.
 */
export interface CapabilityMessageContext {
    provider: IAIProvider;
    actionDescription?: string; // Optional human-readable action description
}

/**
 * Format a message for "not installed" capability status.
 */
export function formatNotInstalledMessage(context: CapabilityMessageContext): string {
    return `${context.provider.name} is not installed or not available. Install/configure it, or switch AI provider in settings (speckit.aiProvider).`;
}

/**
 * Format a message for "unsupported" capability status.
 */
export function formatUnsupportedMessage(
    context: CapabilityMessageContext,
    reason: string
): string {
    const actionDesc = context.actionDescription
        ? ` "${context.actionDescription}"`
        : '';
    return `This action${actionDesc} is not supported by the current provider (${context.provider.name}). ${reason}`;
}

/**
 * Format a message for "unknown" capability status.
 */
export function formatUnknownMessage(
    context: CapabilityMessageContext,
    reason: string
): string {
    const actionDesc = context.actionDescription
        ? ` "${context.actionDescription}"`
        : '';
    return `This action${actionDesc} is not available for the current provider (${context.provider.name}). ${reason}`;
}

/**
 * Format a capability status into a user-facing message.
 * This is the main entry point for capability messaging.
 */
export function formatCapabilityMessage(
    status: CapabilityStatus,
    context: CapabilityMessageContext
): string {
    switch (status.kind) {
        case 'supported':
            // Should not be called for supported status, but return a safe message if it is
            return `Action is supported by ${context.provider.name}.`;
        case 'unsupported':
            return formatUnsupportedMessage(context, status.reason);
        case 'unknown':
            return formatUnknownMessage(context, status.reason);
        default:
            // Exhaustiveness check - TypeScript will error if we miss a case
            const _exhaustive: never = status;
            return `Unknown capability status for ${context.provider.name}.`;
    }
}

