"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthGuard";

// ---------------------------------------------------------------------------
// Purpose: Local BotConfig shape matching packages/types/src/schemas/saas.ts.
// We define it locally to avoid import issues until @repo/types is fully wired.
// ---------------------------------------------------------------------------
interface YouTubeAsset {
    url: string;
    purpose: string;
}

interface BotConfigState {
    botName: string;
    regularPrice: string;
    flashOffer: string;
    checkoutUrl: string;
    coreObjective: string;
    fomoMessage: string;
    guidedFunnel: {
        secureOfferText: string;
        secureOfferVariations: string[];
        commitPayUrl: string;
        questionText: string;
        questionVariations: string[];
        bookLaterText: string;
        bookLaterVariations: string[];
    };
    finalContactQuestion: string;
    appointmentSlots: string[];
    appointmentDays: string[];
    knowledgeBase: {
        websiteUrl: string;
        businessFacts: string;
        youtubeAssets: YouTubeAsset[];
        supportPhone: string;
        supportEmail: string;
    };
    brandSettings: {
        primaryColor: string;
        logoUrl?: string;
        avatarUrl?: string;
    };
}

// Purpose: All 7 days for the toggle buttons.
const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Purpose: Default price values (numeric-only, no $ symbol).
const DEFAULT_REGULAR_PRICE = "28";
const DEFAULT_FLASH_OFFER = "10";

const DEFAULT_CONTACT_QUESTION =
    "Got it! Finally, do you prefer our team to reach out via WhatsApp or a Phone Call, and what time works best for you?";

// Purpose: Default time slot values for the Appointment Scheduling card.
const DEFAULT_SLOTS = ["10am - 12pm", "12pm - 4pm", "4pm - 8pm"];

// Purpose: Default secure offer variations shown in the Guided Funnel section.
const DEFAULT_VARIATIONS = [
    `Secure the $${DEFAULT_FLASH_OFFER} offer now`,
    `Unlock the $${DEFAULT_FLASH_OFFER} trial`,
    `Lock in my $${DEFAULT_FLASH_OFFER} offer`,
    `Grab the $${DEFAULT_FLASH_OFFER} offer now`,
    `Reserve my $${DEFAULT_FLASH_OFFER} trial`,
];

