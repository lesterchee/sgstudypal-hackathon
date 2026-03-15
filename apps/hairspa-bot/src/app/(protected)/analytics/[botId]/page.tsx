"use client";

import { useState, useEffect, use } from "react";

// ---------------------------------------------------------------------------
// Purpose: Analytics Dashboard — visualizes bot ROI, lead conversion funnels,
// and closed-loop payment tracking for merchants.
// ---------------------------------------------------------------------------

interface AnalyticsLead {
    id: string;
    botId: string;
    createdAt?: number;
    crmStatus?: string;
    contactPreference?: string;
    clickedPay?: boolean;
    paymentStatus?: string;
    paymentAmount?: number;
    name?: string;
    email?: string;
    phone?: string;
    preferredOutlet?: string;
}

// ---------------------------------------------------------------------------
// Aggregation Engine
// ---------------------------------------------------------------------------

interface DashboardMetrics {
    totalLeads: number;
    afterHoursLeads: number;
    afterHoursPct: number;
    qualityMatrix: { label: string; count: number; color: string }[];
    channelPref: { label: string; count: number; color: string }[];
    chatToLeadPct: number;
    chatsStarted: number;
    clickToPayCount: number;
    clickToPayPct: number;
    paidCount: number;
    totalRevenue: number; // dollars
}

function deriveLeadPriority(lead: AnalyticsLead): string {
    const hasName = !!lead.name;
    const hasContact = !!lead.email || !!lead.phone;
    const hasPrefs = !!lead.preferredOutlet;
    if (hasName && hasContact && hasPrefs) return "Hot";
    if (hasName && hasContact) return "Warm";
    return "Cold";
}

function parseChannel(pref?: string): string {
    if (!pref) return "Unknown";
    const lower = pref.toLowerCase();
    if (lower.includes("whatsapp")) return "WhatsApp";
    if (lower.includes("phone") || lower.includes("call")) return "Phone";
    if (lower.includes("email")) return "Email";
    if (lower.includes("sms")) return "SMS";
    return "Other";
}

