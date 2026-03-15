"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState, useMemo, useCallback, use } from "react";
import { DefaultChatTransport } from "ai";
import { TypingIndicator } from "@repo/ui-chat";
import type { UIMessage } from "ai";

// ---------------------------------------------------------------------------
// Purpose: Public-safe config shape returned by /api/bots/[botId]/public.
// Used to dynamically render the greeting and quick replies.
// ---------------------------------------------------------------------------
interface PublicBotConfig {
    botName: string;
    regularPrice: string;
    flashOffer: string;
    coreObjective?: string;
    brandSettings?: { primaryColor?: string };
    isActive: boolean;
}

// Purpose: Circuit breaker constant — no fallback pricing.
// If the DB config cannot be loaded, the bot refuses to quote prices.

/**
 * Renders inline markdown bold (**text**) and links [text](url) as React elements.
 * Links open in a new tab with noopener noreferrer for security.
 * Keeps the component self-contained without pulling in a full MD library.
 */
function renderMarkdown(text: string) {
    // Split on markdown links [text](url) and bold **text**
    const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);
    const elements: React.ReactNode[] = [];
    let i = 0;
    while (i < parts.length) {
        const part = parts[i];
        if (part === undefined || part === "") {
            i++;
            continue;
        }
        // Check if this is a full markdown link match [text](url)
        if (part.startsWith("[") && part.includes("](")) {
            const linkText = parts[i + 1]; // captured group 1: link text
            const linkUrl = parts[i + 2];  // captured group 2: URL
            elements.push(
                <a
                    key={i}
                    href={linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 underline underline-offset-2 hover:text-amber-700 font-medium"
                >
                    {linkText}
                </a>,
            );
            i += 3; // skip the two capture groups
        } else if (part.startsWith("**") && part.endsWith("**")) {
            elements.push(<strong key={i}>{part.slice(2, -2)}</strong>);
            i++;
        } else {
            elements.push(<span key={i}>{part}</span>);
            i++;
        }
    }
    return elements;
}

// ---------------------------------------------------------------------------
// Purpose: Pricing props passed from DynamicChatPage -> ChatWidget AFTER the
// public config fetch resolves. This guarantees useChat never sees stale
// fallback values — the hook only initializes when ChatWidget first mounts.
// ---------------------------------------------------------------------------
interface ChatWidgetProps {
    botId: string;
    pricing: { regularPrice: string; flashOffer: string; botName: string };
}

