// Purpose: Dashboard layout wrapper — verb-based primary navigation.
// Stripped contextual subject filters from global navigation to enforce
// progressive disclosure. Subjects are now injected at destination routes.
// Sprint 58: Light/Dark theme toggle injected into sidebar.

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { LogOut, Sparkles, FileText, Brain, Trophy, Award, CalendarCheck, Sun, Moon, Settings, Video } from "lucide-react";
import { signOut, onAuthStateChanged } from "firebase/auth";

const CalendarCheckIcon = CalendarCheck as any;
const LogOutIcon = LogOut as any;
const SparklesIcon = Sparkles as any;
const FileTextIcon = FileText as any;
const BrainIcon = Brain as any;
const TrophyIcon = Trophy as any;
const AwardIcon = Award as any;
const SunIcon = Sun as any;
const MoonIcon = Moon as any;
const SettingsIcon = Settings as any;
const VideoIcon = Video as any;

// Purpose: Sprint 114 — Dynamically import SettingsModal with SSR disabled to prevent localStorage hydration crashes.
import dynamic from "next/dynamic";
const SettingsModal = dynamic(() => import("@/components/SettingsModal").then(mod => mod.SettingsModal), { ssr: false });

// Purpose: Verb-based navigation links. Progressive disclosure means
// subject context is pushed down to individual route pages, not global sidebar.
const NAV_ITEMS = [
    {
        label: "AI Tutor (Live Video)",
        href: "/dashboard/live-tutor",
        icon: VideoIcon,
        activeGradient: "bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white font-medium shadow-sm",
    },
    {
        label: "Homework Help",
        href: "/dashboard/homework-help",
        icon: SparklesIcon,
        activeGradient: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium shadow-sm",
    },
    {
        label: "Syllabus Pop Quiz",
        href: "/dashboard/pop-quiz",
        icon: BrainIcon,
        activeGradient: "bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-sm",
    },
    {
        label: "Past Year Exam Papers",
        href: "/dashboard/past-papers",
        icon: FileTextIcon,
        activeGradient: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-sm",
    },
    /* TODO: V1.2 Post-Hackathon
    {
        label: "My Accomplishments",
        href: "/dashboard/accomplishments",
        icon: TrophyIcon,
        activeGradient: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-sm",
    },
    {
        label: "My Stickers",
        href: "/dashboard/stickers",
        icon: AwardIcon,
        activeGradient: "bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-medium shadow-sm",
    },
    */
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [session, setSession] = useState<{ uid: string; role: string } | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    // Purpose: Light/Dark theme toggle — Sprint 58. Sprint 63: propagates `dark`
    // class onto document.documentElement so Tailwind dark: variants work globally.
    const [isDark, setIsDark] = useState(false);
    // Purpose: Sprint 109 — Global Settings Modal state.
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Purpose: Sync the `dark` class on the HTML element whenever isDark changes.
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [isDark]);

    // Purpose: Grade promotion modal state — driven by the `needsGradePromotion`
    // flag set by the Jan 1st Cloud Function cron.
    const [showGradePromotion, setShowGradePromotion] = useState(false);

    // Purpose: Next-grade mapping for the promotion modal.
    const NEXT_GRADE: Record<string, string> = {
        P1: 'P2', P2: 'P3', P3: 'P4', P4: 'P5', P5: 'P6',
    };

    // Purpose: Simulated current grade — in production, from Firestore UserProfile.
    const currentGrade = 'P5';

    // Purpose: Live Firebase authentication listener enforcing protected routes.
    // Redirects unauthenticated traffic to the login screen.
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setSession({ uid: user.uid, role: "student" });
                setLoadingAuth(false);

                // Purpose: Simulated current grade check — in production, from Firestore UserProfile.
                const mockNeedsPromotion = false;
                if (mockNeedsPromotion) setShowGradePromotion(true);
            } else {
                setSession(null);
                setLoadingAuth(false);
                router.push("/login");
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    // Purpose: Prevent the dashboard from flashing before the auth state resolves.
    if (loadingAuth) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen transition-colors duration-200 bg-gray-50 dark:bg-slate-950">
            {/* Purpose: Grade Promotion Modal — full-screen overlay with
                "Happy New Year!" messaging and Confirm/Stay buttons. */}
            {showGradePromotion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <CalendarCheckIcon size={32} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            Happy New Year! 🎉
                        </h2>
                        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                            Are you in <span className="font-bold text-violet-600">Primary {NEXT_GRADE[currentGrade]?.replace('P', '')}</span> now?
                            We&apos;ll update your syllabus and AI Tutor accordingly.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowGradePromotion(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                            >
                                Yes, I&apos;m in {NEXT_GRADE[currentGrade]}! ✅
                            </button>
                            <button
                                onClick={() => setShowGradePromotion(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-all cursor-pointer"
                            >
                                No, stay in {currentGrade}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Purpose: Verb-based primary sidebar navigation. */}
            {/* Purpose: Sidebar — background matches main content for seamless look. */}
            <aside className="w-64 flex flex-col shrink-0 border-r transition-colors duration-200 bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                <Link href="/dashboard" className="flex items-center gap-2 px-5 py-4 border-b transition-colors border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">SgStudyPal</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Beta</span>
                </Link>

                <div className="flex-1 overflow-y-auto py-4">
                    <div className="px-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400 dark:text-slate-500">Navigation</h3>
                        <ul className="space-y-1">
                            {NAV_ITEMS.map((item) => {
                                // Purpose: Active route detection — uses startsWith for
                                // nested route matching (e.g. /dashboard/help-me/xxx).
                                const isActive = pathname.startsWith(item.href);

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors ${isActive
                                                ? item.activeGradient
                                                : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                                                }`}
                                        >
                                            <item.icon size={16} />
                                            {item.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>

                <div className="p-4 border-t space-y-1 border-gray-200 dark:border-slate-800">
                    {/* Purpose: Sprint 110 — Settings trigger. Hidden for hackathon demo (Phase 158). */}
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="hidden flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors cursor-pointer text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                    >
                        <SettingsIcon size={16} />
                        <span>Settings</span>
                    </button>
                    {/* Purpose: Light/Dark mode toggle — Sprint 58. */}
                    <button
                        onClick={() => setIsDark((d) => !d)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors cursor-pointer text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                    >
                        {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
                        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                        <LogOutIcon size={16} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden flex flex-col">
                {children}
            </main>

            {/* Purpose: Sprint 109 — Global Settings Modal render. */}
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}
