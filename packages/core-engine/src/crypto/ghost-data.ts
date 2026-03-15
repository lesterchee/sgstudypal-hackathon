import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // NIST SP 800-38D recommended for AES-GCM

export class GhostDataError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'GhostDataError';
        Object.setPrototypeOf(this, GhostDataError.prototype);
    }
}

/**
 * Retrieves the GHOST_CRYPTO_KEY from the environment.
 * The key must be a base64 encoded string of exactly 32 bytes to ensure AES-256 compatibility.
 */
function getCryptoKey(): Buffer {
    const base64Key = process.env.GHOST_CRYPTO_KEY as string | undefined;

    if (!base64Key || base64Key.trim() === '' || base64Key === '<insert-32-byte-base64-string>') {
        throw new GhostDataError(
            'CRITICAL: GHOST_CRYPTO_KEY is missing or invalid in environment variables.'
        );
    }

    let keyBuffer: Buffer;
    try {
        keyBuffer = Buffer.from(base64Key, 'base64');
    } catch (err) {
        throw new GhostDataError(
            `CRITICAL: GHOST_CRYPTO_KEY is not valid base64: ${err instanceof Error ? err.message : String(err)}`
        );
    }

    if (keyBuffer.length !== 32) {
        throw new GhostDataError(
            `CRITICAL: GHOST_CRYPTO_KEY must decode to exactly 32 bytes for AES-256. Got ${keyBuffer.length} bytes.`
        );
    }

    return keyBuffer;
}

/**
 * Canonical AES-256-GCM encryption utility for the Ghost Data Protocol.
 * All PII must pass through this function before being written to Firestore.
 *
 * SINGLE SOURCE OF TRUTH: This is the only encryption implementation in the monorepo.
 * Key is derived strictly from process.env.GHOST_CRYPTO_KEY.
 */
export class GhostCrypto {
    /**
     * Encrypts a plaintext string using AES-256-GCM.
     * Returns a base64 encoded string representing the combination of IV, Auth Tag, and Ciphertext.
     */
    public static encrypt(text: string): string {
        try {
            const key = getCryptoKey();
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag().toString('hex');
            const ivHex = iv.toString('hex');

            // Output format: iv:authTag:ciphertext → Base64
            const combined = `${ivHex}:${authTag}:${encrypted}`;
            return Buffer.from(combined, 'utf8').toString('base64');
        } catch (error) {
            if (error instanceof GhostDataError) {
                throw error;
            }
            throw new GhostDataError(
                `Encryption failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Decrypts a base64 payload previously encrypted by the encrypt function.
     * Returns the decrypted UTF-8 plaintext.
     */
    public static decrypt(hash: string): string {
        try {
            const key = getCryptoKey();
            const combined = Buffer.from(hash, 'base64').toString('utf8');
            const parts = combined.split(':');

            if (parts.length !== 3) {
                throw new GhostDataError(
                    'Decryption failed: Invalid encrypted payload format. Expected base64 combination of iv:authTag:ciphertext'
                );
            }

            const [ivHex, authTagHex, encryptedHex] = parts;
            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');

            if (iv.length !== IV_LENGTH) {
                throw new GhostDataError(`Decryption failed: Invalid IV length. Expected ${IV_LENGTH} bytes.`);
            }

            const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            if (error instanceof GhostDataError) {
                throw error;
            }
            throw new GhostDataError(
                `Decryption failed due to tampered Auth Tag, missing key, or structural error: ${error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }
}
