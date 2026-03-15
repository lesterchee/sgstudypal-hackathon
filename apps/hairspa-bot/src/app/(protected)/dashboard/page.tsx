"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthGuard";
import { getClientDb } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
    Plus,
    Cpu,
    MessageSquare,
    Grid3x3,
    TrendingUp,
    Eye,
    Pencil,
    Contact,
    Trash2,
    Loader2,
    Bot,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Purpose: Local BotConfig shape for the dashboard grid cards.
// ---------------------------------------------------------------------------
interface BotSummary {
    id: string;
    botName: string;
    coreObjective: string;
    regularPrice: string;
    flashOffer: string;
    createdAt?: number;
}

// Purpose: Default price constants — single source of truth for new bot creation.
const RP = "28"; // Regular Price
const FO = "10"; // Flash Offer

// Purpose: Default config for new bots — matches current portal schema.
// All pricing text is dynamically interpolated from RP/FO above.
// NOTE: fomoMessage is intentionally EXCLUDED — it is dynamically assembled
// at render-time (portal) and prompt-generation time (promptBuilder.ts).
const DEFAULT_BOT_CONFIG = {
    botName: "New Bot",
    regularPrice: RP,
    flashOffer: FO,
    coreObjective: "",
    guidedFunnel: {
        secureOfferText: `Secure the $${FO} offer now`,
        secureOfferVariations: [
            `Secure the $${FO} offer now`,
            `Unlock the $${FO} trial`,
            `Lock in my $${FO} offer`,
            `Grab the $${FO} offer now`,
            `Reserve my $${FO} trial`,
        ],
        commitPayUrl: "",
        questionText: "I have a question",
        questionVariations: [],
        bookLaterText: `Leave my details for the $${RP} promo`,
        bookLaterVariations: [],
    },
    finalContactQuestion:
        "Got it! Finally, do you prefer our team to reach out via WhatsApp or a Phone Call, and what time works best for you?",
    appointmentSlots: ["10am - 12pm", "12pm - 4pm", "4pm - 8pm"],
    appointmentDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
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
};

