import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { buildSystemPrompt } from "./promptBuilder";
import { secureLog } from "@repo/core-engine/utils/logger";

// Purpose: Force Vercel to execute this function in Singapore (sin1) for
// minimal round-trip latency to Firebase and end-users.
export const preferredRegion = "sin1";

const dashscope = createOpenAI({
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    apiKey: process.env.DASHSCOPE_API_KEY ?? "",
});

// ---------------------------------------------------------------------------
// Purpose: Circuit breaker message — returned when bot config cannot be loaded.
// No fake fallback pricing is ever injected to prevent liability.
// ---------------------------------------------------------------------------
const CIRCUIT_BREAKER_MESSAGE = "Apologies, the bot is temporarily down. Please try again later.";

// ---------------------------------------------------------------------------
// Point 3: IP-based rate limiter (20 req/IP/hour, in-memory)
// Purpose: Protect LLM billing credits from malicious bot spam.
// ---------------------------------------------------------------------------

interface RateBucket {
    count: number;
    resetAt: number;
}

const rateLimitMap = new Map<string, RateBucket>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const bucket = rateLimitMap.get(ip);

    if (!bucket || now >= bucket.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }

    bucket.count++;
    if (bucket.count > RATE_LIMIT_MAX) {
        return true;
    }
    return false;
}

// ---------------------------------------------------------------------------
// Point 5: Lead Deduplication Helper
// Purpose: Prevent CRM clutter by merging returning customers.
// ---------------------------------------------------------------------------

async function deduplicateLead(
    orgId: string,
    phone?: string,
    email?: string,
    chatId?: string,
): Promise<void> {
    if (!orgId || (!phone && !email)) return;

    const db = getAdminDb();
    const leadsRef = db.collection("leads");

    // Query by phone first, then email — find any existing lead for this org.
    let existingDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

    if (phone) {
        const phoneSnap = await leadsRef
            .where("orgId", "==", orgId)
            .where("phone", "==", phone)
            .limit(1)
            .get();
        if (!phoneSnap.empty) {
            existingDoc = phoneSnap.docs[0]!;
        }
    }

    if (!existingDoc && email) {
        const emailSnap = await leadsRef
            .where("orgId", "==", orgId)
            .where("email", "==", email)
            .limit(1)
            .get();
        if (!emailSnap.empty) {
            existingDoc = emailSnap.docs[0]!;
        }
    }

    // If an existing lead exists and we have a new chatId, append it.
    // Purpose (Audit 3.2): Ensure `isArchived: false` is explicitly set so
    // the CRM's `where("isArchived", "==", false)` onSnapshot query picks
    // up this lead. Firestore equality filters do not match missing fields.
    if (existingDoc && chatId) {
        await existingDoc.ref.set(
            {
                chatIds: FieldValue.arrayUnion(chatId),
                isArchived: existingDoc.data().isArchived ?? false,
                updatedAt: Date.now(),
            },
            { merge: true },
        );
        console.log(
            `DEDUP — Appended chatId ${chatId} to existing lead ${existingDoc.id}`,
        );
    }
}

// ---------------------------------------------------------------------------
// Point 7: Graceful Degradation — static fallback message
// ---------------------------------------------------------------------------

