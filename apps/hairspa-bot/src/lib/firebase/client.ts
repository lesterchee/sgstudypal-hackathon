import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

// Purpose: Firebase Client SDK — lazily initialised from NEXT_PUBLIC_ env vars
// for frontend Firestore reads (e.g., lead status, org config)
// and Firebase Authentication (Email/Password login).
// Lazy initialization prevents crashing at Next.js build time when
// env vars are not set during static page generation.

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;

function getClientApp(): FirebaseApp {
    if (!_app) {
        if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
            throw new Error("[Firebase Client] NEXT_PUBLIC_FIREBASE_API_KEY is missing.");
        }
        if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
            throw new Error("[Firebase Client] NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing.");
        }

        console.log(
            "🔥 Firebase Client Init. Target Project:",
            process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        );

        _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    }
    return _app;
}

function getClientDb(): Firestore {
    if (!_db) {
        _db = getFirestore(getClientApp());
    }
    return _db;
}

function getClientAuth(): Auth {
    if (!_auth) {
        _auth = getAuth(getClientApp());
    }
    return _auth;
}

export { getClientApp, getClientDb, getClientAuth };