// ---------------------------------------------------------------------------
// PURPOSE: Quick-stat card — reusable within this page.
// ---------------------------------------------------------------------------
function StatCard({
    label,
    value,
    badge,
    icon: Icon,
    iconBg,
    iconColor,
}: {
    label: string;
    value: string | number;
    badge?: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    iconBg: string;
    iconColor: string;
}) {
    return (
        <div className="bg-white p-5 border border-zinc-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    {label}
                </span>
                <div className={`p-2 rounded-md ${iconBg}`}>
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
            </div>
            <div className="mt-3 flex items-baseline">
                <span className="text-3xl font-bold text-zinc-900">
                    {value}
                </span>
                {badge && (
                    <span className="ml-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {badge}
                    </span>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// PURPOSE: Main dashboard page — Quick Stats + Bot Grid + Activity Feed
// ---------------------------------------------------------------------------
export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [bots, setBots] = useState<BotSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const displayName =
        user?.displayName || user?.email?.split("@")[0] || "User";

    // Purpose: Fetch only the bots belonging to the logged-in user.
    useEffect(() => {
        if (!user) return;

        async function fetchBots() {
            try {
                const db = getClientDb();
                const q = query(
                    collection(db, "bots"),
                    where("orgId", "==", user!.uid),
                );
                const snapshot = await getDocs(q);
                const results: BotSummary[] = snapshot.docs
                    .filter((d) => !d.data().deletedAt) // Exclude soft-deleted bots
                    .map((d) => ({
                        id: d.id,
                        ...(d.data() as Omit<BotSummary, "id">),
                    }));
                setBots(results);
            } catch (err) {
                console.error("Failed to fetch bots:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchBots();
    }, [user]);

    // Purpose: Create a new bot via the API route so server-side
    // revalidatePath fires and the dashboard cache is busted.
    async function handleCreateBot() {
        if (!user) return;
        setIsCreating(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/bots", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(DEFAULT_BOT_CONFIG),
            });
            const data = await res.json();
            if (data.success) {
                router.push(`/portal/${data.botId}`);
            } else {
                console.error("Failed to create bot:", data.message);
                setIsCreating(false);
            }
        } catch (err) {
            console.error("Failed to create bot:", err);
            setIsCreating(false);
        }
    }

    // Purpose: Delete a bot after user confirmation.
    async function handleDeleteBot(botId: string, botName: string) {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${botName}"? This action cannot be undone.`,
        );
        if (!confirmed) return;

        setIsDeleting(botId);
        try {
            if (!user) return;
            const token = await user.getIdToken();
            const res = await fetch(`/api/bots?botId=${botId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setBots((prev) => prev.filter((b) => b.id !== botId));
            } else {
                console.error("Delete failed:", data.message);
            }
        } catch (err) {
            console.error("Failed to delete bot:", err);
        } finally {
            setIsDeleting(null);
        }
    }

    return (
        <>
            {/* ── Content Header ── */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                        Welcome back, {displayName}
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Monitor your AI sales agents and performance across all
                        channels.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleCreateBot}
                    disabled={isCreating}
                    className="inline-flex items-center px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {isCreating ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <Plus className="mr-2 h-5 w-5" />
                    )}
                    {isCreating ? "Creating…" : "Create New AI Bot"}
                </button>
            </header>

            {/* ── Quick Stats ── */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Bots"
                    value={isLoading ? "—" : bots.length}
                    badge={
                        !isLoading && bots.length > 0
                            ? `${bots.length} active`
                            : undefined
                    }
                    icon={Cpu}
                    iconBg="bg-violet-50"
                    iconColor="text-violet-600"
                />
                <StatCard
                    label="Conversations"
                    value="—"
                    icon={MessageSquare}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                />
                <StatCard
                    label="Active Offers"
                    value={isLoading ? "—" : bots.length}
                    badge="Fixed rate"
                    icon={Grid3x3}
                    iconBg="bg-amber-50"
                    iconColor="text-amber-600"
                />
                <StatCard
                    label="Avg. Conversion"
                    value="—"
                    icon={TrendingUp}
                    iconBg="bg-emerald-50"
                    iconColor="text-emerald-600"
                />
            </section>

            {/* ── Active AI Bots ── */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                        Active AI Bots
                    </h2>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 text-violet-600 animate-spin" />
                            <p className="text-xs text-zinc-400 font-medium">
                                Loading your bots…
                            </p>
                        </div>
                    </div>
                ) : bots.length === 0 ? (
                    <div className="text-center py-24">
                        <Bot className="mx-auto h-16 w-16 text-zinc-300 mb-4" />
                        <h3 className="text-lg font-bold text-zinc-600 mb-2">
                            No bots yet
                        </h3>
                        <p className="text-sm text-zinc-400 mb-6">
                            Create your first AI sales bot to start converting
                            leads.
                        </p>
                        <button
                            type="button"
                            onClick={handleCreateBot}
                            disabled={isCreating}
                            className="inline-flex items-center px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            {isCreating
                                ? "Creating…"
                                : "Create Your First Bot"}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {bots.map((bot) => (
                            <article
                                key={bot.id}
                                className="bg-white border border-zinc-200 rounded-xl shadow-sm flex flex-col hover:border-violet-200 transition-colors"
                            >
                                <div className="p-6 flex-1">
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-bold text-zinc-900 truncate">
                                                {bot.botName}
                                            </h3>
                                            <p className="text-sm text-zinc-500 mt-1 line-clamp-1">
                                                {bot.coreObjective ||
                                                    "No objective set"}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 shrink-0 ml-3">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" />
                                            Active
                                        </span>
                                    </div>
                                    <div className="mt-6 grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-zinc-50 rounded-lg">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                                Pricing
                                            </p>
                                            <p className="text-sm font-semibold text-zinc-700 mt-0.5">
                                                ${bot.regularPrice}/session
                                            </p>
                                        </div>
                                        <div className="p-3 bg-zinc-50 rounded-lg">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                                Flash Offer
                                            </p>
                                            <p className="text-sm font-semibold text-violet-600 mt-0.5">
                                                ${bot.flashOffer}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer Actions */}
                                <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100 rounded-b-xl flex items-center justify-between gap-2">
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/chat/${bot.id}`}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-violet-600 px-2.5 py-1.5 rounded-md hover:bg-violet-50 transition-all"
                                            title="Preview bot"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            View
                                        </Link>
                                        <Link
                                            href={`/portal/${bot.id}`}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-violet-600 px-2.5 py-1.5 rounded-md hover:bg-violet-50 transition-all"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Edit
                                        </Link>
                                        <Link
                                            href={`/crm/${bot.id}`}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-violet-600 px-2.5 py-1.5 rounded-md hover:bg-violet-50 transition-all"
                                        >
                                            <Contact className="h-3.5 w-3.5" />
                                            Leads
                                        </Link>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleDeleteBot(
                                                bot.id,
                                                bot.botName,
                                            )
                                        }
                                        disabled={isDeleting === bot.id}
                                        className="inline-flex items-center text-xs font-semibold text-red-500 hover:text-red-600 px-2 py-1.5 rounded-md hover:bg-red-50 transition-all disabled:opacity-50"
                                        title="Delete bot"
                                    >
                                        {isDeleting === bot.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>
                            </article>
                        ))}

                        {/* "Deploy new agent" dashed card */}
                        <button
                            type="button"
                            onClick={handleCreateBot}
                            disabled={isCreating}
                            className="border-2 border-dashed border-zinc-200 rounded-xl p-8 flex flex-col items-center justify-center text-zinc-400 hover:border-violet-300 hover:bg-violet-50/30 hover:text-violet-600 transition-all group disabled:opacity-50"
                        >
                            <div className="h-12 w-12 rounded-full border border-zinc-200 flex items-center justify-center mb-3 group-hover:border-violet-200 group-hover:bg-white transition-all">
                                <Plus className="h-6 w-6" />
                            </div>
                            <span className="text-sm font-semibold">
                                {isCreating
                                    ? "Creating…"
                                    : "Deploy new agent"}
                            </span>
                            <span className="text-xs mt-1 text-zinc-500">
                                Start from a blank template
                            </span>
                        </button>
                    </div>
                )}
            </section>

            {/* ── Live Conversation Feed ── */}
            <section className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                    <h2 className="text-base font-bold text-zinc-900">
                        Live Conversation Feed
                    </h2>
                    <div className="flex items-center space-x-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs text-zinc-500 font-medium">
                            Monitoring live
                        </span>
                    </div>
                </div>

                <div className="divide-y divide-zinc-100">
                    {/* Placeholder activity items */}
                    <div className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xs">
                                ?
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-900">
                                    No recent conversations
                                </p>
                                <p className="text-xs text-zinc-500 italic">
                                    Live feed will populate once bots start
                                    engaging.
                                </p>
                            </div>
                        </div>
                        <span className="text-xs text-zinc-400">—</span>
                    </div>
                </div>

                <div className="px-6 py-3 bg-zinc-50 text-center">
                    <button
                        type="button"
                        className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                        View all conversations
                    </button>
                </div>
            </section>
        </>
    );
}
