// Purpose: Ephemeral JWT QR Code API Route — generates a short-lived JWT
// encoding the Ghost State uid with a strict 60-second expiry.
// Used by the mobile QR scanner to establish a temporary authenticated session.
// Uses the `jose` library for Edge-compatible JWT signing (no Node.js crypto).

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

// Purpose: Sprint 136 — Enforce strict cryptographic secret provision.
// Never fallback to a hardcoded string to prevent local token forgery in production.
function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_QR_SECRET;
    if (!secret) {
        throw new Error("CRITICAL: JWT_QR_SECRET environment variable is not set.");
    }
    return new TextEncoder().encode(secret);
}

// Purpose: POST handler — accepts a JSON body with `uid` and returns a
// signed JWT with 60-second expiry and QR-encodable URL.
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const uid: string | undefined = body?.uid;

        // Purpose: Validate that a uid was provided in the request body.
        if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
            return NextResponse.json(
                { error: 'Missing or invalid uid in request body.' },
                { status: 400 }
            );
        }

        // Purpose: Sign a JWT with the Ghost State uid and strict 60s expiry.
        // Claims: sub (uid), iat (issued at), exp (expiry), iss (issuer).
        const token = await new SignJWT({ sub: uid })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('60s')
            .setIssuer('sg-tutor-qr')
            .sign(getJwtSecret());

        // Purpose: Construct the QR-encodable URL with the JWT as a query param.
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sg-tutor.vercel.app';
        const qrUrl = `${baseUrl}/api/auth/qr/verify?token=${token}`;

        return NextResponse.json({
            token,
            qrUrl,
            expiresIn: 60,
        });
    } catch (error) {
        // Purpose: Catch-all error handler — log and return 500.
        console.error('[QR Auth] JWT generation failed:', error);
        return NextResponse.json(
            { error: 'Failed to generate QR token.' },
            { status: 500 }
        );
    }
}

// Purpose: GET handler — returns a health check for the QR auth endpoint.
export async function GET(): Promise<NextResponse> {
    return NextResponse.json({ status: 'ok', endpoint: 'qr-auth' });
}
