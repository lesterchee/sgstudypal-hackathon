// Purpose: Server-side Firebase Admin SDK initialization for Firestore writes
// from API routes. Uses the root-level firebase-admin package.
// This must ONLY be imported in server-side code (API routes, server components).

import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Purpose: Initialize Firebase Admin lazily. Uses GOOGLE_APPLICATION_CREDENTIALS
// env var for service account in production, or falls back to projectId-only init
// for local development with the emulator.
if (getApps().length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountJson) {
        // Purpose: Production path — parse the JSON service account key from env.
        const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;
        initializeApp({ credential: cert(serviceAccount) });
    } else {
        // Purpose: Fallback for local dev — connects to emulator or uses default creds.
        initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project-id",
        });
    }
}

// Purpose: Export the Firestore instance for use in API routes.
export const adminDb = getFirestore();
