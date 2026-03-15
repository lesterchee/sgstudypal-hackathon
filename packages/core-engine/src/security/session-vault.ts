import { randomBytes } from 'crypto';
import { LegalHandoffPayload } from '../types/handoff';
import { GhostCrypto, GhostDataError } from '../crypto/ghost-data.js';

/**
 * Interface for the encrypted envelope that will be stored in Firestore.
 */
// Purpose: Defines the encrypted envelope schema expected by Firebase for secure session storage.
export interface EncryptedSessionData {
    iv: string;
    authTag: string;
    ciphertext: string;
    expiresAt?: Date;
    version: number;
}

/**
 * Generates a 12-character cryptographic Case ID.
 * This ID acts as the lookup key for retrieving sessions from Firestore.
 * NOTE: The caseId is NOT used as a cryptographic key — all encryption
 * is handled by GhostCrypto via GHOST_CRYPTO_KEY env var.
 */
// Purpose: Generates a cryptographically secure 12-character Case ID to index Ghost Data payloads without exposing PII.
export function generateCaseId(): string {
    return randomBytes(9).toString('base64url');
}

/**
 * Encrypts a LegalHandoffPayload using AES-256-GCM via the Ghost Data Protocol.
 * Key is derived strictly from process.env.GHOST_CRYPTO_KEY (Single Source of Truth).
 * It strictly forbids the inclusion of explicitly identifying properties like emails or NRICs.
 *
 * @param payload The raw LegalHandoffPayload.
 */
// Purpose: Uses the Ghost Data Protocol (AES-256-GCM) to encrypt the LegalHandoffPayload before it hits Firestore, aggressively failing if PII leaks are detected.
export function encryptPayload(payload: LegalHandoffPayload): EncryptedSessionData {

    // Guard clause to forbid collection of emails or NRICs
    const payloadStr = JSON.stringify(payload);
    if (payloadStr.toLowerCase().includes('email') || payloadStr.toLowerCase().includes('nric')) {
        throw new Error('SECURITY VIOLATION: Handoff payloads cannot contain email addresses or NRICs for session resumption.');
    }

    // Delegate to GhostCrypto — Single Source of Truth for AES-256-GCM
    const encrypted = GhostCrypto.encrypt(payloadStr);

    // Parse the GhostCrypto output (base64 → iv:authTag:ciphertext) for Firestore schema compliance
    const combined = Buffer.from(encrypted, 'base64').toString('utf8');
    const [ivHex, authTagHex, ciphertextHex] = combined.split(':');

    return {
        iv: ivHex,
        authTag: authTagHex,
        ciphertext: ciphertextHex,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        version: 1 // Default initialization, to be overridden by the caller during updates
    };
}

/**
 * Decrypts an EncryptedSessionData object via the Ghost Data Protocol.
 * Key is derived strictly from process.env.GHOST_CRYPTO_KEY (Single Source of Truth).
 *
 * @param encrypted The object retrieved from Firestore.
 */
// Purpose: Restores and decrypts a Ghost Data payload from Firestore format back into a LegalHandoffPayload.
export function decryptPayload(encrypted: EncryptedSessionData): LegalHandoffPayload {
    // Reconstruct the GhostCrypto base64 format from the Firestore fields
    const combined = `${encrypted.iv}:${encrypted.authTag}:${encrypted.ciphertext}`;
    const base64Payload = Buffer.from(combined, 'utf8').toString('base64');

    const decrypted = GhostCrypto.decrypt(base64Payload);

    // Verify it doesn't contain forbidden properties during decryption as well just in case.
    if (decrypted.toLowerCase().includes('email') || decrypted.toLowerCase().includes('nric')) {
        throw new Error('SECURITY VIOLATION: Decrypted payload contains forbidden email or NRIC parameters.');
    }

    return JSON.parse(decrypted) as LegalHandoffPayload;
}

/**
 * Attempts to save an encrypted session payload to Firestore or a given persistence layer.
 * If a version collision (HTTP 409) occurs, it retries by fetching the latest server state,
 * merging the changes (or applying a conflict resolution strategy), and saving again.
 *
 * @param saveFn The function to execute the save to the database (must throw 409 on version mismatch).
 * @param fetchLatestFn The function to fetch the latest EncryptedSessionData from the database.
 * @param mergeFn The business logic function to merge the remote and local payloads.
 * @param payload The original local payload.
 * @param currentVersion The version number expected for the update.
 * @param maxRetries Maximum number of retries before failing.
 */
// Purpose: Concurrency wrapper for session saving that handles multi-device or tab updates via intelligent retry-and-merge functionality (HTTP 409 collisions).
export async function saveSessionWithRetry(
    saveFn: (encrypted: EncryptedSessionData) => Promise<void>,
    fetchLatestFn: () => Promise<EncryptedSessionData | null>,
    mergeFn: (remote: LegalHandoffPayload, local: LegalHandoffPayload) => LegalHandoffPayload,
    payload: LegalHandoffPayload,
    currentVersion: number,
    maxRetries: number = 3
): Promise<void> {
    let attempts = 0;
    let currentPayload = payload;
    let attemptingVersion = currentVersion;

    while (attempts < maxRetries) {
        try {
            const encrypted = encryptPayload(currentPayload);
            encrypted.version = attemptingVersion; // Ensure proper version is set

            await saveFn(encrypted);
            return; // Success
        } catch (error: any) {
            // Check if error is a version conflict (e.g. Firebase status code or string)
            if (error?.code !== 'failed-precondition' && error?.status !== 409 && !error?.message?.includes('409') && !error?.message?.includes('version')) {
                throw error; // Throw if it wasn't a version collision
            }

            attempts++;
            if (attempts >= maxRetries) {
                throw new Error(`Failed to save session after ${maxRetries} version collisions.`);
            }

            // Version mismatch - fetch latest, merge, and retry
            const latestRemoteEncrypted = await fetchLatestFn();
            if (!latestRemoteEncrypted) {
                throw new Error('Remote session deleted during update conflict.');
            }

            const latestRemotePayload = decryptPayload(latestRemoteEncrypted);
            currentPayload = mergeFn(latestRemotePayload, currentPayload);
            attemptingVersion = latestRemoteEncrypted.version + 1; // Increment from the latest known remote version
        }
    }
}

