import { GhostCrypto } from '../crypto/ghost-data.js';
import { LegalHandoffPayload } from '../types/handoff.js';

export interface PropertyCalculationResult extends LegalHandoffPayload {
    domain: 'PROPERTY';
    metadata: {
        hasWarning: boolean;
        warnings: string[];
        isHDB: boolean;
        hasPendingResaleLevy: boolean;
        [key: string]: boolean | string | string[] | undefined;
    };
    encryptedPayload: string; // The accrued amount P(1 + r/12)^(12t)
}

/**
 * Calculates CPF Accrued Interest using the Zero-Leak Protocol.
 * Formula used: P(1 + r/12)^(12t)
 */
export function calculateCPFAccruedInterest(
    payload: LegalHandoffPayload
): PropertyCalculationResult {
    // 1. Decrypt financial payload
    const decryptedStr = GhostCrypto.decrypt(payload.encryptedPayload);

    let principal = 0;
    let t = 0;
    let r = 0.025; // 2.5% default for OA

    try {
        // Try parsing as JSON first (new format with t and r)
        const parsed = JSON.parse(decryptedStr);
        principal = parseFloat(parsed.principal);
        if (parsed.years !== undefined) t = parseFloat(parsed.years);
        if (parsed.interestRate !== undefined) r = parseFloat(parsed.interestRate);
    } catch (e) {
        // Fallback to old format (just principal string)
        principal = parseFloat(decryptedStr);
    }

    if (isNaN(principal)) {
        throw new Error("Invalid encrypted financial payload: Not a valid number.");
    }

    // 3. Math: P(1 + r/12)^(12t)
    const amount = principal * Math.pow(1 + r / 12, 12 * t);

    // 4. HDB Resale Levy Warning Flag
    const isHDB = (payload.metadata.isHDB as boolean) || false;
    const hasPendingResaleLevy = (payload.metadata.hasPendingResaleLevy as boolean) || false;

    const warnings: string[] = [];
    if (isHDB && hasPendingResaleLevy) {
        warnings.push("WARNING: Property is an HDB with a pending Resale Levy. This affects the net matrimonial asset pool.");
    }

    // 5. Re-encrypt result (Zero-Leak Protocol)
    const encryptedAmount = GhostCrypto.encrypt(amount.toFixed(2));

    return {
        domain: 'PROPERTY',
        metadata: {
            ...payload.metadata,
            hasWarning: warnings.length > 0,
            warnings,
            isHDB,
            hasPendingResaleLevy
        },
        encryptedPayload: encryptedAmount
    };
}
