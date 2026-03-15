import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuthToken, isAuthenticated } from "@/lib/firebase/auth-guard";
import { revalidatePath } from "next/cache";

// Purpose: Force Vercel to execute this function in Singapore (sin1) for
// minimal round-trip latency to Firebase and end-users.
export const preferredRegion = "sin1";

// ---------------------------------------------------------------------------
// BotConfig type (mirrored from packages/types/src/schemas/saas.ts)
// Purpose: Strict contract for the Configurator → Firestore pipeline.
// Will be replaced with a direct @repo/types import once the types
// package has a proper package.json and workspace alias.
// ---------------------------------------------------------------------------

interface BotConfigPayload {
    id?: string;
    orgId?: string;
    botName: string;
    regularPrice: string;
    flashOffer: string;
    // Purpose: fomoMessage intentionally EXCLUDED from DB schema —
    // dynamically assembled by promptBuilder.ts at prompt-generation time.
    coreObjective: string;
    guidedFunnel: {
        secureOfferText: string;
        secureOfferVariations: string[];
        commitPayUrl: string;
        questionText: string;
        questionVariations?: string[];
        bookLaterText: string;
        bookLaterVariations?: string[];
    };
    finalContactQuestion: string;
    appointmentSlots: string[];
    appointmentDays: string[];
    knowledgeBase: {
        websiteUrl: string;
        businessFacts?: string;
        youtubeAssets?: { url: string; purpose: string }[];
        supportPhone?: string;
        supportEmail: string;
    };
    brandSettings: {
        primaryColor: string;
        logoUrl?: string;
        avatarUrl?: string;
    };
}

// ---------------------------------------------------------------------------
// GET /api/bots?botId=xxx — Fetch a single BotConfig by ID
// Purpose: Auth-gated. Only returns the bot if it belongs to the caller's org.
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
    // --- Auth Enforcement (Audit 1.1) ---
    const auth = await verifyAuthToken(request);
    if (!isAuthenticated(auth)) return auth; // 401 Response

    try {
        const url = new URL(request.url);
        const botId = url.searchParams.get("botId");

        if (!botId) {
            return Response.json(
                { success: false, message: "botId query parameter is required." },
                { status: 400 },
            );
        }

        const doc = await getAdminDb().collection("bots").doc(botId).get();

        if (!doc.exists) {
            return Response.json(
                { success: false, message: "Bot not found." },
                { status: 404 },
            );
        }

        // --- Tenant Isolation (Audit 3.5) ---
        // Verify the bot belongs to the authenticated user's org.
        if (doc.data()?.orgId !== auth.uid) {
            return Response.json(
                { success: false, message: "Bot not found." },
                { status: 404 },
            );
        }

        return Response.json(
            { success: true, config: { id: doc.id, ...doc.data() } },
            { status: 200 },
        );
    } catch (error) {
        console.error("GET /api/bots — FATAL:", error);
        return Response.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "An unexpected error occurred.",
            },
            { status: 500 },
        );
    }
}

// ---------------------------------------------------------------------------
// POST /api/bots — Create or update a BotConfig in Firestore
// Purpose: Auth-gated. orgId is ALWAYS the verified UID — no more randomUUID().
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
    // --- Auth Enforcement (Audit 1.2) ---
    const auth = await verifyAuthToken(request);
    if (!isAuthenticated(auth)) return auth; // 401 Response

    try {
        const body = (await request.json()) as BotConfigPayload;

        // Purpose: Use existing botId for updates, generate one for new bots.
        // CRITICAL: orgId is ALWAYS the verified UID — never from the body.
        const botId = body.id || crypto.randomUUID();
        const orgId = auth.uid;

        // If updating an existing bot, verify ownership first.
        if (body.id) {
            const existingDoc = await getAdminDb().collection("bots").doc(body.id).get();
            if (existingDoc.exists && existingDoc.data()?.orgId !== auth.uid) {
                return Response.json(
                    { success: false, message: "Bot not found." },
                    { status: 404 },
                );
            }
        }

        // Purpose: Strip fomoMessage before writing — it is dynamically
        // assembled by promptBuilder.ts and must never be stored in Firestore.
        const { fomoMessage: _discardedFomo, ...cleanBody } = body as BotConfigPayload & { fomoMessage?: string };

        const record = {
            ...cleanBody,
            id: botId,
            orgId,
            updatedAt: Date.now(),
        };

        await getAdminDb()
            .collection("bots")
            .doc(botId)
            .set(record, { merge: true });

        // Purpose: Bust the Vercel cache for the public bot config route so
        // the chat widget instantly reflects portal changes.
        revalidatePath(`/api/bots/${botId}/public`);
        // Purpose: Bust the dashboard cache so newly created/updated bots
        // appear immediately without a hard refresh.
        revalidatePath("/dashboard");

        return Response.json(
            { success: true, botId, message: "Bot config saved." },
            { status: 200 },
        );
    } catch (error) {
        console.error("POST /api/bots — FATAL:", error);
        return Response.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "An unexpected error occurred.",
            },
            { status: 500 },
        );
    }
}

// ---------------------------------------------------------------------------
// DELETE /api/bots?botId=xxx — Soft-delete a BotConfig in Firestore
// Purpose: Auth-gated. Sets deletedAt timestamp instead of hard delete.
// ---------------------------------------------------------------------------

export async function DELETE(request: Request) {
    const auth = await verifyAuthToken(request);
    if (!isAuthenticated(auth)) return auth;

    try {
        const url = new URL(request.url);
        const botId = url.searchParams.get("botId");

        if (!botId) {
            return Response.json(
                { success: false, message: "botId query parameter is required." },
                { status: 400 },
            );
        }

        // Verify ownership
        const existingDoc = await getAdminDb().collection("bots").doc(botId).get();
        if (!existingDoc.exists || existingDoc.data()?.orgId !== auth.uid) {
            return Response.json(
                { success: false, message: "Bot not found." },
                { status: 404 },
            );
        }

        // Soft delete — preserve data for audit trail.
        await getAdminDb()
            .collection("bots")
            .doc(botId)
            .set({ deletedAt: Date.now() }, { merge: true });

        // Purpose: Bust the dashboard cache so the deleted bot
        // disappears immediately without a hard refresh.
        revalidatePath("/dashboard");

        return Response.json(
            { success: true, message: "Bot deleted." },
            { status: 200 },
        );
    } catch (error) {
        console.error("DELETE /api/bots — FATAL:", error);
        return Response.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "An unexpected error occurred.",
            },
            { status: 500 },
        );
    }
}
