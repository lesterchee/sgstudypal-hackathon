// ---------------------------------------------------------------------------
// Purpose: Centralised auth gate for all protected API routes.
// Extracts Bearer token from the Authorization header, verifies it via
// Firebase Admin SDK, and returns the caller's UID.
// Every protected route calls this ONCE at the top before touching Firestore.
// ---------------------------------------------------------------------------

import { getAdminAuth } from "./admin";

interface AuthResult {
    uid: string;
}

/**
 * Verify the Firebase ID token from the request's Authorization header.
 * Returns `{ uid }` on success.
 * Returns a 401 Response on failure (missing/invalid/expired token).
 */
export async function verifyAuthToken(
    request: Request,
): Promise<AuthResult | Response> {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return Response.json(
            { success: false, message: "Missing or malformed Authorization header." },
            { status: 401 },
        );
    }

    const idToken = authHeader.slice(7); // strip "Bearer "

    try {
        const decoded = await getAdminAuth().verifyIdToken(idToken);
        return { uid: decoded.uid };
    } catch (error) {
        console.error("AUTH GUARD — Token verification failed:", error);
        return Response.json(
            { success: false, message: "Invalid or expired token." },
            { status: 401 },
        );
    }
}

/**
 * Type guard: returns true if verifyAuthToken returned a successful AuthResult
 * (not an error Response).
 */
export function isAuthenticated(
    result: AuthResult | Response,
): result is AuthResult {
    return "uid" in result;
}
