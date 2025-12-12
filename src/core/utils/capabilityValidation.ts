import type { CapabilityStatus } from '../../ai-providers/providerCapabilities';

/**
 * Acceptance checks for capability status ADT.
 * These ensure that capability statuses are well-formed and exhaustively handled.
 */

/**
 * Assert that a capability status has a reason if it's unsupported or unknown.
 * Throws if the status is malformed.
 */
export function assertCapabilityStatusWellFormed(status: CapabilityStatus): void {
    if (status.kind === 'unsupported' || status.kind === 'unknown') {
        if (!status.reason || status.reason.trim().length === 0) {
            throw new Error(
                `Capability status ${status.kind} must include a non-empty reason.`
            );
        }
    }
}

/**
 * Type guard to ensure exhaustive handling of capability status kinds.
 * This function will cause a TypeScript error if a case is missing.
 */
export function assertExhaustiveCapabilityStatus(status: CapabilityStatus): status is CapabilityStatus {
    switch (status.kind) {
        case 'supported':
        case 'unsupported':
        case 'unknown':
            return true;
        default:
            // This will cause a TypeScript error if a new kind is added but not handled
            const _exhaustive: never = status;
            throw new Error(`Unhandled capability status kind: ${(_exhaustive as any).kind}`);
    }
}

/**
 * Validate that a capability status is well-formed and all variants are handled.
 * This is a convenience function that combines the above checks.
 */
export function validateCapabilityStatus(status: CapabilityStatus): void {
    assertCapabilityStatusWellFormed(status);
    assertExhaustiveCapabilityStatus(status);
}

