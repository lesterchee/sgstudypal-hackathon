// Purpose: Secure webhook receiver for CommitPayApp payment success events.
// Authorizes via shared secret, then updates the CRM lead's pipeline status
// and attaches the realized revenue amount from the transaction.
// Audit 2.2: Uses Firestore runTransaction() to eliminate TOCTOU race
// condition during concurrent webhook retries.

import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// ---------------------------------------------------------------------------
// POST /api/webhooks/payment — CommitPayApp → CRM lead pipeline update
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
    // -----------------------------------------------------------------------
    // Step 1: Authenticate the webhook caller via shared secret.
    // Purpose: Prevent malicious actors from artificially inflating merchant
    // revenue metrics by sending forged "PAID" events.
    // -----------------------------------------------------------------------

    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.CRM_WEBHOOK_SECRET;

    if (!expectedToken) {
        console.error("WEBHOOK FATAL: CRM_WEBHOOK_SECRET is not configured.");
        return Response.json(
            { success: false, message: "Server misconfiguration." },
            { status: 500 },
        );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return Response.json(
            { success: false, message: "Unauthorized." },
            { status: 401 },
        );
    }

    // -----------------------------------------------------------------------
    // Step 2: Parse & validate the incoming payload.
    // -----------------------------------------------------------------------

    try {
        const body = (await req.json()) as {
            leadId?: string;
            status?: string;
            amount?: number;
            timestamp?: string;
        };

        const { leadId, status, amount, timestamp } = body;

        if (!leadId || typeof amount !== "number") {
            return Response.json(
                { success: false, message: "leadId (string) and amount (number) are required." },
                { status: 400 },
            );
        }

        // -------------------------------------------------------------------
        // Step 3: Atomic idempotency check + state mutation via Transaction.
        // Purpose (Audit 2.2): Eliminates the TOCTOU race condition where
        // concurrent webhook retries could both read paymentStatus !== "PAID"
        // and then both write "PAID", corrupting revenue metrics.
        // The Firestore transaction serializes the read-check-write into a
        // single atomic operation with automatic retry on contention.
        // -------------------------------------------------------------------

        const leadRef = getAdminDb().collection("leads").doc(leadId);

        const result = await getAdminDb().runTransaction(async (tx) => {
            const leadDoc = await tx.get(leadRef);

            if (!leadDoc.exists) {
                return { code: 404 as const, message: `Lead ${leadId} not found.` };
            }

            // Idempotency Guard: Abort if already PAID.
            if (leadDoc.data()?.paymentStatus === "PAID") {
                console.log(
                    `WEBHOOK IDEMPOTENT — Lead ${leadId} already PAID. Skipping.`,
                );
                return { code: 200 as const, message: "Already processed." };
            }

            // Atomic write: transition to PAID exactly once.
            tx.update(leadRef, {
                paymentStatus: "PAID",
                paymentAmount: amount,
                crmStatus: "Closed",
                updatedAt: FieldValue.serverTimestamp(),
            });

            return { code: 200 as const, message: "OK" };
        });

        if (result.code === 404) {
            return Response.json(
                { success: false, message: result.message },
                { status: 404 },
            );
        }

        if (result.message === "Already processed.") {
            return Response.json(
                { success: true, message: "Already processed." },
                { status: 200 },
            );
        }

        console.log(
            `WEBHOOK OK — Lead ${leadId} marked PAID ($${amount}).`,
            { status, timestamp },
        );

        return Response.json({ success: true }, { status: 200 });
    } catch (error) {
        // Purpose: Gracefully handle malformed payloads, Firebase timeouts,
        // or transaction contention exhaustion.
        console.error("WEBHOOK FATAL:", error);
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
