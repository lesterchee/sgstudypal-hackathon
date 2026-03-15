// Purpose: Sprint 133 — Bridges Firebase client-side auth (IndexedDB tokens) to the
// Edge Middleware layer by syncing the Firebase ID token to a `__session` cookie.
// This cookie is readable by Vercel's Edge Middleware for pre-route auth gating.
// Must be called once from a top-level client component (AuthProvider).

import { onIdTokenChanged, type Auth } from "firebase/auth";

// Purpose: Cookie name matching the middleware's expected session cookie.
const SESSION_COOKIE_NAME = "__session";

// Purpose: Write a cookie with SameSite=Lax for same-origin API calls.
// Path=/ ensures the cookie is sent on all routes including /api/*.
function setCookie(name: string, value: string): void {
    document.cookie = `${name}=${value}; path=/; max-age=3600; SameSite=Lax; Secure`;
}

// Purpose: Delete the cookie by setting max-age=0.
function deleteCookie(name: string): void {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax; Secure`;
}

// Purpose: Subscribe to Firebase ID token changes and sync to the __session cookie.
// Returns an unsubscribe function for cleanup.
export function syncAuthCookie(authInstance: Auth): () => void {
    const unsubscribe = onIdTokenChanged(authInstance, async (user) => {
        if (user) {
            // Purpose: Get the current ID token and write it to the cookie.
            // forceRefresh=false uses the cached token (auto-refreshes if expired).
            const token = await user.getIdToken();
            setCookie(SESSION_COOKIE_NAME, token);
        } else {
            // Purpose: User signed out — clear the session cookie so middleware
            // redirects to /login on next navigation.
            deleteCookie(SESSION_COOKIE_NAME);
        }
    });

    return unsubscribe;
}