function computeMetrics(leads: AnalyticsLead[]): DashboardMetrics {
    const totalLeads = leads.length;

    // 1. After-Hours: createdAt hour < 9 or >= 18 (Singapore Time UTC+8)
    // Purpose: Vercel runs in UTC — convert to Asia/Singapore before checking.
    let afterHoursLeads = 0;
    for (const lead of leads) {
        if (lead.createdAt) {
            try {
                const sgHour = parseInt(
                    new Date(lead.createdAt).toLocaleString("en-SG", {
                        timeZone: "Asia/Singapore",
                        hour: "numeric",
                        hour12: false,
                    }),
                    10,
                );
                if (sgHour < 9 || sgHour >= 18) afterHoursLeads++;
            } catch {
                // Guard: skip leads with corrupt createdAt
            }
        }
    }
    const afterHoursPct = totalLeads > 0 ? Math.round((afterHoursLeads / totalLeads) * 100) : 0;

    // 2. Quality Matrix (Hot/Warm/Cold)
    const qMap: Record<string, number> = { Hot: 0, Warm: 0, Cold: 0 };
    for (const lead of leads) {
        const priority = deriveLeadPriority(lead);
        qMap[priority] = (qMap[priority] || 0) + 1;
    }
    const qColors: Record<string, string> = {
        Hot: "from-rose-500 to-pink-500",
        Warm: "from-amber-400 to-orange-500",
        Cold: "from-sky-400 to-blue-500",
    };
    const qualityMatrix = Object.entries(qMap).map(([label, count]) => ({
        label,
        count,
        color: qColors[label] || "from-slate-400 to-slate-500",
    }));

    // 3. Channel Preference
    const cMap: Record<string, number> = {};
    for (const lead of leads) {
        const ch = parseChannel(lead.contactPreference);
        cMap[ch] = (cMap[ch] || 0) + 1;
    }
    const cColors: Record<string, string> = {
        WhatsApp: "from-emerald-400 to-green-500",
        Phone: "from-blue-400 to-indigo-500",
        Email: "from-orange-400 to-amber-500",
        SMS: "from-slate-400 to-slate-500",
        Other: "from-purple-400 to-violet-500",
        Unknown: "from-gray-300 to-gray-400",
    };
    const channelPref = Object.entries(cMap)
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({
            label,
            count,
            color: cColors[label] || "from-slate-400 to-slate-500",
        }));

    // 4. Chat-to-Lead (mocked chatsStarted = leads.length * 2.5)
    const chatsStarted = Math.round(totalLeads * 2.5) || 0;
    const chatToLeadPct = chatsStarted > 0
        ? Math.round((totalLeads / chatsStarted) * 100)
        : 0;

    // 5. Click-to-Pay
    const clickToPayCount = leads.filter((l) => l.clickedPay === true).length;
    const clickToPayPct = totalLeads > 0 ? Math.round((clickToPayCount / totalLeads) * 100) : 0;

    // 6. Revenue (paid leads)
    const paidLeads = leads.filter((l) => l.paymentStatus === "PAID");
    const paidCount = paidLeads.length;
    const totalRevenue = paidLeads.reduce((sum, l) => sum + (l.paymentAmount || 0), 0) / 100;

    return {
        totalLeads,
        afterHoursLeads,
        afterHoursPct,
        qualityMatrix,
        channelPref,
        chatToLeadPct,
        chatsStarted,
        clickToPayCount,
        clickToPayPct,
        paidCount,
        totalRevenue,
    };
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function StatCard({
    icon,
    label,
    value,
    subtext,
    gradient,
}: {
    icon: string;
    label: string;
    value: string;
    subtext?: string;
    gradient: string;
}) {
    return (
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg`}>
            <div className="absolute -right-3 -top-3 opacity-10">
                <span className="material-symbols-outlined" style={{ fontSize: "80px" }}>{icon}</span>
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-lg opacity-80">{icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</span>
                </div>
                <div className="text-3xl font-extrabold tracking-tight">{value}</div>
                {subtext && <div className="text-xs mt-1 opacity-70">{subtext}</div>}
            </div>
        </div>
    );
}

function BarChart({
    title,
    icon,
    items,
    total,
}: {
    title: string;
    icon: string;
    items: { label: string; count: number; color: string }[];
    total: number;
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[#f48c25]">{icon}</span>
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            </div>
            <div className="space-y-3">
                {items.map((item) => {
                    const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                    return (
                        <div key={item.label}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                                <span className="text-[11px] text-slate-500">
                                    {item.count} <span className="text-slate-400">({pct}%)</span>
                                </span>
                            </div>
                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-700`}
                                    style={{ width: `${Math.max(pct, 2)}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
                {items.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No data yet</p>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalyticsPage({ params }: { params: Promise<{ botId: string }> }) {
    const { botId } = use(params);

    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAndCompute() {
            try {
                const res = await fetch(`/api/leads?botId=${encodeURIComponent(botId)}`);
                const data = await res.json();
                if (data.success && Array.isArray(data.leads)) {
                    setMetrics(computeMetrics(data.leads));
                }
            } catch (err) {
                console.error("Failed to fetch analytics:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAndCompute();
    }, [botId]);

    const m = metrics;

    return (
        <div className="bg-[#f8f7f5] text-slate-900 min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#f48c25]">CommitPay AI</span>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900">Analytics Overview</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative flex items-center bg-slate-100 rounded-lg px-3 py-2 border border-slate-200">
                                <span className="material-symbols-outlined text-slate-400 text-sm mr-2">calendar_month</span>
                                <span className="text-xs font-medium text-slate-700">All Time</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-24 px-4 pt-5">
                {isLoading || !m ? (
                    <div className="p-8 text-center">
                        <div className="inline-flex items-center gap-2 text-sm text-slate-400">
                            <span className="material-symbols-outlined animate-spin text-[#f48c25]">progress_activity</span>
                            Computing analytics…
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5 max-w-5xl mx-auto">
                        {/* Bento Box Stat Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <StatCard
                                icon="payments"
                                label="Revenue"
                                value={m.totalRevenue > 0 ? `$${m.totalRevenue.toLocaleString()}` : "$0"}
                                subtext={`${m.paidCount} paid checkout${m.paidCount !== 1 ? "s" : ""}`}
                                gradient="from-emerald-500 to-green-600"
                            />
                            <StatCard
                                icon="group"
                                label="Total Leads"
                                value={String(m.totalLeads)}
                                subtext={`${m.afterHoursLeads} after-hours (${m.afterHoursPct}%)`}
                                gradient="from-blue-500 to-indigo-600"
                            />
                            <StatCard
                                icon="ads_click"
                                label="Click-to-Pay"
                                value={String(m.clickToPayCount)}
                                subtext={`${m.clickToPayPct}% of leads clicked`}
                                gradient="from-amber-500 to-orange-600"
                            />
                            <StatCard
                                icon="trending_up"
                                label="Chat → Lead"
                                value={`${m.chatToLeadPct}%`}
                                subtext={`${m.totalLeads} leads / ${m.chatsStarted} chats`}
                                gradient="from-violet-500 to-purple-600"
                            />
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <BarChart
                                title="Quality Matrix"
                                icon="local_fire_department"
                                items={m.qualityMatrix}
                                total={m.totalLeads}
                            />
                            <BarChart
                                title="Channel Preference"
                                icon="forum"
                                items={m.channelPref}
                                total={m.totalLeads}
                            />
                        </div>

                        {/* After-Hours Insight Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-[#f48c25]">dark_mode</span>
                                <h3 className="text-sm font-bold text-slate-800">After-Hours Capture</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-4xl font-extrabold text-slate-900">
                                    {m.afterHoursPct}%
                                </div>
                                <div className="flex-1">
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                                            style={{ width: `${Math.max(m.afterHoursPct, 2)}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        <span className="font-semibold text-slate-700">{m.afterHoursLeads}</span> of {m.totalLeads} leads captured outside 9AM–6PM.
                                        {m.afterHoursPct > 30
                                            ? " Your bot is working overtime — strong after-hours ROI."
                                            : " Most leads come during business hours."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/80 border-t border-slate-200" style={{ backdropFilter: "blur(12px)" }}>
                <div className="flex items-center justify-around h-16">
                    <a className="flex flex-col items-center justify-center gap-1 text-[#f48c25] relative" href={`/analytics/${botId}`}>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide">Overview</span>
                        <div className="absolute -top-1 right-1/4 w-1 h-1 bg-[#f48c25] rounded-full" />
                    </a>
                    <a className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-[#f48c25] transition-colors" href={`/portal/${botId}`}>
                        <span className="material-symbols-outlined">bolt</span>
                        <span className="text-[10px] font-medium uppercase tracking-wide">Engine</span>
                    </a>
                    <a className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-[#f48c25] transition-colors" href={`/crm/${botId}`}>
                        <span className="material-symbols-outlined">contact_page</span>
                        <span className="text-[10px] font-medium uppercase tracking-wide">CRM/Leads</span>
                    </a>
                    <a className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-[#f48c25] transition-colors" href="#">
                        <span className="material-symbols-outlined">settings</span>
                        <span className="text-[10px] font-medium uppercase tracking-wide">Config</span>
                    </a>
                </div>
            </nav>
        </div>
    );
}
