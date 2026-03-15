import { z } from 'zod';
import { GhostCrypto } from '../crypto/ghost-data.js';

export const ContributionSchema = z.object({
    partyA: z.number().min(0, "Contribution must be at least 0"),
    partyB: z.number().min(0, "Contribution must be at least 0"),
});

export const AssetSchema = z.object({
    // Ghost Data compliant - no names, no NRIC, just an abstract UUID or type
    assetId: z.string().uuid(),
    assetType: z.enum(['property', 'cash', 'investments', 'others']),
    value: z.number().min(0),
    directContribution: ContributionSchema,
    indirectContribution: ContributionSchema,

    // Adverse Inference Triggers (WZF v WZG / WRX v WRY)
    isDisputed: z.boolean().optional().default(false),
    isUnknownValue: z.boolean().optional().default(false),
    hasRedFlags: z.boolean().optional().default(false), // e.g., missing bank statements > 6mo
    isDissipated: z.boolean().optional().default(false), // e.g., loan/gift to relative before writ
});

export type AssetInput = z.infer<typeof AssetSchema>;

/**
 * Creates a schema that automatically encrypts specific fields.
 * Key source: process.env.GHOST_CRYPTO_KEY (via GhostCrypto singleton).
 */
export const createEncryptedAssetSchema = () =>
    AssetSchema.transform((val) => ({
        ...val,
        // Ghost Data: Obfuscate the assetId so the DB owner can't easily correlate it
        assetId: GhostCrypto.encrypt(val.assetId),
    }));
