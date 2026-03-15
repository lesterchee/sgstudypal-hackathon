"use client";

import { useState, useEffect, use, useRef } from "react";
import { getClientDb } from "@/lib/firebase/client";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
} from "firebase/firestore";

// ---------------------------------------------------------------------------
// Purpose: Local Lead shape matching packages/types/src/schemas/saas.ts.
// ---------------------------------------------------------------------------
interface Lead {
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
    // Purpose: CRM-specific fields for teleconsultant workflow.
    crmStatus?: string;
    statusUpdate?: string;
    remarks?: string;
    // Purpose: Soft-delete flag — archived leads are hidden from the CRM view.
    isArchived?: boolean;
    // Purpose: CRM audit trail — tracks who touched a lead and when.
    activityHistory?: { uid: string; action: string; timestamp: string }[];
}

// Purpose: Derive lead priority from available data completeness.
function getLeadPriority(lead: Lead): { label: string; cls: string } {
    const hasName = !!lead.name;
    const hasContact = !!lead.email || !!lead.phone;
    const hasPrefs = !!lead.preferredOutlet || !!lead.preferredDay || !!lead.preferredTime;
    if (hasName && hasContact && hasPrefs) return { label: "Hot", cls: "bg-rose-100 text-rose-700" };
    if (hasName && hasContact) return { label: "Warm", cls: "bg-orange-100 text-orange-700" };
    return { label: "Cold", cls: "bg-blue-100 text-blue-700" };
}

// Purpose: Derive info readiness badge from data completeness.
function getInfoStatus(lead: Lead): { label: string; cls: string } {
    if (lead.name && (lead.email || lead.phone) && lead.preferredOutlet) {
        return { label: "Ready to Contact", cls: "bg-emerald-100 text-emerald-700" };
    }
    return { label: "Incomplete Info", cls: "bg-amber-100 text-amber-700" };
}

// Purpose: Parse contactPreference into outreach method and time.
function parseContactPref(pref?: string): { method: string; time: string; icon: string; color: string } {
    if (!pref) return { method: "-", time: "-", icon: "sms", color: "text-slate-500" };
    const lower = pref.toLowerCase();
    let method = "-";
    let icon = "sms";
    let color = "text-slate-500";
    if (lower.includes("whatsapp")) { method = "WhatsApp"; icon = "chat"; color = "text-emerald-600"; }
    else if (lower.includes("phone") || lower.includes("call")) { method = "Phone"; icon = "call"; color = "text-blue-600"; }
    else if (lower.includes("email")) { method = "Email"; icon = "mail"; color = "text-orange-600"; }
    else if (lower.includes("sms")) { method = "SMS"; icon = "sms"; color = "text-slate-500"; }
    else { method = pref.split(",")[0] || pref; }

    // Purpose: Extract time context from the preference string.
    let time = "-";
    if (lower.includes("morning")) time = "Morning";
    else if (lower.includes("afternoon")) time = "Afternoon";
    else if (lower.includes("evening")) time = "Evening";
    else if (lower.includes("anytime")) time = "Anytime";

    return { method, time, icon, color };
}

// Purpose: Format a Unix timestamp to a short display string.
function formatDate(ts: number): string {
    const d = new Date(ts);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getMonth()]} ${d.getDate()}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const CRM_STATUSES = ["Pending", "Complete", "Archive", "Close"];
const STATUS_UPDATES = ["Converted", "Not Interested", "Unreachable", "Wrong Number", "-"];

