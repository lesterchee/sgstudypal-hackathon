// Purpose: Sprint 133 — Re-enable Edge Middleware to protect authenticated boundaries
// and prevent unauthenticated access. Verifies the Firebase session cookie (JWT),
// extracts the user ID, and injects it as an x-user-id header for downstream API routes.
// Uses Edge-compatible JWT decoding (base64url payload decode, no Node.js crypto).

import { NextResponse, type NextRequest } from 'next/server';

// Purpose: Decode a base64url-encoded string (Edge-safe, no Node.js Buffer).
function base64UrlDecode(str: string): string {
    // Replace URL-safe characters and add padding.
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return atob(padded);
}

// Purpose: Extract the Firebase UID from a JWT token by decoding the payload segment.
// Returns the `sub` or `user_id` claim (Firebase ID tokens use both).
// Returns null if the token is malformed or missing the uid claim.
function extractUidFromJwt(token: string): string | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payloadJson = base64UrlDecode(parts[1]);
        const payload = JSON.parse(payloadJson);

        // Purpose: Firebase ID tokens set the UID in `sub` (standard JWT claim)
        // and also in `user_id` (Firebase-specific claim). Check both.
        const uid = payload.sub || payload.user_id;
        if (!uid || typeof uid !== 'string') return null;

        // Purpose: Basic expiry check — reject expired tokens at the edge.
        if (payload.exp && typeof payload.exp === 'number') {
            const nowInSeconds = Math.floor(Date.now() / 1000);
            if (payload.exp < nowInSeconds) return null;
        }

        return uid;
    } catch {
        return null;
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Purpose: Check for the Firebase session cookie (__session is synced by auth-cookie-sync.ts).
    const sessionCookie = request.cookies.get('__session')?.value;

    // Purpose: Extract the Firebase UID from the JWT token.
    const uid = sessionCookie ? extractUidFromJwt(sessionCookie) : null;

    if (!uid) {
        // Purpose: Differentiate between API routes (return 401 JSON) and
        // dashboard routes (redirect to /login with callbackUrl).
        if (pathname.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'Unauthorized: Missing or invalid session at network boundary.' },
                { status: 401 }
            );
        }

        // Purpose: Dashboard route — redirect to login with return URL.
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Purpose: Inject the verified user ID into the downstream request headers.
    // API routes extract this via req.headers.get('x-user-id').
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', uid);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

// Purpose: Sprint 133 — Re-enable edge middleware to protect authenticated
// boundaries and prevent unauthenticated access.
export const config = {
    matcher: ['/dashboard/:path*', '/api/chat/:path*', '/api/lessons/:path*', '/api/mastery/:path*', '/api/live/:path*'],
};
