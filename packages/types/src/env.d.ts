// Purpose: Sprint 138 — Global type declarations for environment variables
// used across the monorepo. Updated to match actual env var naming conventions.

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            // Security & Encryption
            GHOST_CRYPTO_KEY: string;

            // Firebase Admin (JSON service account key)
            FIREBASE_SERVICE_ACCOUNT_KEY: string;

            // Next.js
            NEXT_PUBLIC_APP_URL: string;

            // External APIs
            GEMINI_API_KEY: string;

            // JWT Auth
            JWT_QR_SECRET: string;
        }
    }
}

export { };
