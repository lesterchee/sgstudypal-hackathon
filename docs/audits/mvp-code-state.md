# MVP Code State Audit

**Date:** 2026-03-08
**Purpose:** Complete snapshot of core logic files after FOMO Intercept, latency removal, and QuickReply state machine refactor.

---

## File 1: `apps/hairspa-bot/src/app/api/chat/route.ts`

```typescript
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const dashscope = createOpenAI({
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    apiKey: process.env.DASHSCOPE_API_KEY ?? "",
});

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `<role>You are Jean Yip's AI booking assistant, a high-converting, empathetic sales specialist for the Hair Spa.</role>

<objective>Either immediately route the user to the $10 Flash Offer CommitPay checkout link, OR qualify the lead for the $28 offer by sequentially extracting their Name, Email, Phone Number, Preferred Outlet, and Preferred Time Slot.</objective>


<universal_laws>
0. THE FOMO INTERCEPT (HIGHEST PRIORITY): If the user's VERY FIRST message is exactly 'Leave my details for the $28 promo' or 'I have a question', you MUST halt the standard funnel and reply with this EXACT text, verbatim: 'Of course 😊\n\nYou're welcome to ask any questions you may have, or leave your details if you prefer.\nJust a quick note — the $10 trial is only available when secured online through this chat.\nIf you choose to leave your details and have our team contact you later, the trial will be at the regular $28 price.\n\nBefore we continue, would you like me to help you secure the $10 offer now?'. Do not add any other text.
1. OFFER INTEGRITY & BOUNDARIES: The price is strictly $28. You cannot price-match (anchor to our 100+ botanicals & free Ginseng Ampoule), give influencer freebies, or offer discounts. The voucher requires a one-time $10 upfront payment (zero hidden subscriptions for this round of treatment) and is valid for 90 days. Group bookings require individual registrations. Available strictly at: Bedok Mall, Century Square, Parkway Parade, Westgate, and Plaza Singapura.
2. SAFETY, EMPATHY & DE-ESCALATION: If the user is pregnant, nursing, or has severe allergies, prioritize safety: advise consulting a doctor first, then pivot back to the promo gently. If the user trauma-dumps, expresses deep frustration, or insults the brand, use extreme tactical empathy. Acknowledge their stress, apologize, and pivot either to relaxation ('you deserve to sit back and be pampered') or human escalation via phone number.
3. OBJECTION HANDLING: If they stall ('I'll think about it' / 'Let me ask my husband'), pivot to self-care autonomy and inject urgency: 'At just $28, this is a guilt-free treat just for you. Should I hold a $10 payment link before slots fill up?' If they hesitate on giving a phone number, guarantee it is strictly for generating their secure $10 link and booking confirmation—no spam.
4. COMMUNICATION & IDENTITY CONTROL: You are Jean Yip's AI assistant. Use Professional Singlish to build rapport. Drop copula verbs occasionally ('This one very effective' instead of 'This is very effective'). Use discourse particles accurately but sparingly ('lah' for finality, 'leh' for gentle emphasis). Never use extreme slang; remain polite and trustworthy. If the chat loops 8 turns, present the $10 Stripe link.
5. THE BREVITY PROTOCOL: You must be extremely concise. Limit every response to a maximum of 2 to 3 short sentences. Never over-explain. Ask only ONE highly focused question at a time to drive the booking.
6. THE TELEMARKETING PLAYBOOK: You are playing a numbers game. Your goal is simply to move the user to the next step, not force a checkout immediately. Follow this micro-funnel: 1. Qualify their scalp issue -> 2. Briefly explain the $28 value -> 3. Offer the Stripe link. Do not jump to step 3 prematurely. Listen more than you talk. Ask ONE clarifying question and stop typing. Let the user reveal their needs. Stay emotionally neutral. If the user rejects the offer or objects, do not argue. Accept the rejection politely and offer to answer any other questions.
7. THE DUAL-PATH ROUTING: You must route the user based on their initial intent. PATH A (High Intent - Wants the $10 Offer): IF their message indicates wanting the $10 offer (e.g., 'Secure...', 'Unlock...', 'Claim...', 'Grab...', 'Reserve...', 'Lock in...', 'Book...', 'Get...'): You MUST immediately reply EXACTLY with: 'Great choice! Please click here to secure your limited-time $10 offer: [INSERT_COMMITPAYAPP_URL]'. Do not ask for their name or any other details. PATH B (Low Intent - Wants to leave details for $28): IF their message indicates leaving details for the $28 promo: You must sequentially extract their info one step at a time. Step 1: Ask for Name. Step 2: Ask for Email and Phone. CRITICAL VALIDATION: Before moving to Step 3, you must verify the provided email contains a valid '@' and domain structure, and the phone number looks realistic (e.g., a standard 8-digit Singapore format). If the user provides obvious dummy data (e.g., '1234567', 'test@test.com', 'abc') or a clearly incomplete string, you must gently flag it. Say something like: 'Hmm, that phone number/email doesn't look quite right. Could you double-check for typos? I need a valid contact to make sure our team can secure your slot!' Do not proceed to Step 3 until the data looks realistically valid. Step 3: Ask for Preferred Outlet (Bedok Mall, Century Square, Parkway Parade, Westgate, or Plaza Singapura). Step 4: Ask for Preferred Time Slot (Present exactly: 10am-12pm, 12pm-4pm, or 4pm-8pm). Step 5: Conclude by saying the team will reach out, but gently remind them they can still skip the line for $10 today via [INSERT_COMMITPAYAPP_URL]. PATH C (Questions): Answer briefly, then use the FOMO Loop (Rule 8).
8. THE FOMO LOOP (QUESTION HANDLING): Whenever you answer a user's question, you MUST conclude your response by reminding them of the price dynamic. Core Concept to convey: 'The $10 trial is only available if secured online now. If you leave your details for later, it reverts to the $28 regular price. Would you like me to help you secure the $10 offer now?' Constraint: You MUST dynamically rephrase and vary the wording of this Core Concept every single time so you never sound robotic. Be natural and polite, but firm on the pricing rule.
</universal_laws>

<critical_directive>
If the user is on the 'Leave Details' path, once they have provided their Name, Email, Phone, Outlet, AND chosen a Time Slot, you must immediately stop asking questions and confirm their details have been recorded.
</critical_directive>`;


// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        const formattedMessages = messages.map((msg: any) => ({
            role: msg.role,
            content:
                msg.content ||
                (msg.parts
                    ? msg.parts.map((p: any) => p.text).join("")
                    : ""),
        }));

        console.log("DIAGNOSTIC - Key loaded in memory:", !!process.env.DASHSCOPE_API_KEY);

        const result = streamText({
            model: dashscope.chat("qwen-max"),
            system: SYSTEM_PROMPT,
            messages: formattedMessages,
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("STREAM FATAL ERROR:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
```

---

## File 2: `apps/hairspa-bot/src/app/page.tsx`

```tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";
import { TypingIndicator } from "@repo/ui-chat";
import type { UIMessage } from "ai";

// Purpose: Flash Offer greeting — renders on page load before user interaction.
const INITIAL_MESSAGES: UIMessage[] = [
    {
        id: "msg-melinda-greet",
        role: "assistant",
        parts: [
            {
                type: "text",
                text: "\u{1F44B} Hi there \u{1F60A}\n\nThanks for checking out our **$28 new-client Hair Spa promo**.\n\nRight now, we\u2019re also running a **48-hour Flash Offer** \u2014 if you secure your trial online today through this chat, it\u2019s just **$10 instead of $28**.\n\nWould you like to:",
            },
        ],
    },
];


/**
 * Renders inline markdown bold (**text**) as <strong> elements.
 * Keeps the component self-contained without pulling in a full MD library.
 */
function renderBoldMarkdown(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
    });
}

export default function Home() {
    const { messages, sendMessage, status } = useChat({ messages: INITIAL_MESSAGES });

    const isStreaming = status === "streaming" || status === "submitted";

    // Purpose: Controls the collapsible widget — auto-expanded on load to
    // simulate a proactive chat popup on the Jean Yip website.
    const [isExpanded, setIsExpanded] = useState(true);

    // Purpose: Auto-scroll to the bottom of the chat container when new messages arrive or stream.
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Purpose: Dynamically render the correct quick replies based on the conversation's state machine.
    const isFirstInteraction = !messages.some((m) => m.role === "user");
    const lastMessage = messages.at(-1);

    // Extract text from the last assistant message's parts for intercept detection.
    const lastMessageText =
        lastMessage?.role === "assistant"
            ? lastMessage.parts
                  .filter((p): p is { type: "text"; text: string } => p.type === "text")
                  .map((p) => p.text)
                  .join("")
            : "";
    const isFomoIntercept = lastMessage?.role === "assistant" && lastMessageText.includes("would you like me to help you secure the $10 offer now?");

    let activeQuickReplies: string[] = [];
    if (isFirstInteraction) {
        activeQuickReplies = [
            "👉 Secure the $10 online offer now",
            "👉 Leave my details for the $28 promo",
            "👉 I have a question",
        ];
    } else if (isFomoIntercept) {
        activeQuickReplies = [
            "👉 Yes, secure my $10 offer",
            "👉 Leave my details for the $28 promo",
            "👉 I have a question",
        ];
    }

    const showQuickReplies = !isStreaming && (isFirstInteraction || isFomoIntercept);

    function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = e.currentTarget;
        const input = form.elements.namedItem("chat-input") as HTMLInputElement;
        const text = input.value.trim();
        if (!text) return;
        sendMessage({ text });
        input.value = "";
    }

    return (
        <>
            {/* ----------------------------------------------------------------
                Simulated salon website background — proves the widget floats
                above actual page content.
            ---------------------------------------------------------------- */}
            <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-stone-100 via-amber-50 to-stone-200">
                {/* Decorative blobs */}
                <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-amber-200/40 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-orange-200/30 blur-3xl" />

                {/* Placeholder site content */}
                <div className="z-10 text-center px-6">
                    <h1 className="text-4xl font-bold tracking-tight text-stone-800 sm:text-5xl">
                        Jean Yip Hair Spa
                    </h1>
                    <p className="mt-3 text-lg text-stone-500">
                        Premium scalp & hair treatments since 1984
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-stone-600 shadow-sm backdrop-blur">💆 Scalp Detox</span>
                        <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-stone-600 shadow-sm backdrop-blur">🌿 100+ Botanicals</span>
                        <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-stone-600 shadow-sm backdrop-blur">📍 5 Outlets</span>
                    </div>
                </div>
            </main>

            {/* ----------------------------------------------------------------
                Collapsible Chat Widget
            ---------------------------------------------------------------- */}

            {!isExpanded ? (
                /* ----- Minimized state: FAB launcher ----- */
                // Purpose: Floating Action Button to re-open the chat widget.
                <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-bold text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-95"
                    aria-label="Open chat"
                >
                    JY
                </button>
            ) : (
                /* ----- Expanded state: takeover overlay ----- */
                <div className="fixed bottom-4 right-4 z-50 flex h-[85vh] max-h-[800px] w-[90vw] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    {/* Header */}
                    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white shadow-md">
                            JY
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-sm font-semibold text-slate-900 truncate">
                                Jean Yip Hair Spa
                            </h1>
                            <p className="text-[11px] text-slate-500 truncate">
                                $28 Scalp Detox — AI Booking
                            </p>
                        </div>
                        {/* Close / minimise button */}
                        <button
                            type="button"
                            onClick={() => setIsExpanded(false)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            aria-label="Minimise chat"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </header>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${m.role === "user"
                                        ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-br-md"
                                        : "bg-slate-100 text-slate-800 rounded-bl-md border border-slate-200"
                                        }`}
                                >
                                    {m.parts
                                        .filter((p) => p.type === "text")
                                        .map((p, i) =>
                                            p.text.includes("\n") ? (
                                                <span key={i}>
                                                    {p.text.split("\n").map((line, li) => (
                                                        <span key={li}>
                                                            {li > 0 && <br />}
                                                            {renderBoldMarkdown(line)}
                                                        </span>
                                                    ))}
                                                </span>
                                            ) : (
                                                <span key={i}>{renderBoldMarkdown(p.text)}</span>
                                            ),
                                        )}
                                </div>
                            </div>
                        ))}
                        {isStreaming && messages.at(-1)?.role === "user" && (
                            <TypingIndicator />
                        )}
                        {/* Quick Replies — persistent after every assistant message */}
                        {showQuickReplies && (
                            <div className="flex flex-col gap-1.5 pt-1">
                                {activeQuickReplies.map((label: string) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => sendMessage({ text: label })}
                                        className="self-start rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-left text-[13px] font-medium text-amber-800 shadow-sm transition hover:bg-amber-100 hover:border-amber-400 active:scale-[0.98]"
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={handleFormSubmit}
                        className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2.5"
                    >
                        <input
                            id="chat-input"
                            name="chat-input"
                            placeholder="Ask about our Scalp Detox Therapy…"
                            className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-[13px] text-slate-900 placeholder-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                            autoComplete="off"
                        />
                        <button
                            type="submit"
                            disabled={isStreaming}
                            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-[13px] font-semibold text-white shadow-md transition hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
```
