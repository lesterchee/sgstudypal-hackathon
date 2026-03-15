// Purpose: My Accomplishments — parent-facing ROI Dashboard showing
// aggregated tutoring statistics (questions solved, streaks, win rate).
// Uses static dummy data for the visual scaffold.

"use client";

import { useState } from "react";
import {
    Trophy,
    Target,
    Flame,
    Clock,
} from "lucide-react";

const TrophyIcon = Trophy as any;
const TargetIcon = Target as any;
const FlameIcon = Flame as any;
const ClockIcon = Clock as any;

// Purpose: Time-range filter options for the ROI Dashboard.
const TIME_RANGES = ["This Week", "This Month", "All Time"] as const;

// Purpose: Static dummy data for the stats cards.
const STATS = [
    {
        label: "Questions Crushed",
        value: "142",
        delta: "+23 this week",
        icon: TargetIcon,
        from: "from-violet-500",
        to: "to-indigo-600",
        shadow: "shadow-violet-200",
    },
    {
        label: "Boss-Level Wins",
        value: "12",
        delta: "Heuristic problems solved",
        icon: TrophyIcon,
        from: "from-amber-500",
        to: "to-orange-500",
        shadow: "shadow-amber-200",
    },
    {
        label: "Current Streak",
        value: "5 Days",
        delta: "Keep it going! 🔥",
        icon: FlameIcon,
        from: "from-rose-500",
        to: "to-pink-500",
        shadow: "shadow-rose-200",
    },
    {
        label: "Time Invested",
        value: "4h 20m",
        delta: "Avg 52 min/day",
        icon: ClockIcon,
        from: "from-emerald-500",
        to: "to-teal-500",
        shadow: "shadow-emerald-200",
    },
];

export default function AccomplishmentsPage() {
    // Purpose: Track selected time range for visual toggle (static for now).
    const [selectedRange, setSelectedRange] = useState<string>("This Week");

    return (
        <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className="px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200">
                            <TrophyIcon size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900">My Accomplishments</h1>
                            <p className="text-xs text-slate-500">Your learning journey in numbers</p>
                        </div>
                    </div>

                    {/* Purpose: Time-range toggle — visually switchable but static data. */}
                    <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                        {TIME_RANGES.map((range) => (
                            <button
                                key={range}
                                onClick={() => setSelectedRange(range)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${selectedRange === range
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
                    {STATS.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={stat.label}
                                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.from} ${stat.to} p-6 text-white shadow-xl ${stat.shadow} hover:scale-[1.02] transition-transform duration-200`}
                            >
                                {/* Purpose: Background decorative circle for visual depth. */}
                                <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
                                <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5" />

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                            <Icon size={20} />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold tracking-tight mb-1">{stat.value}</p>
                                    <p className="text-sm font-medium opacity-90">{stat.label}</p>
                                    <p className="text-xs opacity-70 mt-1">{stat.delta}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Purpose: Motivational footer message. */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-400">
                        Keep practising! Every question brings you closer to PSLE mastery. 💪
                    </p>
                </div>
            </div>
        </div>
    );
}
