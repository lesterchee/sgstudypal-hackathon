import { GhostCrypto } from '../crypto/ghost-data.js';
import { EmploymentCalculator, DecryptedEmploymentData } from '../math/employment-calculator.js';
import { LegalHandoffPayload } from '../types/handoff.js';

// Mock Sensitive Payload (Salaries, Entitlements)
const rawData: DecryptedEmploymentData = {
    grossMonthlySalary: 5200, // $5200 / 26 = $200 per day
    noticeDays: 14,             // 14 * 200 = $2800
    unconsumedLeaveDays: 5,     // 5 * 200 = $1000
};

// 1. Encrypt the data before creating the payload (key from GHOST_CRYPTO_KEY env var)
const encryptedData = GhostCrypto.encrypt(JSON.stringify(rawData));

// 2. Wrap it all in the Legal Handoff Protocol
const safePayload: LegalHandoffPayload = {
    domain: 'FAIRWORK',
    metadata: {
        isResignation: true,
        reason: 'Constructive Dismissal'
    },
    encryptedPayload: encryptedData
};

console.log('\\n--- Fairwork Quant Simulation ---');
console.log('Sending Ghost Payload to Engine...');

try {
    // 3. Engine uses payload to calculate
    const finalCalculations = EmploymentCalculator.calculateTerminationDues(safePayload);

    console.log('\\nCalculation Successful (Raw PII Discarded).');
    console.log('Results:', finalCalculations);

    // Check against expected
    const isCorrect = finalCalculations.noticeInLieuAmount === 2800 &&
        finalCalculations.leaveEncashmentAmount === 1000 &&
        finalCalculations.totalOwed === 3800;

    console.log('\\nMath Validation:', isCorrect ? 'PASS ✅' : 'FAIL ❌');

} catch (e: any) {
    console.error('Error in calculation:', e.message);
}
