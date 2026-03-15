// Purpose: Sprint 70 — GET endpoint to fetch lesson conversation history from Firestore.
// Reads messages from users/{userId}/lessons/{topicId} for the Teach Me Lesson View.
// Returns empty messages array if no history exists (triggers proactive greeting).
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
        const { searchParams } = new URL(req.url);
        const topicId = searchParams.get("topicId");

        if (!topicId) {
            return NextResponse.json({ messages: [] });
        }

        // Purpose: Fetch the lesson document from Firestore scoped to the authenticated user.
        const docRef = adminDb
            .collection("users")
            .doc(userId)
            .collection("lessons")
            .doc(topicId);

        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ messages: [] });
        }

        const data = doc.data();
        return NextResponse.json({ messages: data?.messages || [] });
    } catch (error: any) {
        console.error("[LESSONS API ERROR]", error.message);
        // Purpose: Return empty messages on error — frontend falls back to proactive greeting.
        return NextResponse.json({ messages: [] });
    }
}
