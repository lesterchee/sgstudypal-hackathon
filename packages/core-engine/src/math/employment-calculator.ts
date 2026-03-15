import { LegalHandoffPayload } from '../types/handoff.js';
import { GhostCrypto } from '../crypto/ghost-data.js';

export interface DecryptedEmploymentData {
    grossMonthlySalary: number;
    unconsumedLeaveDays: number;
    noticeDays: number;
}

export class EmploymentCalculator {
    /**
     * Calculates the notice-in-lieu and annual leave encashment amounts.
     * 
     * @param payload The Zero-Leak handoff payload containing metadata and encrypted financial data
     * @param userSecret The secret key to decrypt the payload (provided client-side or securely)
     * @returns The calculated owed amounts safely, dropping the raw PII from memory
     */
    static calculateTerminationDues(payload: LegalHandoffPayload) {
        if (payload.domain !== 'FAIRWORK') {
            throw new Error(`EmploymentCalculator strictly expects FAIRWORK domain payload. Received: ${payload.domain}`);
        }

        // 1. Ghost Data Protocol: Decrypt in-memory, process, and discard
        const decryptedString = GhostCrypto.decrypt(payload.encryptedPayload);
        let secureData: DecryptedEmploymentData;

        try {
            secureData = JSON.parse(decryptedString);
        } catch (e) {
            throw new Error('Failed to parse decrypted employment data');
        }

        // 2. MOM Standard Calculation Logic
        // Daily rate based on average 26-day working month
        const dailyRate = secureData.grossMonthlySalary / 26;

        const noticeInLieuAmount = dailyRate * secureData.noticeDays;
        const leaveEncashmentAmount = dailyRate * secureData.unconsumedLeaveDays;

        const totalOwed = noticeInLieuAmount + leaveEncashmentAmount;

        // 3. Return only the non-PII computed results. At the end of block, `secureData` evaporates.
        return {
            noticeInLieuAmount: Number(noticeInLieuAmount.toFixed(2)),
            leaveEncashmentAmount: Number(leaveEncashmentAmount.toFixed(2)),
            totalOwed: Number(totalOwed.toFixed(2))
        };
    }
}
