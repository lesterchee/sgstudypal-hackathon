export * from './handoff.js';

// ============================================================================
// Trigger.dev Workflow Types — Re-exported via @repo/legal-engine
//
// CANONICAL SOURCE: /packages/types/src/schemas/divorce-engine.ts (§8.1, §8.2)
// These are duplicated here to ensure correct resolution through the
// compiled `dist/` barrel. Keep in sync with the canonical source.
// ============================================================================

/** Payload dispatched to the Trigger.dev "eligibility-check" durable task. */
export interface EligibilityCheckPayload {
    readonly sessionId: string;
    readonly encryptedGrievance: string;
    readonly requestedAt: string;
    readonly domain: 'DIVORCE';
}

/** Sequential stages of the durable eligibility check workflow. */
export type PlaybookStage =
    | 'QUEUED'
    | 'DECRYPT'
    | 'RAG_QUERY'
    | 'ANALYZE'
    | 'PERSIST'
    | 'COMPLETE'
    | 'FAILED';

/** Firestore document schema for real-time playbook progress tracking. */
export interface PlaybookProgress {
    readonly runId: string;
    readonly stage: PlaybookStage;
    readonly updatedAt: string;
    readonly complexityRiskScore: number | null;
    readonly eligibilityProbability: number | null;
    readonly errorMessage: string | null;
}
