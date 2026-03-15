// Purpose: Render the primary desktop navigation sidebar with gamification routing.
// This is a standalone reusable component extracted from the dashboard layout.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Sparkles,
    ClipboardList,
    Award,
    Trophy,
    Settings,
} from "lucide-react";

const LayoutDashboardIcon = LayoutDashboard as any;
const SparklesIcon = Sparkles as any;
const ClipboardListIcon = ClipboardList as any;
const AwardIcon = Award as any;
const TrophyIcon = Trophy as any;
const SettingsIcon = Settings as any;

// Purpose: Navigation items for the desktop sidebar. Each entry defines
// a route, icon, label, and optional badge for pending notifications.
const NAV_ITEMS = [
    {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboardIcon,
        badge: null,
        activeGradient: "bg-gradient-to-r from-slate-800 to-slate-900",
    },
    {
        href: "/dashboard/chat",
        label: "AI Tutor",
        icon: SparklesIcon,
        badge: null,
        activeGradient: "bg-gradient-to-r from-violet-600 to-indigo-600",
    },
    {
        href: "/dashboard/level-up",
        label: "My Questions",
        icon: ClipboardListIcon,
        badge: "3 Pending",
        activeGradient: "bg-gradient-to-r from-amber-500 to-orange-500",
    },
    /* TODO: V1.2 Post-Hackathon
    {
        href: "/dashboard/stickers",
        label: "My Badges",
        icon: AwardIcon,
        badge: null,
        activeGradient: "bg-gradient-to-r from-fuchsia-500 to-pink-500",
    },
    {
        href: "/dashboard/accomplishments",
        label: "My Accomplishments",
        icon: TrophyIcon,
        badge: null,
        activeGradient: "bg-gradient-to-r from-emerald-500 to-teal-500",
    },
    */
    {
        href: "/dashboard/settings",
        label: "Settings",
        icon: SettingsIcon,
        badge: null,
        activeGradient: "bg-gradient-to-r from-gray-600 to-gray-700",
    },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 h-full">
            {/* Brand */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200">
                    <SparklesIcon size={18} className="text-white" />
                </div>
                <div>
                    <span className="text-lg font-bold text-gray-900 tracking-tight">SgStudyPal</span>
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold align-top">
                        Beta
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                                            ? `${item.activeGradient} text-white shadow-sm`
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                        }`}
                                >
                                    <Icon size={18} />
                                    <span className="flex-1">{item.label}</span>

                                    {/* Purpose: Badge indicator for pending items. */}
                                    {item.badge && (
                                        <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive
                                                    ? "bg-white/20 text-white"
                                                    : "bg-amber-100 text-amber-700"
                                                }`}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer — Ghost User */}
            <div className="px-4 py-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        G
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">Guest Student</p>
                        <p className="text-[10px] text-gray-400">Novice Scholar</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
