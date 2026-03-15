"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthGuard";
import {
    LayoutGrid,
    Cpu,
    BarChart3,
    CreditCard,
    Settings,
    ChevronsUpDown,
    Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Purpose: Sidebar navigation items — single source of truth for dashboard nav.
// ---------------------------------------------------------------------------
const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid, exact: true },
    { label: "Bots", href: "/dashboard/bots", icon: Cpu, exact: false },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, exact: false },
    { label: "Billing", href: "/dashboard/billing", icon: CreditCard, exact: false },
    { label: "Settings", href: "/dashboard/settings", icon: Settings, exact: false },
] as const;

// ---------------------------------------------------------------------------
// Purpose: Dashboard layout shell — sidebar + header that wraps all
// /dashboard/* routes. Nested inside (protected)/layout.tsx which
// provides AuthProvider + AuthGuard.
// ---------------------------------------------------------------------------
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { user } = useAuth();

    // Purpose: Derive display name from Firebase user or fall back to email prefix.
    const displayName =
        user?.displayName || user?.email?.split("@")[0] || "User";
    const email = user?.email || "";

    // Purpose: Active state detection — exact match for "/dashboard",
    // startsWith for all sub-routes to support nested pages.
    function isActive(href: string, exact: boolean) {
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    }
    return (
        <div className="flex h-full min-h-screen bg-zinc-50">
            {/* ── Sidebar ── */}
            <aside
                className="fixed inset-y-0 left-0 w-64 border-r border-zinc-200 bg-white hidden lg:flex flex-col z-40"
                data-purpose="sidebar"
            >
                {/* Logo */}
                <Link href="/dashboard" className="px-6 py-8 flex items-center space-x-2 hover:opacity-80 transition-opacity">
                    <div className="h-8 w-8 bg-violet-600 rounded-lg flex items-center justify-center">
                        <Cpu className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">
                        CommitPay
                    </span>
                </Link>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1 custom-scrollbar overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const active = isActive(item.href, item.exact);
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
                                    active
                                        ? "nav-active"
                                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "mr-3 h-5 w-5",
                                        active
                                            ? "text-violet-600"
                                            : "text-zinc-400",
                                    )}
                                />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Profile */}
                <div className="p-4 border-t border-zinc-200">
                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors">
                        <div className="h-9 w-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm ring-2 ring-zinc-100">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 truncate">
                                {displayName}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">
                                {email}
                            </p>
                        </div>
                        <ChevronsUpDown className="h-4 w-4 text-zinc-400 shrink-0" />
                    </div>
                </div>
            </aside>

            {/* ── Main content area ── */}
            <main className="flex-1 lg:ml-64 p-6 lg:p-10 space-y-8">
                {children}
            </main>
        </div>
    );
}
