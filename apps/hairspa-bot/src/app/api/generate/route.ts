import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { verifyAuthToken, isAuthenticated } from "@/lib/firebase/auth-guard";

// Purpose: Force Vercel to execute this function in Singapore (sin1) for
// minimal round-trip latency to Firebase and end-users.
export const preferredRegion = "sin1";

const dashscope = createOpenAI({
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    apiKey: process.env.DASHSCOPE_API_KEY ?? "",
});

// ---------------------------------------------------------------------------
// Purpose: IP-based rate limiter (10 req/IP/hour, in-memory)
// Protects LLM billing credits from generation spam.
// ---------------------------------------------------------------------------

interface RateBucket {
    count: number;
    resetAt: number;
}

const rateLimitMap = new Map<string, RateBucket>();
const RATE_LIMIT_MAX = 10;
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
// Purpose: Generate button-text variations for the Guided Funnel options
// using the same Dashscope (Qwen-Max) LLM provider as the chat route.
// ---------------------------------------------------------------------------

interface GenerateRequest {
    context: "secure_offer" | "question" | "book_later";
    currentText: string;
    flashOffer?: string;
    regularPrice?: string;
}

export async function POST(req: Request) {
    // --- Auth Enforcement ---
    const auth = await verifyAuthToken(req);
    if (!isAuthenticated(auth)) return auth; // 401 Response

    // --- Rate Limiting ---
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0]!.trim() : "unknown";

    if (isRateLimited(clientIp)) {
        return new Response(
            JSON.stringify({ error: "Too many requests. Please try again later." }),
            { status: 429, headers: { "Content-Type": "application/json" } },
        );
    }

    try {
        const body: GenerateRequest = await req.json();
        const { context, currentText, flashOffer, regularPrice } = body;

        if (!context || !currentText) {
            return new Response(
                JSON.stringify({ error: "Missing required fields: context, currentText" }),
                { status: 400, headers: { "Content-Type": "application/json" } },
            );
        }

        // Purpose: Build a context-specific system prompt for variation generation.
        const priceContext =
            context === "secure_offer"
                ? ` The flash offer price is $${flashOffer || "10"} and the regular price is $${regularPrice || "28"}.`
                : context === "book_later"
                  ? ` The regular price is $${regularPrice || "28"}.`
                  : "";

        const contextLabels: Record<string, string> = {
            secure_offer: "a 'Secure the offer' call-to-action button",
            question: "an 'I have a question' inquiry button",
            book_later: "a 'Book later / Leave my details' button",
        };

        const systemPrompt = `You are a conversion copywriter for a sales chatbot. Generate exactly 5 short, punchy button-text variations.

Context: This is ${contextLabels[context] || "a funnel button"}.${priceContext}
Current text: "${currentText}"

Rules:
- Maximum 8 words each
- Action-oriented and persuasive
- If the context involves a price, include the $ amount
- Return ONLY a JSON array of 5 strings, no other text

Example output: ["Variation 1", "Variation 2", "Variation 3", "Variation 4", "Variation 5"]`;

        const result = await generateText({
            model: dashscope.chat("qwen-max"),
            prompt: systemPrompt,
        });

        // Purpose: Parse the LLM response as a JSON string array.
        let variations: string[];
        try {
            variations = JSON.parse(result.text);
            if (!Array.isArray(variations)) throw new Error("Not an array");
        } catch {
            // Fallback: split by newlines if JSON parsing fails.
            variations = result.text
                .split("\n")
                .map((line) => line.replace(/^[\d.\-*]+\s*/, "").replace(/^["']|["']$/g, "").trim())
                .filter((line) => line.length > 0)
                .slice(0, 5);
        }

        return new Response(
            JSON.stringify({ variations }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        );
    } catch (error) {
        console.error("GENERATE ROUTE ERROR:", error);
        return new Response(
            JSON.stringify({ error: "Failed to generate variations" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
}