export default function PortalPage({ params }: { params: Promise<{ botId: string }> }) {
    // Purpose: Next.js 15+ — unwrap async params.
    const { botId } = use(params);
    const router = useRouter();
    const { user } = useAuth();

    // Purpose: Master BotConfig state initialised with MVP defaults.
    const [config, setConfig] = useState<BotConfigState>({
        botName: "Melinda",
        regularPrice: DEFAULT_REGULAR_PRICE,
        flashOffer: DEFAULT_FLASH_OFFER,
        checkoutUrl: "",
        coreObjective: "",
        fomoMessage: "",
        guidedFunnel: {
            secureOfferText: `Secure the $${DEFAULT_FLASH_OFFER} offer now`,
            secureOfferVariations: [...DEFAULT_VARIATIONS],
            commitPayUrl: "",
            questionText: "I have a question",
            questionVariations: [],
            bookLaterText: `Leave my details for the $${DEFAULT_REGULAR_PRICE} promo`,
            bookLaterVariations: [],
        },
        finalContactQuestion: DEFAULT_CONTACT_QUESTION,
        appointmentSlots: ["10am - 12pm", "12pm - 4pm", "4pm - 8pm"],
        appointmentDays: [...ALL_DAYS],
        knowledgeBase: {
            websiteUrl: "",
            businessFacts: "",
            youtubeAssets: [{ url: "", purpose: "" }],
            supportPhone: "",
            supportEmail: "",
        },
        brandSettings: {
            primaryColor: "#F48C25",
        },
    });

    // Purpose: Load existing bot configuration for this botId.
    useEffect(() => {
        if (!user) return;
        async function loadConfig() {
            try {
                const token = await user!.getIdToken();
                const res = await fetch(`/api/bots?botId=${encodeURIComponent(botId)}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success && data.config) {
                    // Purpose: Deep-merge nested objects to prevent legacy Firestore
                    // docs (with missing sub-fields) from clobbering default arrays.
                    setConfig((prev) => ({
                        ...prev,
                        ...data.config,
                        guidedFunnel: {
                            ...prev.guidedFunnel,
                            ...(data.config.guidedFunnel || {}),
                        },
                        knowledgeBase: {
                            ...prev.knowledgeBase,
                            ...(data.config.knowledgeBase || {}),
                            youtubeAssets: data.config.knowledgeBase?.youtubeAssets ?? prev.knowledgeBase.youtubeAssets,
                        },
                        brandSettings: {
                            ...prev.brandSettings,
                            ...(data.config.brandSettings || {}),
                        },
                    }));
                }
            } catch (err) {
                console.error("Failed to load bot config:", err);
            }
        }
        loadConfig();
    }, [botId, user]);

    const [isSaving, setIsSaving] = useState(false);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
    const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    // Purpose: Warn user before leaving if there are unsaved changes.
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
            }
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [isDirty]);

    // -----------------------------------------------------------------------
    // Purpose: Helpers for nested state updates without direct mutation.
    // -----------------------------------------------------------------------

    function updateField<K extends keyof BotConfigState>(key: K, value: BotConfigState[K]) {
        setConfig((prev) => ({ ...prev, [key]: value }));
        setIsDirty(true);
    }

    function updateGuidedFunnel<K extends keyof BotConfigState["guidedFunnel"]>(
        key: K,
        value: BotConfigState["guidedFunnel"][K],
    ) {
        setConfig((prev) => ({
            ...prev,
            guidedFunnel: { ...prev.guidedFunnel, [key]: value },
        }));
    }

    function updateKnowledgeBase<K extends keyof BotConfigState["knowledgeBase"]>(
        key: K,
        value: BotConfigState["knowledgeBase"][K],
    ) {
        setConfig((prev) => ({
            ...prev,
            knowledgeBase: { ...prev.knowledgeBase, [key]: value },
        }));
    }

    function updateBrandSettings<K extends keyof BotConfigState["brandSettings"]>(
        key: K,
        value: BotConfigState["brandSettings"][K],
    ) {
        setConfig((prev) => ({
            ...prev,
            brandSettings: { ...prev.brandSettings, [key]: value },
        }));
    }

    // Purpose: Toggle a day in/out of the appointmentDays array.
    function toggleDay(day: string) {
        setConfig((prev) => ({
            ...prev,
            appointmentDays: prev.appointmentDays.includes(day)
                ? prev.appointmentDays.filter((d) => d !== day)
                : [...prev.appointmentDays, day],
        }));
    }

    // Purpose: Update a specific appointment slot by index.
    function updateSlot(index: number, value: string) {
        setConfig((prev) => ({
            ...prev,
            appointmentSlots: prev.appointmentSlots.map((s, i) => (i === index ? value : s)),
        }));
    }

    // Purpose: Update a specific YouTube asset field by index.
    function updateYouTubeAsset(index: number, field: keyof YouTubeAsset, value: string) {
        setConfig((prev) => ({
            ...prev,
            knowledgeBase: {
                ...prev.knowledgeBase,
                youtubeAssets: prev.knowledgeBase.youtubeAssets.map((a, i) =>
                    i === index ? { ...a, [field]: value } : a,
                ),
            },
        }));
    }

    // Purpose: Add a new empty YouTube asset row.
    function addYouTubeAsset() {
        setConfig((prev) => ({
            ...prev,
            knowledgeBase: {
                ...prev.knowledgeBase,
                youtubeAssets: [...prev.knowledgeBase.youtubeAssets, { url: "", purpose: "" }],
            },
        }));
    }

    // Purpose: Remove a YouTube asset row by index.
    function removeYouTubeAsset(index: number) {
        setConfig((prev) => ({
            ...prev,
            knowledgeBase: {
                ...prev.knowledgeBase,
                youtubeAssets: prev.knowledgeBase.youtubeAssets.filter((_, i) => i !== index),
            },
        }));
    }

    // Purpose: Toggle a variation checkbox in/out of a named variations array.
    function toggleVariation(key: "secureOfferVariations" | "questionVariations" | "bookLaterVariations", variation: string) {
        setConfig((prev) => {
            const current = prev.guidedFunnel[key];
            const updated = current.includes(variation)
                ? current.filter((v) => v !== variation)
                : [...current, variation];
            return {
                ...prev,
                guidedFunnel: { ...prev.guidedFunnel, [key]: updated },
            };
        });
    }

    // Purpose: Call /api/generate to get LLM-powered button-text variations.
    async function handleGenerate(
        context: "secure_offer" | "question" | "book_later",
        currentText: string,
        variationsKey: "secureOfferVariations" | "questionVariations" | "bookLaterVariations",
    ) {
        setIsGenerating((prev) => ({ ...prev, [context]: true }));
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    context,
                    currentText,
                    flashOffer: config.flashOffer,
                    regularPrice: config.regularPrice,
                }),
            });
            const data = await res.json();
            if (data.variations && Array.isArray(data.variations)) {
                updateGuidedFunnel(variationsKey, data.variations);
            }
        } catch (err) {
            console.error("Generate variations failed:", err);
        } finally {
            setIsGenerating((prev) => ({ ...prev, [context]: false }));
        }
    }

    // -----------------------------------------------------------------------
    // Purpose: Compute FOMO message reactively from flashOffer & regularPrice.
    // -----------------------------------------------------------------------
    const computedFomo = `The $${config.flashOffer || '[Flash Price]'} is only available if secured online now. If you leave your details for later, it reverts to the $${config.regularPrice || '[Regular Price]'} regular price. Would you like me to help you secure the $${config.flashOffer || '[Flash Price]'} offer now?`;

    useEffect(() => {
        setConfig((prev) => ({ ...prev, fomoMessage: computedFomo }));
    }, [computedFomo]);

    // Purpose: Sync secureOfferText with flashOffer changes.
    useEffect(() => {
        setConfig((prev) => ({
            ...prev,
            guidedFunnel: {
                ...prev.guidedFunnel,
                secureOfferText: `Secure the $${config.flashOffer || '[Flash Price]'} offer now`,
            },
        }));
    }, [config.flashOffer]);

    // Purpose: Sync bookLaterText with regularPrice changes.
    useEffect(() => {
        setConfig((prev) => ({
            ...prev,
            guidedFunnel: {
                ...prev.guidedFunnel,
                bookLaterText: `Leave my details for the $${config.regularPrice || '[Regular Price]'} promo`,
            },
        }));
    }, [config.regularPrice]);

    // -----------------------------------------------------------------------
    // Purpose: Validate required fields before allowing database mutation.
    // -----------------------------------------------------------------------
    async function handleSave(): Promise<boolean> {
        const missing: string[] = [];
        if (!config.botName.trim()) missing.push("Bot Name");
        if (!config.regularPrice.trim()) missing.push("Regular Price");
        if (!config.flashOffer.trim()) missing.push("Flash Offer");
        if (!config.knowledgeBase.websiteUrl.trim()) missing.push("Client Website URL");
        if (!config.knowledgeBase.supportEmail.trim()) missing.push("Support Email");
        if (missing.length > 0) {
            setMissingFields(missing);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return false;
        }
        setMissingFields([]);
        setIsSaving(true);
        try {
            if (!user) {
                console.error("[handleSave] No authenticated user.");
                router.push("/login");
                return false;
            }
            const token = await user.getIdToken();
            const payload = { ...config, id: botId };
            console.log("[handleSave] Sending payload to DB:", payload);
            const res = await fetch("/api/bots", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                console.error("[handleSave] API error:", data.message);
                return false;
            }
            console.log("[handleSave] Saved successfully:", data);
            setIsDirty(false);
            return true;
        } catch (err) {
            console.error("Save failed:", err);
            return false;
        } finally {
            setIsSaving(false);
        }
    }

    // Purpose: Save config then route back to dashboard.
    async function handleSaveAndClose() {
        const success = await handleSave();
        if (success) {
            router.push("/dashboard");
        }
    }

    // Purpose: Save then route to dashboard ("Create Bot" finalises the config).
    async function handleCreateBot() {
        const success = await handleSave();
        if (success) {
            router.push("/dashboard");
        }
    }

    // Purpose: Save inline and show success toast — do NOT route away.
    async function handleSaveInline() {
        const success = await handleSave();
        setSaveStatus(success ? "success" : "error");
        setTimeout(() => setSaveStatus(null), 3000);
    }

    // -----------------------------------------------------------------------
    // Purpose: Shared Tailwind class tokens to keep JSX DRY.
    // -----------------------------------------------------------------------
    const inputCls =
        "w-full rounded-lg border-zinc-200 bg-zinc-50 focus:ring-violet-500 focus:border-violet-500 text-sm p-3";
    const inputSmCls =
        "w-full rounded-lg border-zinc-200 bg-zinc-50 focus:ring-violet-500 focus:border-violet-500 text-sm p-2.5";
    const labelCls = "block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1";
    const sectionCls =
        "bg-white border border-zinc-200 rounded-xl p-5 shadow-sm";
    const iconCls = "material-symbols-outlined text-violet-600";

    return (
        <>
            {/* Header — sticky with frosted glass. Error banner is INSIDE
                to prevent a sibling element from breaking sticky positioning. */}
            <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-zinc-200 shadow-sm">
                {/* Purpose: Validation error banner — rendered inside the sticky header
                    so it scrolls away WITH the header instead of breaking sticky context. */}
                {missingFields.length > 0 && (
                    <div className="bg-red-50 text-red-600 border-b border-red-200 text-[10px] px-4 py-2">
                        ⚠️ Please complete all required fields. Missing: {missingFields.join(", ")}.
                    </div>
                )}
                <div className="max-w-xl mx-auto flex items-center justify-between gap-4 flex-col sm:flex-row px-4 py-4">
                    <Link href="/dashboard" className="flex items-center gap-3 shrink-0 hover:opacity-80 transition-opacity">
                        <div className="bg-violet-600 p-1.5 rounded-lg">
                            <span className="material-symbols-outlined text-white text-xl">bolt</span>
                        </div>
                        <h1 className="text-lg font-bold tracking-tight truncate">CommitPay AI</h1>
                    </Link>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                        <button
                            type="button"
                            onClick={handleSaveAndClose}
                            disabled={isSaving}
                            className="border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 px-3 py-2 h-10 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-sm">save</span>
                            {isSaving ? "Saving…" : "Save & Exit"}
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveInline}
                            disabled={isSaving}
                            className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 h-10 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-sm">rocket_launch</span>
                            {isSaving ? "Saving…" : "Save & Deploy"}
                        </button>
                    </div>
                </div>
            </header>

            {/* Purpose: Auto-dismissing success/error toast. */}
            {saveStatus && (
                <div className={`max-w-xl mx-auto mt-2 px-4`}>
                    <div className={`rounded-lg px-4 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-sm ${
                        saveStatus === "success"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-600 border border-red-200"
                    }`}>
                        <span className="material-symbols-outlined text-sm">
                            {saveStatus === "success" ? "check_circle" : "error"}
                        </span>
                        {saveStatus === "success" ? "Bot config saved successfully." : "Save failed. Check console for details."}
                    </div>
                </div>
            )}

            <main className="max-w-xl mx-auto px-4 py-6 space-y-6 overflow-x-hidden pb-24">
                {/* ============================================================
                    Section 1: Core Offer & Identity
                ============================================================ */}
                <section className={sectionCls}>
                    <div className="flex items-center gap-2 mb-4">
                        <span className={iconCls}>person_search</span>
                        <h2 className="text-base font-bold">Core Offer &amp; Identity</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className={labelCls}>Bot Name</label>
                            <input
                                className={inputCls}
                                type="text"
                                value={config.botName}
                                onChange={(e) => updateField("botName", e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Regular Price</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium pointer-events-none">$</span>
                                    <input
                                        className={`${inputCls} pl-7`}
                                        type="text"
                                        value={config.regularPrice}
                                        onChange={(e) => updateField("regularPrice", e.target.value.replace(/\$/g, ""))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Flash Offer</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-600 text-sm font-bold pointer-events-none">$</span>
                                    <input
                                        className={`${inputCls} pl-7 text-violet-600 font-bold`}
                                        type="text"
                                        value={config.flashOffer}
                                        onChange={(e) => updateField("flashOffer", e.target.value.replace(/\$/g, ""))}
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Core Objective</label>
                            <textarea
                                className={`${inputCls} h-24`}
                                placeholder="e.g. Convert new customers for our signature treatment"
                                value={config.coreObjective}
                                onChange={(e) => updateField("coreObjective", e.target.value)}
                            />
                            <p className="mt-2 text-[10px] text-zinc-400 italic">
                                Note: The bot is already programmed to automatically extract Name and Phone Number for the payment link.
                            </p>
                        </div>
                        {/* CommitPay Checkout Link */}
                        <div>
                            <label className={labelCls}>CommitPay Checkout Link <span className="text-zinc-300 font-normal normal-case">~Optional</span></label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">shopping_cart_checkout</span>
                                <input
                                    className={`${inputCls} pl-9`}
                                    type="url"
                                    placeholder="https://pay.commitpay.com/checkout/..."
                                    value={config.checkoutUrl}
                                    onChange={(e) => updateField("checkoutUrl", e.target.value)}
                                />
                            </div>
                            <p className="mt-1 text-[10px] text-zinc-400 italic">
                                Paste your external checkout gateway URL. The bot will auto-append tracking params (<code className="text-zinc-500">?ref=salesbot&amp;botId=…</code>).
                            </p>
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    Section 2: Conversion Psychology
                ============================================================ */}
                <section className={sectionCls}>
                    <div className="flex items-center gap-2 mb-4">
                        <span className={iconCls}>psychology</span>
                        <h2 className="text-base font-bold">Conversion Psychology</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className={labelCls}>The FOMO Message (Fear Of Missing Out)</label>
                            <button
                                type="button"
                                onClick={() => {
                                    updateField("regularPrice", DEFAULT_REGULAR_PRICE);
                                    updateField("flashOffer", DEFAULT_FLASH_OFFER);
                                }}
                                className="text-[10px] text-violet-600 flex items-center gap-0.5 mt-0.5 hover:underline font-semibold"
                            >
                                <span className="material-symbols-outlined text-[12px]">refresh</span> Restore recommended prices
                            </button>
                            <textarea
                                className={`${inputCls} h-28 bg-zinc-100 cursor-not-allowed`}
                                value={computedFomo}
                                readOnly
                            />
                            <p className="mt-2 text-[10px] text-zinc-400 italic">
                                This message updates automatically when you change the prices above.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    Section 3: The Guided Funnel
                ============================================================ */}
                <section className={sectionCls}>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={iconCls}>account_tree</span>
                        <h2 className="text-base font-bold">The Guided Funnel</h2>
                    </div>
                    <p className="text-xs text-zinc-500 mb-4">Define the three initial options presented to the user.</p>
                    <div className="space-y-3">
                        {/* Funnel Option 01 — Secure Offer */}
                        <div className="flex items-start gap-3">
                            <span className="text-xs font-bold text-zinc-400 w-6 mt-3">01</span>
                            <div className="flex-1 space-y-2">
                                <div className="flex gap-2 mb-2">
                                    <input
                                        className="flex-1 rounded-lg border-zinc-200 bg-zinc-100 focus:ring-violet-500 focus:border-violet-500 text-sm p-2.5 min-w-0 cursor-not-allowed"
                                        type="text"
                                        value={config.guidedFunnel.secureOfferText}
                                        readOnly
                                    />
                                    <button
                                        type="button"
                                        disabled={isGenerating.secure_offer}
                                        onClick={() => handleGenerate("secure_offer", config.guidedFunnel.secureOfferText, "secureOfferVariations")}
                                        className="flex items-center justify-center gap-1 bg-violet-100 text-violet-600 hover:bg-violet-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors shrink-0 disabled:opacity-50 disabled:cursor-wait"
                                    >
                                        <span className={`material-symbols-outlined text-sm ${isGenerating.secure_offer ? 'animate-spin' : ''}`}>{isGenerating.secure_offer ? 'progress_activity' : 'auto_awesome'}</span>
                                        {isGenerating.secure_offer ? 'Generating…' : 'Generate'}
                                    </button>
                                </div>
                                {/* Suggested Variations */}
                                {(config.guidedFunnel.secureOfferVariations?.length ?? 0) > 0 && (
                                <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 mb-2">
                                    <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-2">Suggested Variations</p>
                                    <div className="space-y-1.5">
                                        {(config.guidedFunnel.secureOfferVariations ?? []).map((v) => (
                                            <div key={v} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={(config.guidedFunnel.secureOfferVariations ?? []).includes(v)}
                                                    onChange={() => toggleVariation("secureOfferVariations", v)}
                                                    className="w-3.5 h-3.5 rounded text-violet-500 border-violet-300 focus:ring-violet-500"
                                                />
                                                <span className="text-xs text-violet-800">{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                )}
                                <label className="block text-[10px] font-medium text-zinc-400 italic mb-2">
                                    This text updates automatically when you change the Flash Offer price.
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">link</span>
                                    <input
                                        className="w-full rounded-lg border-zinc-200 bg-zinc-50 focus:ring-violet-500 focus:border-violet-500 text-sm p-2.5 pl-9"
                                        type="url"
                                        placeholder="CommitPayApp Payment URL"
                                        value={config.guidedFunnel.commitPayUrl}
                                        onChange={(e) => updateGuidedFunnel("commitPayUrl", e.target.value)}
                                    />
                                    <p className="mt-1 text-[10px] font-bold text-red-500">⚠️ Required to activate payment.</p>
                                </div>
                            </div>
                        </div>

                        {/* Funnel Option 02 — Question */}
                        <div className="flex items-start gap-3">
                            <span className="text-xs font-bold text-zinc-400 w-6 mt-3">02</span>
                            <div className="flex-1 space-y-2">
                                <div className="flex gap-2 mb-2">
                                    <input
                                        className={`${inputSmCls} flex-1 min-w-0`}
                                        type="text"
                                        placeholder="I have a question"
                                        value={config.guidedFunnel.questionText}
                                        onChange={(e) => updateGuidedFunnel("questionText", e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        disabled={isGenerating.question}
                                        onClick={() => handleGenerate("question", config.guidedFunnel.questionText, "questionVariations")}
                                        className="flex items-center justify-center gap-1 bg-violet-100 text-violet-600 hover:bg-violet-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors shrink-0 disabled:opacity-50 disabled:cursor-wait"
                                    >
                                        <span className={`material-symbols-outlined text-sm ${isGenerating.question ? 'animate-spin' : ''}`}>{isGenerating.question ? 'progress_activity' : 'auto_awesome'}</span>
                                        {isGenerating.question ? 'Generating…' : 'Generate'}
                                    </button>
                                </div>
                                {(config.guidedFunnel.questionVariations?.length ?? 0) > 0 && (
                                <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 mb-2">
                                    <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-2">Suggested Variations</p>
                                    <div className="space-y-1.5">
                                        {(config.guidedFunnel.questionVariations ?? []).map((v) => (
                                            <div key={v} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={(config.guidedFunnel.questionVariations ?? []).includes(v)}
                                                    onChange={() => toggleVariation("questionVariations", v)}
                                                    className="w-3.5 h-3.5 rounded text-violet-500 border-violet-300 focus:ring-violet-500"
                                                />
                                                <span className="text-xs text-violet-800">{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                )}
                                <label className="block text-[10px] font-medium text-zinc-400 italic">Example: I have a question</label>
                            </div>
                        </div>

                        {/* Funnel Option 03 — Book Later */}
                        <div className="flex items-start gap-3">
                            <span className="text-xs font-bold text-zinc-400 w-6 mt-3">03</span>
                            <div className="flex-1 space-y-2">
                                <div className="flex gap-2 mb-2">
                                    <input
                                        className="flex-1 rounded-lg border-zinc-200 bg-zinc-100 focus:ring-violet-500 focus:border-violet-500 text-sm p-2.5 min-w-0 cursor-not-allowed"
                                        type="text"
                                        value={config.guidedFunnel.bookLaterText}
                                        readOnly
                                    />
                                    <button
                                        type="button"
                                        disabled={isGenerating.book_later}
                                        onClick={() => handleGenerate("book_later", config.guidedFunnel.bookLaterText, "bookLaterVariations")}
                                        className="flex items-center justify-center gap-1 bg-violet-100 text-violet-600 hover:bg-violet-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors shrink-0 disabled:opacity-50 disabled:cursor-wait"
                                    >
                                        <span className={`material-symbols-outlined text-sm ${isGenerating.book_later ? 'animate-spin' : ''}`}>{isGenerating.book_later ? 'progress_activity' : 'auto_awesome'}</span>
                                        {isGenerating.book_later ? 'Generating…' : 'Generate'}
                                    </button>
                                </div>
                                {(config.guidedFunnel.bookLaterVariations?.length ?? 0) > 0 && (
                                <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 mb-2">
                                    <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-2">Suggested Variations</p>
                                    <div className="space-y-1.5">
                                        {(config.guidedFunnel.bookLaterVariations ?? []).map((v) => (
                                            <div key={v} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={(config.guidedFunnel.bookLaterVariations ?? []).includes(v)}
                                                    onChange={() => toggleVariation("bookLaterVariations", v)}
                                                    className="w-3.5 h-3.5 rounded text-violet-500 border-violet-300 focus:ring-violet-500"
                                                />
                                                <span className="text-xs text-violet-800">{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                )}
                                <label className="block text-[10px] font-medium text-zinc-400 italic">This text updates automatically when you change the Regular Price.</label>
                            </div>
                        </div>

                        {/* Final Contact Question */}
                        <div className="mt-6 pt-6 border-t border-zinc-100">
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Final Contact Question</label>
                            <button
                                type="button"
                                onClick={() => updateField("finalContactQuestion", DEFAULT_CONTACT_QUESTION)}
                                className="text-[10px] text-violet-600 flex items-center gap-0.5 mt-0.5 hover:underline font-semibold"
                            >
                                <span className="material-symbols-outlined text-[12px]">refresh</span> Restore recommended
                            </button>
                            <div className="flex flex-col">
                                <textarea
                                    className={`${inputCls} h-20`}
                                    value={config.finalContactQuestion}
                                    onChange={(e) => updateField("finalContactQuestion", e.target.value)}
                                />
                                <p className="mt-2 text-[10px] text-zinc-400 italic">
                                    This is the final message the AI sends to close the lead after collecting their appointment details.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    Section 4: Appointment Scheduling
                ============================================================ */}
                <section className={sectionCls}>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={iconCls}>calendar_month</span>
                        <h2 className="text-base font-bold">Appointment Scheduling</h2>
                    </div>
                    <p className="text-xs text-zinc-500 mb-4">
                        Define the three preferred time slots the AI will offer customers before generating the checkout link.
                    </p>

                    {/* Available Days Toggle */}
                    <div className="space-y-3 mb-6">
                        <label className={labelCls}>Available Days</label>
                        <p className="text-[10px] text-zinc-400 italic mb-2">
                            By Default, All 7 Days will be offered to the User. Unselect the Days that you do not want to offer.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {ALL_DAYS.map((day) => {
                                const isActive = config.appointmentDays.includes(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        className={`relative font-medium px-3 py-1.5 rounded-lg text-sm transition-all shadow-sm ${isActive
                                            ? "bg-violet-600 text-white"
                                            : "bg-zinc-100 text-zinc-400 line-through"
                                            }`}
                                    >
                                        {day}
                                        {!isActive && (
                                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <span className="block w-[1px] h-full bg-zinc-300 rotate-45 absolute" />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-zinc-400 italic">Unselected days will not be offered by the AI.</p>
                    </div>

                    {/* Time Slots */}
                    <div className="space-y-4">
                        {config.appointmentSlots.map((slot, i) => (
                            <div key={i}>
                                <label className={labelCls}>Time Slot {i + 1}</label>
                                <input
                                    className={inputSmCls}
                                    type="text"
                                    value={slot}
                                    onChange={(e) => updateSlot(i, e.target.value)}
                                />
                                {slot !== DEFAULT_SLOTS[i] && (
                                    <button
                                        type="button"
                                        onClick={() => updateSlot(i, DEFAULT_SLOTS[i] || "")}
                                        className="text-[10px] text-violet-600 flex items-center gap-0.5 mt-1 hover:underline font-semibold"
                                    >
                                        <span className="material-symbols-outlined text-[12px]">refresh</span> Restore recommended
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* ============================================================
                    Section 5: Knowledge Base
                ============================================================ */}
                <section className={sectionCls}>
                    <div className="flex items-center gap-2 mb-4">
                        <span className={iconCls}>library_books</span>
                        <h2 className="text-base font-bold">Knowledge Base</h2>
                    </div>
                    <div className="space-y-6">
                        {/* Client Website URL — Required */}
                        <div>
                            <label className={labelCls}>
                                Client Website or Social Media Link
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">link</span>
                                <input
                                    className={`${inputCls} pl-9`}
                                    type="url"
                                    placeholder="https://www.example.com"
                                    value={config.knowledgeBase.websiteUrl}
                                    onChange={(e) => updateKnowledgeBase("websiteUrl", e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Training Documents — static placeholder */}
                        <div className="space-y-3">
                            <label className={labelCls}>Training Documents (PDF, DOCX, TXT) <span className="text-zinc-300 font-normal normal-case">~Optional</span></label>
                            <div className="border-2 border-dashed border-zinc-200 rounded-xl p-8 flex flex-col items-center justify-center gap-2 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer">
                                <span className="material-symbols-outlined text-zinc-400 text-3xl">cloud_upload</span>
                                <div className="text-center">
                                    <p className="text-sm text-zinc-600 font-medium">Click to browse or drag and drop files</p>
                                    <p className="text-[10px] text-zinc-400 mt-1">Maximum 5 files. Up to 10MB each.</p>
                                </div>
                            </div>
                        </div>

                        {/* Business Facts */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Business Facts &amp; FAQs <span className="text-zinc-300 font-normal normal-case">~Optional</span></label>
                            <textarea
                                className={`${inputCls} h-28`}
                                placeholder="Paste company documentation, pricing nuances, or common rebuttals here..."
                                value={config.knowledgeBase.businessFacts || ""}
                                onChange={(e) => updateKnowledgeBase("businessFacts", e.target.value)}
                            />
                        </div>

                        {/* YouTube Asset Links */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">YouTube Asset Links <span className="text-zinc-300 font-normal normal-case">~Optional</span></label>
                            <div className="space-y-3">
                                {(config.knowledgeBase.youtubeAssets ?? []).map((asset, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <input
                                            className="flex-1 rounded-lg border-zinc-200 bg-zinc-50 text-sm p-2.5"
                                            type="url"
                                            placeholder="YouTube URL"
                                            value={asset.url}
                                            onChange={(e) => updateYouTubeAsset(i, "url", e.target.value)}
                                        />
                                        <input
                                            className="flex-1 rounded-lg border-zinc-200 bg-zinc-50 text-sm p-2.5"
                                            type="text"
                                            placeholder="Video Purpose / Context"
                                            value={asset.purpose}
                                            onChange={(e) => updateYouTubeAsset(i, "purpose", e.target.value)}
                                        />
                                        {(config.knowledgeBase.youtubeAssets?.length ?? 0) > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeYouTubeAsset(i)}
                                                className="text-zinc-400 hover:text-red-500 transition-colors mt-2"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addYouTubeAsset}
                                    className="text-xs font-bold text-violet-600 flex items-center gap-1 hover:underline"
                                >
                                    + Add another YouTube link
                                </button>
                            </div>
                        </div>

                        {/* Human Escalation Routing */}
                        <div className="border-t border-zinc-100 pt-6">
                            <p className="text-xs font-bold text-zinc-600 uppercase mb-4">Human Escalation Routing</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Support Phone Number <span className="text-zinc-300 font-normal normal-case">~Optional</span></label>
                                    <input
                                        className={inputSmCls}
                                        type="tel"
                                        placeholder="+65 0000-0000"
                                        value={config.knowledgeBase.supportPhone}
                                        onChange={(e) => updateKnowledgeBase("supportPhone", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Support Email <span className="text-red-500">*</span></label>
                                    <input
                                        className={inputSmCls}
                                        type="email"
                                        placeholder="support@company.com"
                                        value={config.knowledgeBase.supportEmail}
                                        onChange={(e) => updateKnowledgeBase("supportEmail", e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    Section 6: Brand Settings
                ============================================================ */}
                <section className={sectionCls}>
                    <div className="flex items-center gap-2 mb-4">
                        <span className={iconCls}>palette</span>
                        <h2 className="text-base font-bold">Brand Settings</h2>
                    </div>
                    <div className="space-y-4">
                        {/* Bot Avatar */}
                        <div className="mb-6">
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Bot Avatar / Profile Picture</label>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center border-2 border-zinc-200">
                                    <span className="material-symbols-outlined text-zinc-400 text-3xl">face</span>
                                </div>
                                <button type="button" className="text-xs bg-white border border-zinc-200 px-3 py-2 rounded-lg font-semibold hover:bg-zinc-50 transition-colors shadow-sm">
                                    Upload Custom Avatar
                                </button>
                            </div>
                        </div>

                        {/* Company Logo */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Company Logo</label>
                            <div className="border-2 border-dashed border-zinc-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer">
                                <span className="material-symbols-outlined text-zinc-400 text-3xl">upload_file</span>
                                <span className="text-xs text-zinc-500 font-medium">Click or drag to upload logo</span>
                            </div>
                        </div>

                        {/* Primary Brand Color */}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Primary Brand Color</label>
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-10 h-10 rounded-lg border border-zinc-200 shrink-0"
                                    style={{ backgroundColor: config.brandSettings.primaryColor }}
                                />
                                <input
                                    className="flex-1 rounded-lg border-zinc-200 bg-zinc-50 focus:ring-violet-500 focus:border-violet-500 text-sm p-2.5 font-mono uppercase"
                                    type="text"
                                    value={config.brandSettings.primaryColor}
                                    onChange={(e) => updateBrandSettings("primaryColor", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    Section 7: The Engine Room (Locked)
                ============================================================ */}
                <section className="bg-zinc-100 border border-zinc-200 rounded-xl p-5 shadow-inner relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-zinc-400">
                        <span className="material-symbols-outlined">lock</span>
                    </div>
                    <div className="flex items-center gap-2 mb-4 opacity-60">
                        <span className="material-symbols-outlined">settings_input_component</span>
                        <div className="group relative cursor-help">
                            <h2 className="text-base font-bold">The Engine Room</h2>
                            <div className="hidden group-hover:block absolute top-full left-0 mt-2 p-2 bg-zinc-800 text-white text-[10px] rounded shadow-lg z-50 w-48">
                                These protocols are set by CommitPay to maximize your conversions
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-white/50 p-3 rounded-lg border border-zinc-200">
                            <p className="text-xs font-bold text-zinc-600 uppercase mb-3">Proprietary Sales Architecture</p>
                            <ul className="space-y-2.5">
                                <li className="flex items-center gap-2 text-sm text-zinc-500">
                                    <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                    The Telemarketing Playbook
                                </li>
                                <li className="flex items-center gap-2 text-sm text-zinc-500">
                                    <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                    The Brevity Protocol (2-sentence max)
                                </li>
                                <li className="flex items-center gap-2 text-sm text-zinc-500">
                                    <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                    De-Escalation &amp; Empathy Routing
                                </li>
                                <li className="flex items-center gap-2 text-sm text-zinc-500">
                                    <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                    8-Turn Hard Stop to Stripe Link
                                </li>
                            </ul>
                        </div>
                        <p className="text-[11px] text-zinc-400 italic">
                            These core conversion protocols are locked by the system architect to guarantee maximum lead conversion.
                        </p>
                    </div>
                </section>

                {/* ============================================================
                    Section 8: Distribution
                ============================================================ */}
                <section className={sectionCls}>
                    <div className="flex items-center gap-2 mb-4">
                        <span className={iconCls}>code</span>
                        <h2 className="text-base font-bold">Distribution</h2>
                    </div>
                    <p className="text-xs text-zinc-500 mb-3">
                        Copy &amp; paste this snippet into your website&apos;s HTML to embed the chat widget.
                    </p>
                    <textarea
                        readOnly
                        className="w-full rounded-lg border-zinc-200 bg-zinc-50 text-xs font-mono p-3 h-20 text-zinc-700"
                        value={`<script src="https://salesbotmvp.vercel.app/embed.js" data-bot-id="${botId}" defer></script>`}
                    />
                    <button
                        type="button"
                        onClick={() => {
                            navigator.clipboard.writeText(
                                `<script src="https://salesbotmvp.vercel.app/embed.js" data-bot-id="${botId}" defer></script>`,
                            );
                        }}
                        className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:underline"
                    >
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                        Copy to Clipboard
                    </button>
                    <p className="mt-2 text-[10px] text-zinc-400 italic">
                        Replace YOUR_BOT_ID with the ID returned after saving your bot configuration.
                    </p>
                </section>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-6 py-3">
                <div className="max-w-xl mx-auto flex justify-between items-center">
                    <a className="flex flex-col items-center gap-1 text-zinc-400" href="#">
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-[10px] font-medium uppercase tracking-tighter">Overview</span>
                    </a>
                    <a className="flex flex-col items-center gap-1 text-violet-600" href="#">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>memory</span>
                        <span className="text-[10px] font-medium uppercase tracking-tighter">Engine</span>
                    </a>
                    <a className="flex flex-col items-center gap-1 text-zinc-400" href="#">
                        <span className="material-symbols-outlined">view_list</span>
                        <span className="text-[10px] font-medium uppercase tracking-tighter">CRM/LEADS</span>
                    </a>
                    <a className="flex flex-col items-center gap-1 text-zinc-400" href="#">
                        <span className="material-symbols-outlined">settings</span>
                        <span className="text-[10px] font-medium uppercase tracking-tighter">Config</span>
                    </a>
                </div>
            </nav>
        </>
    );
}
