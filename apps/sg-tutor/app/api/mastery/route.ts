// Purpose: API endpoint to fetch aggregated mastery data for the Gamified
// Mastery Dashboard. Reads from Firestore users/{userId}/sessions and
// aggregates by concept with latest mastery_level.
// Sprint 134 — Replaced FALLBACK_USER_ID with verified x-user-id header from middleware.

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
    // Purpose: Sprint 134 — Extract verified user ID from the middleware state handoff. Reject if missing.
    const userId = req.headers.get('x-user-id');
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized: Missing user ID at network boundary" }, { status: 401 });
    }

    try {
        // Purpose: Fetch all mastery session docs for the authenticated user, ordered by
        // timestamp descending so that the latest assessment wins per concept.
        const snapshot = await adminDb
            .collection("users")
            .doc(userId)
            .collection("sessions")
            .orderBy("timestamp", "desc")
            .limit(200)
            .get();

        // Purpose: Aggregate mastery entries by concept. Keep only the latest
        // mastery_level for each concept (first occurrence wins since ordered desc).
        const conceptMap = new Map<string, { concept: string; mastery_level: string; timestamp: string }>();

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (data.concept && !conceptMap.has(data.concept)) {
                conceptMap.set(data.concept, {
                    concept: data.concept,
                    mastery_level: data.mastery_level || "low",
                    timestamp: data.timestamp || "",
                });
            }
        });

        return NextResponse.json(Array.from(conceptMap.values()));
    } catch (error: any) {
        console.error("[MASTERY API ERROR]", error.message);
        // Purpose: Graceful fallback — return empty array instead of 500
        // so the dashboard renders the empty state rather than crashing.
        return NextResponse.json([]);
    }
}
