import { z } from 'zod';

export const LegalHandoffPayloadSchema = z.object({
    domain: z.enum(['DIVORCE', 'WILLS', 'FAIRWORK', 'PROPERTY']),
    metadata: z.record(z.union([z.boolean(), z.string()]).optional()),
    encryptedPayload: z.string().min(1, 'Encrypted payload is required and must be a string')
});
