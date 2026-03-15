// Purpose: Sprint 109 — Global Settings Modal to manage student profile, preferences, and SaaS billing.

"use client";

import { useState, useEffect } from "react";
import { X, User, CreditCard, Bell } from "lucide-react";

const XIcon = X as any;
const UserIcon = User as any;
const CreditCardIcon = CreditCard as any;
const BellIcon = Bell as any;

// Purpose: Global Settings Modal to manage student profile, preferences, and SaaS billing.
export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "billing">("profile");
    // Purpose: Sprint 111 — Load saved student interests from localStorage for hyper-personalized AI prompts.
    const [interests, setInterests] = useState("");
    // Purpose: Sprint 118 — Load saved education level from localStorage.
    const [studentLevel, setStudentLevel] = useState("Primary 6");
    // Purpose: Sprint 122 — Tutor persona toggle for dynamic AI tone mapping.
    const [tutorPersona, setTutorPersona] = useState("Hype Me");
    useEffect(() => {
        setInterests(localStorage.getItem("studentInterests") || "");
        setStudentLevel(localStorage.getItem("studentLevel") || "Primary 6");
        setTutorPersona(localStorage.getItem("tutorPersona") || "Hype Me");
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex overflow-hidden max-h-[80vh]">
                {/* Purpose: Left Navigation */}
                <div className="w-48 bg-gray-50 dark:bg-slate-800 p-4 border-r border-gray-200 dark:border-slate-700 shrink-0">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 px-2">Settings</h2>
                    <nav className="space-y-1">
                        <button onClick={() => setActiveTab("profile")} className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors cursor-pointer ${activeTab === "profile" ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-semibold" : "text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700"}`}>
                            <UserIcon size={16} /> Profile
                        </button>
                        <button onClick={() => setActiveTab("preferences")} className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors cursor-pointer ${activeTab === "preferences" ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-semibold" : "text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700"}`}>
                            <BellIcon size={16} /> Preferences
                        </button>
                        <button onClick={() => setActiveTab("billing")} className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors cursor-pointer ${activeTab === "billing" ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-semibold" : "text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700"}`}>
                            <CreditCardIcon size={16} /> Billing
                        </button>
                    </nav>
                </div>

                {/* Purpose: Main Content Area */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">{activeTab}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">
                            <XIcon size={20} />
                        </button>
                    </div>

                    {/* Purpose: Profile Tab — student name and education level. */}
                    {activeTab === "profile" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Student Name</label>
                                <input type="text" defaultValue="Guest Student" className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Education Level</label>
                                <select
                                    value={studentLevel}
                                    onChange={(e) => {
                                        setStudentLevel(e.target.value);
                                        localStorage.setItem("studentLevel", e.target.value);
                                    }}
                                    className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                >
                                    <option value="Primary 1">Primary 1</option>
                                    <option value="Primary 2">Primary 2</option>
                                    <option value="Primary 3">Primary 3</option>
                                    <option value="Primary 4">Primary 4</option>
                                    <option value="Primary 5">Primary 5</option>
                                    <option value="Primary 6">Primary 6</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">We tailor the AI tutor&apos;s vocabulary based on this level.</p>
                            </div>
                            <button className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-500 transition-colors cursor-pointer">Save Changes</button>
                        </div>
                    )}

                    {/* Purpose: Preferences Tab — notification and persona toggles. */}
                    {activeTab === "preferences" && (
                        <div className="space-y-4">
                            {/* Purpose: Sprint 111 — Student interests input for hyper-personalized word problem generation. */}
                            <div className="mb-4 space-y-1">
                                <label className="block text-sm font-medium text-gray-900 dark:text-white">Child&apos;s Interests</label>
                                <p className="text-xs text-gray-500">We will use these to create fun, personalized word problems.</p>
                                <input
                                    type="text"
                                    value={interests}
                                    onChange={(e) => {
                                        setInterests(e.target.value);
                                        localStorage.setItem("studentInterests", e.target.value);
                                    }}
                                    placeholder="e.g., Minecraft, Dinosaurs, Space, Ballet"
                                    className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none mt-2"
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-700 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Weekly Progress Report</p>
                                    <p className="text-xs text-gray-500">Receive an email summary of topics mastered.</p>
                                </div>
                                <input type="checkbox" defaultChecked className="w-4 h-4 text-violet-600" />
                            </div>
                            {/* Purpose: Sprint 122 — Tutor Persona toggle for dynamic AI tone mapping. */}
                            <div className="mb-4 space-y-1">
                                <label className="block text-sm font-medium text-gray-900 dark:text-white">Tutor Persona</label>
                                <p className="text-xs text-gray-500">Choose how the AI reacts to your answers.</p>
                                <select
                                    value={tutorPersona}
                                    onChange={(e) => {
                                        setTutorPersona(e.target.value);
                                        localStorage.setItem("tutorPersona", e.target.value);
                                    }}
                                    className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none mt-2"
                                >
                                    <option value="Hype Me">Hype Me (Enthusiastic &amp; Encouraging)</option>
                                    <option value="Roast Me">Roast Me (Sarcastic Asian Uncle)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Purpose: Billing Tab — current plan and Stripe portal link. */}
                    {activeTab === "billing" && (
                        <div className="space-y-4">
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg">
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Current Plan</p>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white">SgStudyPal Pro</h4>
                                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Your 2 Months Free Trial is active. Next billing date: May 10, 2026 ($30.00/month).</p>
                            </div>
                            <button className="w-full py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                Manage Subscription (Stripe Portal)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
