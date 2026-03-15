import { getAdminDb } from "@/lib/firebase/admin";

// ---------------------------------------------------------------------------
// GET /api/bots/[botId]/public — Public-safe bot configuration
// Purpose: Exposes only safe display fields (avatar, colors, greeting, name)
// to the public chat widget without leaking sensitive prompt data.
// Uses Admin SDK so the client never needs direct Firestore access to bots.
// ---------------------------------------------------------------------------

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ botId: string }> },
) {
    try {
        const { botId } = await params;

        if (!botId) {
            return Response.json(
                { success: false, message: "botId is required." },
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

        const data = doc.data()!;

        // Purpose: Whitelist only public-safe fields. The greeting is
        // intentionally EXCLUDED — the chat widget assembles it dynamically
        // from regularPrice/flashOffer to prevent stale DB string leaks.
        const publicConfig = {
            id: doc.id,
            botName: data.botName ?? "Assistant",
            regularPrice: data.regularPrice ?? "",
            flashOffer: data.flashOffer ?? "",
            coreObjective: data.coreObjective ?? "",
            brandSettings: data.brandSettings ?? {},
            isActive: data.isActive !== false,
        };

        return Response.json(
            { success: true, config: publicConfig },
            { status: 200 },
        );
    } catch (error) {
        console.error("GET /api/bots/[botId]/public — FATAL:", error);
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
