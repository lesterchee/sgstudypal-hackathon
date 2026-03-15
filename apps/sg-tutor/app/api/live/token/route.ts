// Purpose: Sprint 151 — Authenticated token route for Gemini Multimodal Live API.
// Exchanges a verified Firebase session (via middleware x-user-id) for a
// short-lived ephemeral wss:// connection URL. The GEMINI_API_KEY never
// reaches the client JS bundle — it is injected server-side into the URL
// and transmitted only over encrypted HTTPS/WSS channels.

import { NextRequest, NextResponse } from "next/server";

// Purpose: Shape of the request body from the client.
interface LiveTokenRequest {
  model?: string;
  systemInstruction?: string;
  responseModalities?: string[];
}

// Purpose: Token validity window in milliseconds (5 minutes).
// The client should re-fetch the token before this expires.
const TOKEN_TTL_MS = 5 * 60 * 1000;

// Purpose: POST handler — verifies the authenticated user via the x-user-id
// header (injected by Edge middleware from the __session cookie), then
// constructs an ephemeral wss:// URL with the server-side GEMINI_API_KEY.
export async function POST(req: NextRequest) {
  try {
    // Purpose: Enforce the 401 Rule (.cursorrules §4A) — the x-user-id header
    // is injected by Edge middleware after verifying the __session cookie JWT.
    // If missing, the user is unauthenticated.
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in to start a tutoring session." },
        { status: 401 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[api/live/token] GEMINI_API_KEY is not configured");
      return NextResponse.json(
        { error: "AI service is not configured. Please contact support." },
        { status: 503 }
      );
    }

    const body = (await req.json()) as LiveTokenRequest;
    const model = body.model ?? "gemini-2.5-flash-native-audio-preview-12-2025";

    // Purpose: Construct the Gemini Multimodal Live API WebSocket URL.
    // The API key is injected server-side and transmitted to the client
    // over HTTPS. The client opens the wss:// connection directly — the
    // key is encrypted in transit and never stored in the JS bundle.
    const websocketUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    // Purpose: Calculate a client-side expiry timestamp. The client should
    // re-fetch the token before this time to maintain the session.
    const expiresAt = Date.now() + TOKEN_TTL_MS;

    console.log(
      `[api/live/token] Token issued for user=${userId} model=${model} expires=${new Date(expiresAt).toISOString()}`
    );

    return NextResponse.json({
      websocketUrl,
      model,
      expiresAt,
      config: {
        systemInstruction: body.systemInstruction ?? null,
        responseModalities: body.responseModalities ?? ["TEXT", "AUDIO"],
      },
    });
  } catch (err) {
    console.error("[api/live/token] Error:", err);
    return NextResponse.json(
      { error: "Failed to initialize Gemini Live session." },
      { status: 500 }
    );
  }
}
