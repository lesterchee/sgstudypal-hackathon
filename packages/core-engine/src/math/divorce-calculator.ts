import { AssetInput } from '../schemas/asset-schema.js';

// Purpose: Implements the "ANJ v ANK" 3-step structured approach for Just and Equitable division of matrimonial assets, incorporating adverse inference heuristics for brazen concealment.
export class AssetCalculator {
    /**
     * Calculates the division of assets based on the ANJ v ANK framework.
     * Step 1: Average ratio of Direct Financial Contributions
     * Step 2: Average ratio of Indirect Contributions (homemaking, caregiving)
     * Step 3: Just and Equitable weighted average
     * 
     * Strict adherence to "Ghost Data" compliance: No PII is used. Data must only contain pure numbers.
     */
    public static calculateDivision(assets: AssetInput[], directWeight = 0.5, indirectWeight = 0.5, adverseParty?: 'partyA' | 'partyB') {
        if (assets.length === 0) return { partyA: 50, partyB: 50, hasAdverseInference: false, inferenceUplift: 0 }; // Default

        let totalDirectA = 0;
        let totalDirectB = 0;
        let totalIndirectA = 0;
        let totalIndirectB = 0;

        let hasBrazenConcealment = false;
        let brazenAssetValue = 0;
        let notionalAddBackToA = 0;
        let notionalAddBackToB = 0;

        assets.forEach((asset) => {
            // Check for Notional Constraints (WRX v WRY) - Dissipated assets
            if (asset.isDissipated) {
                // If it was dissipated, we notionally restore the value.
                // However, we DO NOT credit the direct contribution to the party who dissipated it.
                // Assuming `adverseParty` tells us who the guilty party is for dissipation.
                if (adverseParty === 'partyA') {
                    // Party A dissipated it. We add to total pool for percentage math later, 
                    // but we ensure Party A gets NO direct weight for this notionally restored amount.
                    // Instead of adjusting direct/indirect here, we just know it's in the pool.
                    // For the sake of standard ANJ v ANK, the asset's directContribution is used.
                    // The WRX v WRY rule says: if you dissipated it, you can't claim direct contribution for it.
                    // So we force Party A's direct contribution for this asset to 0.
                    totalDirectB += asset.directContribution.partyB;
                    // Party A gets 0 direct for this.
                } else if (adverseParty === 'partyB') {
                    totalDirectA += asset.directContribution.partyA;
                    // Party B gets 0 direct for this.
                } else {
                    // Fallback
                    totalDirectA += asset.directContribution.partyA;
                    totalDirectB += asset.directContribution.partyB;
                }
            } else {
                totalDirectA += asset.directContribution.partyA;
                totalDirectB += asset.directContribution.partyB;
            }

            totalIndirectA += asset.indirectContribution.partyA;
            totalIndirectB += asset.indirectContribution.partyB;

            // Check for Brazenness Test (WZF v WZG)
            if ((asset.isDisputed || asset.isUnknownValue) && asset.hasRedFlags) {
                hasBrazenConcealment = true;
                brazenAssetValue += asset.value;
            }
        });

        const totalDirect = totalDirectA + totalDirectB;
        const directRatioA = totalDirect > 0 ? (totalDirectA / totalDirect) * 100 : 50;
        const directRatioB = totalDirect > 0 ? (totalDirectB / totalDirect) * 100 : 50;

        const totalIndirect = totalIndirectA + totalIndirectB;
        const indirectRatioA = totalIndirect > 0 ? (totalIndirectA / totalIndirect) * 100 : 50;
        const indirectRatioB = totalIndirect > 0 ? (totalIndirectB / totalIndirect) * 100 : 50;

        // Step 3: Just and Equitable weighted average
        let finalRatioA = (directRatioA * directWeight) + (indirectRatioA * indirectWeight);
        let finalRatioB = (directRatioB * directWeight) + (indirectRatioB * indirectWeight);

        // Adverse Inference Uplift (WZF v WZG)
        let inferenceUplift = 0;
        let hasAdverseInference = false;
        let adverseInferenceReasoning = "";

        if (hasBrazenConcealment && adverseParty) {
            hasAdverseInference = true;
            inferenceUplift = 5; // Default Baseline 5%

            // If it's an egregious concealment (e.g., arbitrarily > $5m)
            if (brazenAssetValue > 5000000) {
                inferenceUplift = 10;
            }

            if (adverseParty === 'partyA') {
                finalRatioB += inferenceUplift;
                finalRatioA -= inferenceUplift;
                adverseInferenceReasoning = `Adverse Inference against Party A. Disputed assets with red flags found. Applied ${inferenceUplift}% uplift to Party B. Notional constraints applied for dissipated assets.`;
            } else {
                finalRatioA += inferenceUplift;
                finalRatioB -= inferenceUplift;
                adverseInferenceReasoning = `Adverse Inference against Party B. Disputed assets with red flags found. Applied ${inferenceUplift}% uplift to Party A. Notional constraints applied for dissipated assets.`;
            }

            // Cap at 100 / 0
            finalRatioA = Math.max(0, Math.min(100, finalRatioA));
            finalRatioB = Math.max(0, Math.min(100, finalRatioB));
        }

        return {
            partyA: Number(finalRatioA.toFixed(2)),
            partyB: Number(finalRatioB.toFixed(2)),
            hasAdverseInference,
            inferenceUplift,
            adverseInferenceReasoning
        };
    }
}
