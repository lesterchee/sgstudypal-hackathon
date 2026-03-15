import { EncryptedUserSession, ResolverResult } from './types.js';
import { AssetCalculator } from '../math/divorce-calculator.js';

// Purpose: Core business logic entry point for interpreting user sessions and generating deterministic matrimonial asset division outcomes based on legal precedents.
export class DivorceResolver {

    /**
     * The primary entry point. 
     * Takes an encrypted session, classifies it (WXW v WXX), and routes to the correct math.
     * GHOST DATA RULE: Never log `session.assets` details.
     */
    public static resolve(session: EncryptedUserSession): ResolverResult {
        // 1. Classification Step (WXW v WXX [2025])
        const isSingleIncome = this.classifyMarriage(session);

        let divisionResult;
        let logicPath: ResolverResult['logicPath'];

        // 2. Calculation Step
        if (isSingleIncome) {
            logicPath = 'TNL_V_TNK_SINGLE_INCOME';
            divisionResult = this.applySingleIncomeTrendLine(session);
        } else {
            logicPath = 'ANJ_V_ANK_DUAL_INCOME';
            // ANJ v ANK strictly relies on the 50/50 dual weight average
            divisionResult = AssetCalculator.calculateDivision(session.assets, 0.5, 0.5, session.adverseParty);
        }

        // 3. Maintenance Assessment
        const maintenanceProjection = this.projectMaintenance(session);

        const result: ResolverResult = {
            logicPath,
            division: {
                partyA: divisionResult.partyA,
                partyB: divisionResult.partyB
            },
            maintenanceProjection,
            hasAdverseInference: divisionResult.hasAdverseInference,
            inferenceUplift: divisionResult.inferenceUplift,
            adverseInferenceReasoning: divisionResult.adverseInferenceReasoning
        };

        // Strict Logging Rule constraint: Only output percentages and paths.
        console.log(`[Ghost Data Engine] Resolved Session. Path: ${result.logicPath} | Final Split: ${result.division.partyA}% / ${result.division.partyB}%`);

        return result;
    }

    /**
     * Evaluates role descriptions to decide if the marriage was single or dual income.
     * Uses WXW v WXX precedent logic.
     */
    private static classifyMarriage(session: EncryptedUserSession): boolean {
        if (session.isSingleIncomeMarriage) return true;

        // Fallback logic: If one party earns significantly less and is designated homemaker
        const totalIncome = session.partyAMonthlyIncome + session.partyBMonthlyIncome;
        if (totalIncome === 0) return false;

        const partyAShare = session.partyAMonthlyIncome / totalIncome;
        const partyBShare = session.partyBMonthlyIncome / totalIncome;

        // If one party contributes < 10% cash and is listed as a homemaker
        if (partyAShare < 0.1 && session.partyARole === 'homemaker') return true;
        if (partyBShare < 0.1 && session.partyBRole === 'homemaker') return true;

        return false; // Default to Dual-Income
    }

    /**
     * Applies TNL v TNK Trend-line.
     * In long single-income marriages, precedents lean towards an equal partnership model (e.g. 50/50 or 60/40),
     * disregarding strict direct financial tracing which prejudices the homemaker.
     */
    private static applySingleIncomeTrendLine(session: EncryptedUserSession) {
        // Simplified trend-line heuristic
        let breadwinnerShare = 100;

        if (session.marriageDurationYears > 15) {
            // Long marriage: Equal partnership presumption strengthens
            breadwinnerShare = 50;
        } else if (session.marriageDurationYears > 10) {
            breadwinnerShare = 60;
        } else if (session.marriageDurationYears > 5) {
            breadwinnerShare = 70;
        } else {
            // Short marriage: Lean heavily on direct contributions (e.g., 85/15)
            breadwinnerShare = 85;
        }

        const homemakerShare = 100 - breadwinnerShare;

        // Assign based on who is the breadwinner
        if (session.partyARole === 'breadwinner') {
            return { partyA: breadwinnerShare, partyB: homemakerShare, hasAdverseInference: false, inferenceUplift: 0, adverseInferenceReasoning: "" };
        } else {
            return { partyA: homemakerShare, partyB: breadwinnerShare, hasAdverseInference: false, inferenceUplift: 0, adverseInferenceReasoning: "" };
        }
    }

    /**
     * Section 114 projection.
     * Compares earning capacities to calculate a reasonable multi-year payout or monthly allowance.
     */
    private static projectMaintenance(session: EncryptedUserSession) {
        const incomeDiff = Math.abs(session.partyAMonthlyIncome - session.partyBMonthlyIncome);

        if (incomeDiff < 1000) {
            return {
                recommendedMonthlyRange: [0, 0] as [number, number],
                reasoning: "Section 114: Minimal earning capacity difference. Usually Nominal or No Maintenance ordered."
            };
        }

        // A rough heuristic: 20-30% of the income difference
        const lowerEnd = Math.floor(incomeDiff * 0.2);
        const higherEnd = Math.floor(incomeDiff * 0.3);

        return {
            recommendedMonthlyRange: [lowerEnd, higherEnd] as [number, number],
            reasoning: "Section 114: Moderate to High income disparity. Projection based on standard of living adjustments."
        };
    }
}
