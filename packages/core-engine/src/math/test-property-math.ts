import { GhostCrypto } from '../crypto/ghost-data.js';
import { LegalHandoffPayload } from '../types/handoff.js';
import { calculateCPFAccruedInterest } from './property-calculator.js';

async function runTest() {
    const principal = '100000'; // $100,000

    console.log('--- Zero-Leak Protocol: Property Calculator Test ---');
    console.log(`Original Principal: $${principal}`);

    // Encrypt the payload before sending it to the engine (key from GHOST_CRYPTO_KEY env var)
    const encryptedPrincipal = GhostCrypto.encrypt(JSON.stringify({
        principal,
        years: 5,
        interestRate: 0.025
    }));

    const payload: LegalHandoffPayload = {
        domain: 'PROPERTY',
        metadata: {
            isHDB: true,
            hasPendingResaleLevy: true
        },
        encryptedPayload: encryptedPrincipal
    };

    console.log('\n--- Initial Handoff Payload ---');
    console.log({
        ...payload,
        encryptedPayload: '<ENCRYPTED>'
    });

    try {
        const result = calculateCPFAccruedInterest(payload);

        console.log('\n--- Computed Result Payload ---');
        console.log({
            ...result,
            encryptedPayload: '<ENCRYPTED>'
        });

        const decryptedAmount = GhostCrypto.decrypt(result.encryptedPayload);
        console.log(`\n--- Decrypted Final Amount ---`);
        console.log(`Accrued Amount: $${decryptedAmount}`);
        console.log(`Warnings:`, result.metadata.warnings);

        // Verification
        console.log('\n--- Verification ---');
        const expected = 100000 * Math.pow(1 + 0.025 / 12, 12 * 5);
        console.log(`Expected (Math): $${expected.toFixed(2)}`);
        console.log(`Actual (Decrypted): $${decryptedAmount}`);
        console.log(`Match: ${expected.toFixed(2) === decryptedAmount ? 'YES' : 'NO'}`);

    } catch (e) {
        console.error('Error during calculation:', e);
    }
}

runTest();
