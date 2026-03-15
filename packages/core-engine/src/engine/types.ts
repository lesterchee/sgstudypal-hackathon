import { AssetInput } from '../schemas/asset-schema.js';

export type Role = 'breadwinner' | 'homemaker' | 'dual-income';

export interface UserSession {
    marriageDurationYears: number;
    partyARole: Role;
    partyBRole: Role;
    partyAMonthlyIncome: number;
    partyBMonthlyIncome: number;
    assets: AssetInput[];
    // If true, we assume one party has massive career sacrifices
    isSingleIncomeMarriage: boolean;
}

// Extends the standard session to imply it has passed the Zod + Ghost Crypto pipeline
export interface EncryptedUserSession extends UserSession {
    sessionId: string; // Ghost Data Encrypted UUID
    adverseParty?: 'partyA' | 'partyB'; // Specify who the guilty party is if an inference is drawn
}

export interface ResolverResult {
    logicPath: 'ANJ_V_ANK_DUAL_INCOME' | 'TNL_V_TNK_SINGLE_INCOME';
    division: {
        partyA: number; // Percentage (e.g., 60)
        partyB: number;
    };
    maintenanceProjection: {
        recommendedMonthlyRange: [number, number];
        reasoning: string;
    };

    // Adverse Inference Output
    hasAdverseInference?: boolean;
    inferenceUplift?: number;
    adverseInferenceReasoning?: string;
}
