import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Purpose: Firebase Admin SDK — lazy singleton initialised from individual
// env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).
// Fails loudly at runtime if any var is missing so deployment issues
// surface immediately in Vercel Function Logs.

function getAdminApp() {
    if (getApps().length > 0) {
        return getApps()[0]!;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId) {
        throw new Error("[Firebase Admin] FIREBASE_PROJECT_ID is missing.");
    }
    if (!clientEmail) {
        throw new Error("[Firebase Admin] FIREBASE_CLIENT_EMAIL is missing.");
    }
    if (!rawPrivateKey) {
        throw new Error("[Firebase Admin] FIREBASE_PRIVATE_KEY is missing.");
    }

    // Vercel stores multi-line strings with literal \n — restore real newlines.
    const privateKey = rawPrivateKey.replace(/\\n/g, "\n");

    console.log("🔥 Firebase Admin Init. Target Project:", projectId);

    return initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
    });
}

let _adminDb: Firestore | null = null;

/** Lazily initialised Admin Firestore instance. */
function getAdminDb(): Firestore {
    if (!_adminDb) {
        _adminDb = getFirestore(getAdminApp());
    }
    return _adminDb;
}

let _adminAuth: Auth | null = null;

/** Lazily initialised Admin Auth instance. */
function getAdminAuth(): Auth {
    if (!_adminAuth) {
        _adminAuth = getAuth(getAdminApp());
    }
    return _adminAuth;
}

export { getAdminApp, getAdminDb, getAdminAuth };
