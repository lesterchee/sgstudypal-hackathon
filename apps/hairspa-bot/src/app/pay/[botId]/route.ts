// ---------------------------------------------------------------------------
// Purpose: Click-tracking redirect route. Intercepts checkout clicks, records
// payment intent in Firestore, then 302-redirects to the merchant's
// CommitPay gateway with the sourceId appended for attribution.
// ---------------------------------------------------------------------------

import { redirect } from "next/navigation";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ botId: string }> },
) {
    const { botId } = await params;

    if (!botId) {
        return Response.json(
            { success: false, message: "botId is required." },
            { status: 400 },
        );
    }

    // Purpose: Fetch the BotConfig to retrieve the merchant's commitPayUrl.
    const doc = await getAdminDb().collection("bots").doc(botId).get();

    if (!doc.exists) {
        return Response.json(
            { success: false, message: "Bot not found." },
            { status: 404 },
        );
    }

    const data = doc.data() as { guidedFunnel?: { commitPayUrl?: string } };
    const commitPayUrl =
        data?.guidedFunnel?.commitPayUrl || "[INSERT_COMMITPAYAPP_URL]";

    // Purpose: Read optional leadId from query params for attribution.
    const url = new URL(request.url);
    const leadId = url.searchParams.get("leadId");

    // Purpose: If a leadId was provided, record payment intent on the lead doc.
    // Non-blocking: we fire the update but do NOT fail the redirect if it errors.
    if (leadId) {
        try {
            await getAdminDb().collection("leads").doc(leadId).update({
                clickedPay: true,
                clickedPayAt: FieldValue.serverTimestamp(),
                crmStatus: "Hot",
            });
        } catch (updateErr) {
            console.error(
                `[pay/${botId}] Lead update failed for ${leadId}:`,
                updateErr,
            );
        }
    }

    // Purpose: Build the final redirect URL. Use URL constructor to safely
    // append sourceId even if commitPayUrl already contains query params.
    let finalUrl = commitPayUrl;
    if (leadId) {
        try {
            const target = new URL(commitPayUrl);
            target.searchParams.append("sourceId", leadId);
            finalUrl = target.toString();
        } catch {
            // If commitPayUrl is not a valid absolute URL, fall back to simple concat.
            const separator = commitPayUrl.includes("?") ? "&" : "?";
            finalUrl = `${commitPayUrl}${separator}sourceId=${encodeURIComponent(leadId)}`;
        }
    }

    redirect(finalUrl);
}