export default function CrmPage({ params }: { params: Promise<{ botId: string }> }) {
    // Purpose: Next.js 15+ — unwrap async params.
    const { botId } = use(params);

    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Purpose: Tracks whether real-time listener connected successfully.
    const realtimeActive = useRef(false);

    // Purpose: Initial data load via API route (Admin SDK, always works).
    useEffect(() => {
        async function fetchLeads() {
            try {
                const res = await fetch(`/api/leads?botId=${encodeURIComponent(botId)}`);
                const data = await res.json();
                if (data.success && Array.isArray(data.leads)) {
                    // Only use API data if real-time listener hasn't taken over.
                    if (!realtimeActive.current) {
                        setLeads(data.leads.filter((l: Lead) => l.isArchived !== true));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch leads:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchLeads();
    }, [botId]);

    // Purpose: Point 6 — Real-Time CRM Hydration via onSnapshot.
    // Streams live lead updates to the teleconsultant without page refresh.
    // Falls back gracefully to the API fetch above if Firebase Client SDK
    // env vars are not configured.
    // Point 6 (Scale): Uses equality filter `isArchived == false` instead of
    // inequality `!= true` to avoid Firestore composite index crashes.
    useEffect(() => {
        try {
            const db = getClientDb();
            const q = query(
                collection(db, "leads"),
                where("botId", "==", botId),
                where("isArchived", "==", false),
                orderBy("createdAt", "desc"),
            );
            const unsub = onSnapshot(
                q,
                (snap) => {
                    realtimeActive.current = true;
                    const liveDocs = snap.docs.map(
                        (d) => ({ id: d.id, ...d.data() } as Lead),
                    );
                    setLeads(liveDocs);
                    setIsLoading(false);
                },
                (err) => {
                    console.error("onSnapshot error — falling back to API:", err);
                },
            );
            return () => unsub();
        } catch {
            // Firebase Client SDK not configured — API fetch fallback is active.
            console.warn("Real-time CRM: Firebase Client SDK unavailable. Using API fallback.");
        }
    }, [botId]);

    // Purpose: Sync teleconsultant dropdown changes directly to Firestore in real-time.
    // Purpose: Implements state rollback on network failure during optimistic UI updates to prevent false-positive completions.
    // Purpose: Point 8 — Setting crmStatus to "Archive" also sets isArchived:true (soft delete).
    async function handleStatusChange(leadId: string, field: string, value: string) {
        setUpdatingId(leadId);

        // Cache previous state for rollback (spread captures by value, not reference)
        const previousLeads = [...leads];

        // Build the update payload. If archiving, set the isArchived flag.
        const updates: Record<string, unknown> = { [field]: value };
        if (field === "crmStatus" && value === "Archive") {
            updates.isArchived = true;
        }

        // Optimistic local update — hide if archiving.
        if (updates.isArchived) {
            setLeads((prev) => prev.filter((l) => l.id !== leadId));
        } else {
            setLeads((prev) =>
                prev.map((l) => (l.id === leadId ? { ...l, [field]: value } : l)),
            );
        }
        try {
            await fetch("/api/leads", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ leadId, updates }),
            });
        } catch (err) {
            console.error("Status update failed:", err);
            // Revert state on network failure
            setLeads(previousLeads);
            alert("Failed to update lead status. Please try again.");
        } finally {
            setUpdatingId(null);
        }
    }

    // Purpose: Filter leads by search term across name, email, phone.
    const filteredLeads = leads.filter((lead) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
            (lead.name?.toLowerCase().includes(q)) ||
            (lead.email?.toLowerCase().includes(q)) ||
            (lead.phone?.includes(q))
        );
    });

    const thCls = "px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider";
    const tdCls = "px-4 py-4";
    const selectCls =
        "bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-[11px] focus:ring-1 focus:ring-[#f48c25] w-28 disabled:opacity-50";

    return (
        <div className="bg-[#f8f7f5] text-slate-900 min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="px-4 py-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#f48c25]">CommitPay AI</span>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900">Lead Recovery &amp; CRM</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative flex items-center bg-slate-100 rounded-lg px-3 py-2 border border-slate-200">
                                <span className="material-symbols-outlined text-slate-400 text-sm mr-2">calendar_month</span>
                                <input
                                    className="bg-transparent border-none p-0 text-xs font-medium focus:ring-0 text-slate-700 w-32"
                                    readOnly
                                    type="text"
                                    value="Mar 1 - Mar 8, 2026"
                                />
                            </div>
                            <button
                                type="button"
                                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">download</span>
                                Export CSV
                            </button>
                        </div>
                    </div>
                    {/* Filters Area */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input
                                className="w-full bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#f48c25]/50 text-slate-900"
                                placeholder="Search leads..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200"
                        >
                            <span className="material-symbols-outlined text-lg">tune</span>
                            <span>All Filters</span>
                            <span className="material-symbols-outlined text-sm">expand_more</span>
                        </button>
                    </div>
                </div>

                {/* Purpose: PDPA compliance notice — set clear data retention expectations. */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <span className="material-symbols-outlined text-slate-400 text-sm">shield</span>
                    <p className="text-[11px] text-slate-500">
                        Note: Leads are only available for download for 180 days due to PDPA compliance.
                    </p>
                </div>
            </header>

            {/* Main Content: Scrollable Table Container */}
            <main className="flex-1 overflow-y-auto pb-24">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <p className="text-sm text-slate-400">Loading leads…</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto" style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}>
                        <table className="w-full text-left border-collapse" style={{ minWidth: "1200px" }}>
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className={thCls}>
                                        <div className="flex items-center gap-1 cursor-pointer">Date/Time <span className="material-symbols-outlined text-xs">swap_vert</span></div>
                                    </th>
                                    <th className={thCls}>Campaign / Source</th>
                                    <th className={thCls}>
                                        <div className="flex items-center gap-1 cursor-pointer">Priority <span className="material-symbols-outlined text-xs text-[#f48c25]">arrow_downward</span></div>
                                    </th>
                                    <th className={thCls}>
                                        <div className="flex items-center gap-1 cursor-pointer">Name <span className="material-symbols-outlined text-xs">swap_vert</span></div>
                                    </th>
                                    <th className={thCls}>Contact</th>
                                    <th className={thCls}>Pref. Outlet</th>
                                    <th className={thCls}>Pref. Day</th>
                                    <th className={thCls}>Pref. Time</th>
                                    <th className={thCls}>Info Details</th>
                                    <th className={thCls}>Pref Outreach</th>
                                    <th className={thCls}>Pref Outreach Time</th>
                                    <th className={thCls}>Current Status</th>
                                    <th className={thCls}>Status Update</th>
                                    <th className={`${thCls} min-w-[300px]`}>Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={14} className="px-4 py-12 text-center text-sm text-slate-400">
                                            {searchTerm ? "No leads match your search." : "No leads found."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeads.map((lead) => {
                                        const priority = getLeadPriority(lead);
                                        const info = getInfoStatus(lead);
                                        const contact = parseContactPref(lead.contactPreference);
                                        const isUpdating = updatingId === lead.id;

                                        return (
                                            <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                                                {/* Date/Time */}
                                                <td className={`${tdCls} text-xs text-slate-500 font-medium`}>
                                                    {formatDate(lead.createdAt)}
                                                </td>
                                                {/* Campaign */}
                                                <td className={tdCls}>
                                                    <div className="text-[11px] font-medium">{lead.offerIntent === "flash" ? "Flash Offer" : "Regular Promo"}</div>
                                                </td>
                                                {/* Priority */}
                                                <td className={tdCls}>
                                                    <span className={`px-2 py-0.5 rounded-full ${priority.cls} text-[10px] font-bold uppercase tracking-tight`}>
                                                        {priority.label}
                                                    </span>
                                                </td>
                                                {/* Name */}
                                                <td className={tdCls}>
                                                    {lead.name ? (
                                                        <div className="font-semibold text-slate-900">{lead.name}</div>
                                                    ) : (
                                                        <div className="font-medium italic text-slate-400">Unknown User</div>
                                                    )}
                                                </td>
                                                {/* Contact */}
                                                <td className={`${tdCls} text-xs`}>
                                                    <div className="text-slate-600">{lead.email || <span className="text-slate-400 italic">No Email</span>}</div>
                                                    <div className="text-slate-400">{lead.phone || "-"}</div>
                                                </td>
                                                {/* Pref Outlet */}
                                                <td className={`${tdCls} text-[11px]`}>
                                                    {lead.preferredOutlet || <span className="text-slate-400 italic">None</span>}
                                                </td>
                                                {/* Pref Day */}
                                                <td className={`${tdCls} text-[11px]`}>
                                                    {lead.preferredDay || <span className="text-slate-400 italic">None</span>}
                                                </td>
                                                {/* Pref Time */}
                                                <td className={`${tdCls} text-[11px]`}>
                                                    {lead.preferredTime || <span className="text-slate-400 italic">None</span>}
                                                </td>
                                                {/* Info Details */}
                                                <td className={tdCls}>
                                                    <span className={`px-2 py-0.5 rounded-full ${info.cls} text-[10px] font-medium`}>
                                                        {info.label}
                                                    </span>
                                                </td>
                                                {/* Pref Outreach Method */}
                                                <td className={tdCls}>
                                                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${contact.color}`}>
                                                        <span className="material-symbols-outlined text-xs">{contact.icon}</span>
                                                        {contact.method}
                                                    </span>
                                                </td>
                                                {/* Pref Outreach Time */}
                                                <td className={`${tdCls} text-[11px] text-slate-600`}>{contact.time}</td>
                                                {/* Current Status (CRM) */}
                                                <td className={tdCls}>
                                                    <select
                                                        className={selectCls}
                                                        value={lead.crmStatus || "Pending"}
                                                        disabled={isUpdating}
                                                        onChange={(e) => handleStatusChange(lead.id, "crmStatus", e.target.value)}
                                                    >
                                                        {CRM_STATUSES.map((s) => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                {/* Status Update */}
                                                <td className={tdCls}>
                                                    <select
                                                        className={selectCls}
                                                        value={lead.statusUpdate || "-"}
                                                        disabled={isUpdating}
                                                        onChange={(e) => handleStatusChange(lead.id, "statusUpdate", e.target.value)}
                                                    >
                                                        {STATUS_UPDATES.map((s) => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                {/* Remarks */}
                                                <td className={tdCls}>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            className="flex-1 bg-transparent border border-slate-200 rounded-md px-2 py-1 text-xs"
                                                            placeholder="Add note..."
                                                            type="text"
                                                            value={lead.remarks || ""}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setLeads((prev) =>
                                                                    prev.map((l) => (l.id === lead.id ? { ...l, remarks: val } : l)),
                                                                );
                                                            }}
                                                            onBlur={(e) => {
                                                                if (e.target.value) {
                                                                    handleStatusChange(lead.id, "remarks", e.target.value);
                                                                }
                                                            }}
                                                        />
                                                        <button type="button" className="text-slate-400 hover:text-[#f48c25] transition-colors">
                                                            <span className="material-symbols-outlined text-lg">open_in_full</span>
                                                        </button>
                                                    </div>
                                                </td>
                                                {/* Activity Timeline (Point 5 Scale) */}
                                                {lead.activityHistory && lead.activityHistory.length > 0 && (
                                                    <td colSpan={14} className="px-4 pb-3">
                                                        <div className="flex items-start gap-2 bg-slate-50 rounded-lg p-2 mt-1">
                                                            <span className="material-symbols-outlined text-xs text-slate-400 mt-0.5">history</span>
                                                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                                {lead.activityHistory.slice(-5).map((entry, idx) => (
                                                                    <span key={idx} className="text-[10px] text-slate-500">
                                                                        <span className="font-medium text-slate-600">{entry.action}</span>
                                                                        {" · "}
                                                                        <span className="text-slate-400">{entry.uid}</span>
                                                                        {" · "}
                                                                        <span className="text-slate-400">
                                                                            {new Date(entry.timestamp).toLocaleString("en-SG", {
                                                                                timeZone: "Asia/Singapore",
                                                                                month: "short",
                                                                                day: "numeric",
                                                                                hour: "2-digit",
                                                                                minute: "2-digit",
                                                                            })}
                                                                        </span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                {/* Lead count */}
                <div className="p-8 text-center">
                    <p className="text-sm text-slate-400">
                        Showing {filteredLeads.length} of {leads.length} active leads
                        {realtimeActive.current && (
                            <span className="ml-2 inline-flex items-center gap-1 text-emerald-500">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                Live
                            </span>
                        )}
                    </p>
                </div>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/80 border-t border-slate-200" style={{ backdropFilter: "blur(12px)" }}>
                <div className="flex items-center justify-around h-16">
                    <a className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-[#f48c25] transition-colors" href={`/analytics/${botId}`}>
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-[10px] font-medium uppercase tracking-wide">Overview</span>
                    </a>
                    <a className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-[#f48c25] transition-colors" href="/portal">
                        <span className="material-symbols-outlined">bolt</span>
                        <span className="text-[10px] font-medium uppercase tracking-wide">Engine</span>
                    </a>
                    <a className="flex flex-col items-center justify-center gap-1 text-[#f48c25] relative" href="/crm">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>contact_page</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide">CRM/Leads</span>
                        <div className="absolute -top-1 right-1/4 w-1 h-1 bg-[#f48c25] rounded-full" />
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
