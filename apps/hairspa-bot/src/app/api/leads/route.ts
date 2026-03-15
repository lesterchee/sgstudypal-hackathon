import { getAdminDb } from "@/lib/firebase/admin";
import { verifyAuthToken, isAuthenticated } from "@/lib/firebase/auth-guard";
import { FieldValue } from "firebase-admin/firestore";

// Purpose: Force Vercel to execute this function in Singapore (sin1) for
// minimal round-trip latency to Firebase and end-users.
export const preferredRegion = "sin1";

// ---------------------------------------------------------------------------
// Lead type (mirrored from packages/types/src/schemas/saas.ts)
// Purpose: Strict contract for the CRM → Firestore pipeline.
// ---------------------------------------------------------------------------

interface LeadRecord {
    id: string;
    botId: string;
    orgId: string;
    name?: string;
    email?: string;
    phone?: string;
    preferredOutlet?: string;
    preferredDay?: string;
    preferredTime?: string;
    offerIntent?: "flash" | "regular";
    contactPreference?: string;
    status: string;
    createdAt: number;
    // Purpose: Click-to-Pay tracking fields (set by /pay/[botId] route).
    clickedPay?: boolean;
    clickedPayAt?: any;
    // Purpose: Closed-loop payment tracking (set by payment gateway webhook).
    paymentStatus?: string;
    paymentAmount?: number;
}

// ---------------------------------------------------------------------------
// GET /api/leads — Fetch leads scoped to the authenticated user's org
// Purpose: Auth-gated. Forces where("orgId", "==", uid) on every query.
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
    // --- Auth Enforcement (Audit 1.1) ---
    const auth = await verifyAuthToken(request);
    if (!isAuthenticated(auth)) return auth; // 401 Response

    try {
        const url = new URL(request.url);
        const botId = url.searchParams.get("botId");

        // CRITICAL: Always scope to the authenticated user's org (Audit 3.5).
        let ref: FirebaseFirestore.Query = getAdminDb()
            .collection("leads")
            .where("orgId", "==", auth.uid)
            .orderBy("createdAt", "desc");

        // Purpose: Further scope leads to a specific bot when botId is provided.
        if (botId) {
            ref = ref.where("botId", "==", botId);
        }

        const snapshot = await ref.get();

        const leads: LeadRecord[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as LeadRecord[];

        return Response.json({ success: true, leads }, { status: 200 });
    } catch (error) {
        // Purpose: Gracefully handle missing data or Firebase timeouts without crashing the serverless function.
        console.error("GET /api/leads — FATAL:", error);
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
// PATCH /api/leads — Update specific fields on a lead document
// Purpose: Auth-gated. Verifies lead ownership before mutation.
// ---------------------------------------------------------------------------

export async function PATCH(request: Request) {
    // --- Auth Enforcement (Audit 1.2) ---
    const auth = await verifyAuthToken(request);
    if (!isAuthenticated(auth)) return auth; // 401 Response

    try {
        const { leadId, updates } = (await request.json()) as {
            leadId: string;
            updates: Record<string, unknown>;
        };

        if (!leadId) {
            return Response.json(
                { success: false, message: "leadId is required." },
                { status: 400 },
            );
        }

        // --- Tenant Isolation: Verify lead belongs to caller's org ---
        const leadDoc = await getAdminDb().collection("leads").doc(leadId).get();
        if (!leadDoc.exists || leadDoc.data()?.orgId !== auth.uid) {
            return Response.json(
                { success: false, message: "Lead not found." },
                { status: 404 },
            );
        }

        // Purpose: Point 5 (Scale) — Action Accountability.
        // Append an audit trail entry whenever CRM-actionable fields are changed.
        if (updates.crmStatus || updates.statusUpdate) {
            const activityEntry = {
                uid: (updates._actorUid as string) || auth.uid,
                action: updates.crmStatus
                    ? `Status → ${updates.crmStatus}`
                    : `Update → ${updates.statusUpdate}`,
                timestamp: new Date().toISOString(),
            };
            // Remove internal-only field before writing to Firestore.
            delete updates._actorUid;

            await getAdminDb()
                .collection("leads")
                .doc(leadId)
                .set(
                    {
                        ...updates,
                        activityHistory: FieldValue.arrayUnion(activityEntry),
                    },
                    { merge: true },
                );
        } else {
            await getAdminDb()
                .collection("leads")
                .doc(leadId)
                .set(updates, { merge: true });
        }

        return Response.json(
            { success: true, leadId, message: "Lead updated." },
            { status: 200 },
        );
    } catch (error) {
        // Purpose: Gracefully handle missing data or Firebase timeouts without crashing the serverless function.
        console.error("PATCH /api/leads — FATAL:", error);
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