function ChatWidget({ botId, pricing }: ChatWidgetProps) {
    // Purpose: Dynamically assemble the initial greeting UI directly from
    // fetched pricing variables to prevent stale fallbacks. This template
    // literal is the SOLE source of truth for the greeting paragraph.
    const initialMessages = useMemo<UIMessage[]>(
        () => [
            {
                id: "msg-melinda-greet",
                role: "assistant" as const,
                parts: [
                    {
                        type: "text" as const,
                        text: `\u{1F44B} Hi there \u{1F60A}\n\nThanks for checking out our **$${pricing.regularPrice} new-client promo**.\n\nRight now, we\u2019re also running a **48-hour Flash Offer** \u2014 if you secure your trial online today through this chat, it\u2019s just **$${pricing.flashOffer} instead of $${pricing.regularPrice}**.\n\nWould you like to:`,
                    },
                ],
            },
        ],
        [pricing.regularPrice, pricing.flashOffer],
    );

    // Purpose: Create a memoized transport with the correct api URL containing botId.
    const transport = useMemo(
        () =>
            new DefaultChatTransport({
                api: `/api/chat?botId=${encodeURIComponent(botId)}`,
            }),
        [botId],
    );

    const { messages, sendMessage, status } = useChat({
        messages: initialMessages,
        transport,
    });

    const isStreaming = status === "streaming" || status === "submitted";

    // Purpose: Controls the collapsible widget — auto-expanded on load to
    // simulate a proactive chat popup on the merchant's website.
    const [isExpanded, setIsExpanded] = useState(true);

    // Purpose: Broadcast expanded/collapsed state to the parent window (embed iframe handshake).
    useEffect(() => {
        window.parent.postMessage({ type: "COMMITPAY_RESIZE", isExpanded }, "*");
    }, [isExpanded]);

    // Purpose: Multi-select chip state for outlet, day, and time funnel stages.
    const [selectedChips, setSelectedChips] = useState<string[]>([]);

    // Purpose: Auto-scroll to the bottom of the chat container when new messages arrive or stream.
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isStreaming]);

    // Purpose: Reset chip selection whenever a new AI message arrives so stale selections don't persist.
    useEffect(() => {
        setSelectedChips([]);
    }, [messages]);

    // Purpose: Dynamically render contextual quick replies by detecting the AI's current funnel stage.
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

    // Purpose: Dynamic FOMO intercept detection using the merchant's flash price.
    // Resilient: matches if the message contains the flash price number AND the word "offer",
    // regardless of whether the AI includes the $ sign or trailing punctuation.
    const isFomoIntercept = lastMessage?.role === "assistant" && lastMessageText.includes(pricing.flashOffer) && lastMessageText.toLowerCase().includes("offer");

    // Purpose: Resilient multi-select funnel detection using loose OR-based
    // keyword matching. Priority order: Contact (override) > Outlet > Day > Time.
    // Guards prevent overlap when the AI mentions multiple funnel stages in one message.
    const textLower = lastMessageText.toLowerCase();
    const isAssistant = lastMessage?.role === "assistant";

    // Purpose: Final contact-method override — suppresses ALL chip-based quick
    // replies when the AI asks how the user wants to be reached (WhatsApp/Phone).
    // This prevents earlier funnel keywords from falsely re-triggering chips.
    const isAskingContact = isAssistant && (textLower.includes("whatsapp") || textLower.includes("phone call") || textLower.includes("reach out"));

    const isAskingOutlet = !isAskingContact && isAssistant && (textLower.includes("outlet") || textLower.includes("location") || textLower.includes("bedok") || textLower.includes("parkway") || textLower.includes("westgate"));
    const isAskingDay = !isAskingContact && isAssistant && !isAskingOutlet && (textLower.includes("which day") || textLower.includes("preferred day") || textLower.includes("monday") || textLower.includes("weekend"));
    const isAskingTime = !isAskingContact && isAssistant && !isAskingOutlet && !isAskingDay && (textLower.includes("time slot") || textLower.includes("preferred time") || textLower.includes("10am") || textLower.includes("4pm"));

    // Purpose: Determine if this stage uses multi-select chips vs instant-send buttons.
    const isMultiSelect = isAskingOutlet || isAskingDay || isAskingTime;

    // Purpose: Dynamic quick replies using merchant pricing from BotConfig.
    let activeQuickReplies: string[] = [];
    if (isFirstInteraction) {
        activeQuickReplies = [
            `👉 Secure the $${pricing.flashOffer} online offer now`,
            `👉 Leave my details for the $${pricing.regularPrice} promo`,
            "👉 I have a question",
        ];
    } else if (isFomoIntercept) {
        activeQuickReplies = [
            `👉 Yes, secure my $${pricing.flashOffer} offer`,
            `👉 Leave my details for the $${pricing.regularPrice} promo`,
            "👉 I have a question",
        ];
    } else if (isAskingOutlet) {
        activeQuickReplies = ["Bedok Mall", "Century Square", "Parkway Parade", "Westgate", "Plaza Singapura"];
    } else if (isAskingDay) {
        activeQuickReplies = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    } else if (isAskingTime) {
        activeQuickReplies = ["10am-12pm", "12pm-4pm", "4pm-8pm"];
    }

    const showQuickReplies = !isStreaming && activeQuickReplies.length > 0;

    // Purpose: Toggle a chip in/out of the selectedChips array.
    const toggleChip = useCallback((chip: string) => {
        setSelectedChips((prev) =>
            prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip],
        );
    }, []);

    // Purpose: Send all selected chips as a comma-joined message and reset.
    const confirmSelection = useCallback(() => {
        if (selectedChips.length === 0) return;
        sendMessage({ text: selectedChips.join(", ") });
        setSelectedChips([]);
    }, [selectedChips, sendMessage]);

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

                {/* Purpose: Dynamic hero — uses botName from DB. */}
                <div className="z-10 text-center px-6">
                    <h1 className="text-4xl font-bold tracking-tight text-stone-800 sm:text-5xl">
                        {pricing.botName}
                    </h1>
                    <p className="mt-3 text-lg text-stone-500">
                        AI Booking Assistant
                    </p>
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
                <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[85vh] sm:max-h-[800px] sm:w-[90vw] sm:max-w-[400px] sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-2xl" style={{ height: '100dvh' }}>
                    {/* Header */}
                    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white shadow-md">
                            {pricing.botName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-sm font-semibold text-slate-900 truncate">
                                {pricing.botName}
                            </h1>
                            {/* Purpose: Dynamic subtitle using merchant pricing. */}
                            <p className="text-[11px] text-slate-500 truncate">
                                ${pricing.regularPrice} — AI Booking Assistant
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
                    <div
                        className="flex-1 overflow-y-auto px-3 py-4 space-y-3"
                        onClick={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.tagName === "A" && target.getAttribute("href")?.includes("commitpayapp")) {
                                console.log("[Telemetry] Checkout Initiated:", target.getAttribute("href"));
                            }
                        }}
                    >
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
                                                            {renderMarkdown(line)}
                                                        </span>
                                                    ))}
                                                </span>
                                            ) : (
                                                <span key={i}>{renderMarkdown(p.text)}</span>
                                            ),
                                        )}
                                </div>
                            </div>
                        ))}
                        {isStreaming && messages.at(-1)?.role === "user" && (
                            <TypingIndicator />
                        )}
                        {/* Quick Replies — instant-send OR multi-select chips */}
                        {showQuickReplies && (
                            <div className="flex flex-col gap-1.5 pt-1">
                                {isMultiSelect ? (
                                    <>
                                        {/* Selectable chips */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {activeQuickReplies.map((label: string) => {
                                                const isSelected = selectedChips.includes(label);
                                                return (
                                                    <button
                                                        key={label}
                                                        type="button"
                                                        onClick={() => toggleChip(label)}
                                                        className={`rounded-full px-3 py-1.5 text-[13px] font-medium shadow-sm transition active:scale-[0.97] ${isSelected
                                                            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-500"
                                                            : "bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100"
                                                            }`}
                                                    >
                                                        {isSelected ? "✓ " : ""}{label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {/* Confirm button — only shown when at least one chip selected */}
                                        {selectedChips.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={confirmSelection}
                                                className="mt-1 self-start rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-[13px] font-semibold text-white shadow-md transition hover:from-amber-600 hover:to-orange-600 active:scale-[0.98]"
                                            >
                                                Confirm Selection{selectedChips.length > 1 ? "s" : ""} ({selectedChips.length})
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    /* Instant-send buttons (initial / FOMO intercept) */
                                    activeQuickReplies.map((label: string) => (
                                        <button
                                            key={label}
                                            type="button"
                                            onClick={() => sendMessage({ text: label })}
                                            className="self-start rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-left text-[13px] font-medium text-amber-800 shadow-sm transition hover:bg-amber-100 hover:border-amber-400 active:scale-[0.98]"
                                        >
                                            {label}
                                        </button>
                                    ))
                                )}
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
                            placeholder="Type your message…"
                            aria-label="Type your message"
                            className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-[16px] text-slate-900 placeholder-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                            autoComplete="off"
                        />
                        <button
                            type="submit"
                            disabled={isStreaming}
                            aria-label="Send message"
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

// ---------------------------------------------------------------------------
// Purpose: DynamicChatPage extracts botId from route params (not search params).
// If the fetch fails or returns no config, it short-circuits with a
// "temporarily down" message — NO fake fallback prices are ever shown.
// ---------------------------------------------------------------------------
function DynamicChatInner({ botId }: { botId: string }) {
    const [pricing, setPricing] = useState<{ regularPrice: string; flashOffer: string; botName: string } | null>(null);
    const [configLoaded, setConfigLoaded] = useState(false);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (!botId) {
            // No botId means we cannot load any config — circuit break.
            setIsError(true);
            setConfigLoaded(true);
            return;
        }

        async function fetchPublicConfig() {
            try {
                const res = await fetch(`/api/bots/${botId}/public`);
                const data = await res.json();
                if (data.success && data.config) {
                    const cfg = data.config as PublicBotConfig;
                    if (!cfg.regularPrice || !cfg.flashOffer) {
                        // Incomplete config — circuit break.
                        setIsError(true);
                    } else {
                        setPricing({
                            regularPrice: cfg.regularPrice,
                            flashOffer: cfg.flashOffer,
                            botName: cfg.botName || "Assistant",
                        });
                    }
                } else {
                    // Config not returned — circuit break.
                    setIsError(true);
                }
            } catch (err) {
                console.error("Failed to fetch public bot config:", err);
                setIsError(true);
            } finally {
                setConfigLoaded(true);
            }
        }
        fetchPublicConfig();
    }, [botId]);

    // Purpose: Show a loading state while the config is being fetched.
    if (!configLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-200">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#f48c25] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-400 font-medium">Loading…</p>
                </div>
            </div>
        );
    }

    // Purpose: Circuit breaker — refuse to render the chat if config is missing.
    if (isError || !pricing) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-200">
                <div className="flex flex-col items-center gap-3 text-center px-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-xl">⚠️</div>
                    <p className="text-sm font-medium text-slate-600">Apologies, the bot is temporarily down.</p>
                    <p className="text-xs text-slate-400">Please try again later or contact us directly.</p>
                </div>
            </div>
        );
    }

    // Purpose: ChatWidget only mounts here — AFTER config is confirmed valid.
    return <ChatWidget botId={botId} pricing={pricing} />;
}

// ---------------------------------------------------------------------------
// Purpose: Next.js 15+ async params pattern — unwrap with `use()`.
// No Suspense needed since we do not use useSearchParams.
// ---------------------------------------------------------------------------
export default function DynamicChatPage({ params }: { params: Promise<{ botId: string }> }) {
    const { botId } = use(params);
    return <DynamicChatInner botId={botId} />;
}