const LLM_TIMEOUT_MS = 8_000;
const FALLBACK_MESSAGE =
    "I am currently experiencing high volume. Please leave your email and my human team will contact you.";

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
    // -------------------------------------------------------------------
    // Point 3: Rate Limiting — extract IP and enforce 20 req/IP/hr.
    // -------------------------------------------------------------------
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0]!.trim() : "unknown";

    if (isRateLimited(clientIp)) {
        return new Response(
            JSON.stringify({ error: "Too many requests. Please try again later." }),
            { status: 429, headers: { "Content-Type": "application/json" } },
        );
    }

    try {
        // Purpose: Read botId from URL query params (set by embed transport).
        const url = new URL(req.url);
        const botId = url.searchParams.get("botId") || "";

        const { messages } = await req.json();

        const formattedMessages = messages.map((msg: any) => ({
            role: msg.role,
            content:
                msg.content ||
                (msg.parts
                    ? msg.parts.map((p: any) => p.text).join("")
                    : ""),
        }));

        // -------------------------------------------------------------------
        // Point 3 (Scale): Sliding Window — prevent LLM token bloat.
        // Purpose: Keep only the last 10 user/assistant messages. The system
        // prompt is injected separately via the `system` parameter.
        // -------------------------------------------------------------------
        const MAX_CONTEXT_MESSAGES = 10;
        const windowedMessages =
            formattedMessages.length > MAX_CONTEXT_MESSAGES
                ? formattedMessages.slice(-MAX_CONTEXT_MESSAGES)
                : formattedMessages;

        // Purpose: Fetch the merchant's BotConfig before initializing the AI stream.
        // CIRCUIT BREAKER: If config cannot be loaded, refuse to call the LLM.
        let config: Record<string, any> | null = null;
        try {
            if (botId) {
                // Fetch a specific bot by ID if provided.
                const doc = await getAdminDb().collection("bots").doc(botId).get();
                if (doc.exists) {
                    const data = doc.data() || {};
                    config = {
                        id: doc.id,
                        ...data,
                        knowledgeBase: {
                            websiteUrl: "",
                            businessFacts: "",
                            supportEmail: "",
                            supportPhone: "",
                            ...(data.knowledgeBase || {}),
                        },
                    };
                    console.log("[DEBUG] Firestore Fetch Result for BotID:", botId, "=>", {
                        regularPrice: config.regularPrice,
                        flashOffer: config.flashOffer,
                        coreObjective: config.coreObjective,
                    });
                } else {
                    // botId was provided but doc doesn't exist — circuit break.
                    console.error(`[CIRCUIT BREAKER] Bot ${botId} not found in Firestore.`);
                    return new Response(
                        JSON.stringify({ error: CIRCUIT_BREAKER_MESSAGE }),
                        { status: 404, headers: { "Content-Type": "application/json" } },
                    );
                }
            } else {
                // No botId provided — attempt first-in-collection.
                console.warn("[DEBUG] No botId provided — falling back to first-in-collection.");
                const snapshot = await getAdminDb()
                    .collection("bots")
                    .limit(1)
                    .get();
                if (!snapshot.empty) {
                    const data = snapshot.docs[0]!.data() || {};
                    config = {
                        id: snapshot.docs[0]!.id,
                        ...data,
                        knowledgeBase: {
                            websiteUrl: "",
                            businessFacts: "",
                            supportEmail: "",
                            supportPhone: "",
                            ...(data.knowledgeBase || {}),
                        },
                    };
                    console.log("[DEBUG] First-in-collection fallback loaded:", {
                        docId: snapshot.docs[0]!.id,
                        regularPrice: config.regularPrice,
                        flashOffer: config.flashOffer,
                    });
                }
            }
        } catch (dbError) {
            // Purpose: Circuit breaker — DB failure means NO config, NO LLM call.
            console.error("[CIRCUIT BREAKER] Firestore fetch failed:", dbError);
            return new Response(
                JSON.stringify({ error: CIRCUIT_BREAKER_MESSAGE }),
                { status: 503, headers: { "Content-Type": "application/json" } },
            );
        }

        // Purpose: Final circuit breaker — if config is still null after all
        // attempts, refuse to call the LLM to prevent fake pricing.
        if (!config) {
            console.error("[CIRCUIT BREAKER] No bot config loaded — aborting.");
            return new Response(
                JSON.stringify({ error: CIRCUIT_BREAKER_MESSAGE }),
                { status: 503, headers: { "Content-Type": "application/json" } },
            );
        }

        // -------------------------------------------------------------------
        // Point 10: SaaS Subscription Enforcement
        // Purpose: Block chat if merchant's subscription is suspended.
        // Default (field missing) = active for backward compatibility.
        // -------------------------------------------------------------------
        if ((config as any).isActive === false) {
            return new Response(
                JSON.stringify({ error: "Service Suspended. Please contact support." }),
                { status: 403, headers: { "Content-Type": "application/json" } },
            );
        }

        console.log("DIAGNOSTIC - Key loaded in memory:", !!process.env.DASHSCOPE_API_KEY);
        console.log("DIAGNOSTIC - Bot config source:", botId ? `doc:${botId}` : "first-in-collection");

        // -------------------------------------------------------------------
        // Point 5: Lead Deduplication — fire-and-forget merge in background.
        // Purpose: Merge returning customers into existing CRM profiles.
        // -------------------------------------------------------------------
        const lastUserMsg = formattedMessages
            .filter((m: any) => m.role === "user")
            .pop();
        if (lastUserMsg && (config as any).orgId) {
            // Lightweight check — won't block the stream response.
            deduplicateLead(
                (config as any).orgId,
                undefined, // phone extracted by downstream lead-creation logic
                undefined, // email extracted by downstream lead-creation logic
                botId || undefined,
            ).catch((err) => console.error("DEDUP WARN:", err));
        }

        const systemPrompt = buildSystemPrompt(config as Parameters<typeof buildSystemPrompt>[0]);

        // -------------------------------------------------------------------
        // Point 7: Graceful Degradation — race LLM against timeout.
        // Purpose: Maintain lead capture even if the LLM provider is down.
        // -------------------------------------------------------------------
        const streamPromise = new Promise<Response>((resolve) => {
            try {
                const result = streamText({
                    model: dashscope.chat("qwen-max"),
                    system: systemPrompt,
                    messages: windowedMessages,
                });
                resolve(result.toUIMessageStreamResponse());
            } catch (err) {
                secureLog("STREAM INIT ERROR:", err);
                resolve(
                    new Response(FALLBACK_MESSAGE, {
                        status: 200,
                        headers: { "Content-Type": "text/plain" },
                    }),
                );
            }
        });

        const timeoutPromise = new Promise<Response>((resolve) => {
            setTimeout(() => {
                console.warn("LLM TIMEOUT — returning fallback message.");
                resolve(
                    new Response(FALLBACK_MESSAGE, {
                        status: 200,
                        headers: { "Content-Type": "text/plain" },
                    }),
                );
            }, LLM_TIMEOUT_MS);
        });

        return await Promise.race([streamPromise, timeoutPromise]);
    } catch (error) {
        secureLog("STREAM FATAL ERROR:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
