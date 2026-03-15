// Purpose: Firebase Auth Linking — upgrades an anonymous user to a verified
// Google account using `linkWithPopup`. This preserves the original anonymous
// uid and all associated Firestore subcollection data (questionQueue, sessions,
// gamification metrics). The user's Firestore profile is updated with the
// linked email and display name after successful upgrade.

import {
    getAuth,
    GoogleAuthProvider,
    linkWithPopup,
    type User,
} from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';

// Purpose: Result type for the auth upgrade operation.
export interface AuthUpgradeResult {
    success: boolean;
    /** Purpose: The linked email address if successful. */
    email: string | null;
    /** Purpose: Error message if the upgrade failed. */
    error: string | null;
    /** Purpose: Specific error code for downstream handling. */
    errorCode: string | null;
}

// Purpose: Lazy-initialize Firebase Auth and Firestore.
const auth = getAuth(app);
const db = getFirestore(app);

// Purpose: Google Auth Provider instance — reused across upgrade attempts.
const googleProvider = new GoogleAuthProvider();

// Purpose: Main entry point — attempts to link the current anonymous user
// with a Google account via popup. If successful, updates the Firestore
// user profile with the linked email and display name.
//
// Edge cases handled:
// - User is not anonymous (already linked) — returns early with success.
// - Popup blocked by browser — returns specific error code.
// - Google account already linked to another Firebase user — returns specific error.
// - Network failure — returns generic error.
export async function upgradeAnonymousUser(): Promise<AuthUpgradeResult> {
    const currentUser: User | null = auth.currentUser;

    // Purpose: Validate that there is a current user to upgrade.
    if (!currentUser) {
        return {
            success: false,
            email: null,
            error: 'No authenticated user found. Please refresh the page.',
            errorCode: 'NO_USER',
        };
    }

    // Purpose: Edge case — user is already linked (not anonymous).
    // Return success immediately without attempting to link again.
    if (!currentUser.isAnonymous) {
        return {
            success: true,
            email: currentUser.email,
            error: null,
            errorCode: null,
        };
    }

    try {
        // Purpose: Link the anonymous user with Google via popup.
        // This preserves the original uid and all Firestore data.
        const result = await linkWithPopup(currentUser, googleProvider);
        const linkedUser = result.user;

        // Purpose: Update the Firestore user profile with the new email and name.
        const userRef = doc(db, `users/${linkedUser.uid}`);
        await updateDoc(userRef, {
            email: linkedUser.email,
            displayName: linkedUser.displayName,
            isAnonymous: false,
            linkedAt: Date.now(),
            authProvider: 'google.com',
        });

        return {
            success: true,
            email: linkedUser.email,
            error: null,
            errorCode: null,
        };
    } catch (error: any) {
        // Purpose: Handle specific Firebase auth errors with actionable messages.
        const errorCode: string = error?.code || 'UNKNOWN';

        // Purpose: Map Firebase error codes to user-friendly messages.
        const errorMessages: Record<string, string> = {
            'auth/credential-already-in-use':
                'This Google account is already linked to another user. Please try a different Google account.',
            'auth/popup-blocked':
                'The sign-in popup was blocked by your browser. Please allow popups for this site and try again.',
            'auth/popup-closed-by-user':
                'The sign-in popup was closed before completing. Please try again when ready.',
            'auth/cancelled-popup-request':
                'Sign-in was cancelled. Please try again.',
        };

        const message =
            errorMessages[errorCode] ||
            `Failed to link account: ${error?.message || 'Unknown error'}`;

        console.error('[Auth Link] upgradeAnonymousUser failed:', errorCode, error);

        return {
            success: false,
            email: null,
            error: message,
            errorCode,
        };
    }
}
