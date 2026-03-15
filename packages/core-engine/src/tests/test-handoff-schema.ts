import { LegalHandoffPayloadSchema } from '../schemas/handoff.schema.js';

const invalidPayload = {
    domain: 'DIVORCE',
    metadata: {
        hasChildren: true,
        assetValue: 500000 // should be rejected
    },
    encryptedPayload: '...'
};

const validPayload = {
    domain: 'DIVORCE',
    metadata: {
        hasChildren: true,
        marriageDuration: 10
    },
    encryptedPayload: 'encrypted_bank_details'
};

const res1 = LegalHandoffPayloadSchema.safeParse(invalidPayload);
const res2 = LegalHandoffPayloadSchema.safeParse(validPayload);

console.log('\\nInvalid Payload Test:');
console.log('Expected: false');
console.log('Result:', res1.success);
if (!res1.success) {
    console.log('Error Message:', res1.error.issues[0].message);
}

console.log('\\nValid Payload Test:');
console.log('Expected: true');
console.log('Result:', res2.success);
if (!res2.success) {
    console.log(res2.error.issues);
}
