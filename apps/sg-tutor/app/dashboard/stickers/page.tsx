// Purpose: My Stickers — gamified badge collection grid. Each sticker
// has a locked/unlocked visual state. Unlocked stickers glow vibrantly;
// locked stickers are greyscale with a lock overlay.

"use client";

import {
    Star,
    Flame,
    Moon,
    Sun,
    Brain,
    CheckCircle2,
    Beaker,
    BookOpen,
    Search,
    Timer,
    Lock,
    Award,
} from "lucide-react";

const StarIcon = Star as any;
const FlameIcon = Flame as any;
const MoonIcon = Moon as any;
const SunIcon = Sun as any;
const BrainIcon = Brain as any;
const CheckCircle2Icon = CheckCircle2 as any;
const BeakerIcon = Beaker as any;
const BookOpenIcon = BookOpen as any;
const SearchIcon = Search as any;
const TimerIcon = Timer as any;
const LockIcon = Lock as any;
const AwardIcon = Award as any;

// Purpose: Sticker data with unlock status. Static dummy data for the
// visual scaffold. Will be driven by Firestore in production.
interface Sticker {
    id: string;
    name: string;
    description: string;
    icon: any;
    isUnlocked: boolean;
    from: string;
    to: string;
}

const STICKERS: Sticker[] = [
    {
        id: "the-first-step",
        name: "The First Step",
        description: "Complete your very first question",
        icon: StarIcon,
        isUnlocked: true,
        from: "from-amber-400",
        to: "to-yellow-500",
    },
    {
        id: "the-iron-streak",
        name: "The Iron Streak",
        description: "Maintain a 7-day practice streak",
        icon: FlameIcon,
        isUnlocked: true,
        from: "from-rose-500",
        to: "to-orange-500",
    },
    {
        id: "the-night-owl",
        name: "The Night Owl",
        description: "Practice after 9 PM",
        icon: MoonIcon,
        isUnlocked: true,
        from: "from-indigo-500",
        to: "to-purple-600",
    },
    {
        id: "the-early-bird",
        name: "The Early Bird",
        description: "Practice before 7 AM",
        icon: SunIcon,
        isUnlocked: false,
        from: "from-sky-400",
        to: "to-cyan-500",
    },
    {
        id: "the-heuristics-hacker",
        name: "The Heuristics Hacker",
        description: "Solve 10 heuristic problems correctly",
        icon: BrainIcon,
        isUnlocked: true,
        from: "from-violet-500",
        to: "to-indigo-600",
    },
    {
        id: "the-flawless-finisher",
        name: "The Flawless Finisher",
        description: "Get 5 questions right in a row",
        icon: CheckCircle2Icon,
        isUnlocked: false,
        from: "from-emerald-500",
        to: "to-green-500",
    },
    {
        id: "the-syllabus-alchemist",
        name: "The Syllabus Alchemist",
        description: "Practice all 8 P6 Math topics",
        icon: BeakerIcon,
        isUnlocked: false,
        from: "from-fuchsia-500",
        to: "to-pink-500",
    },
    {
        id: "the-paper-eater",
        name: "The Paper Eater",
        description: "Complete 3 full test papers",
        icon: BookOpenIcon,
        isUnlocked: false,
        from: "from-teal-500",
        to: "to-cyan-600",
    },
    {
        id: "the-curious-cat",
        name: "The Curious Cat",
        description: "Ask 50 follow-up questions",
        icon: SearchIcon,
        isUnlocked: true,
        from: "from-lime-500",
        to: "to-green-500",
    },
    {
        id: "the-marathoner",
        name: "The Marathoner",
        description: "Practice for 30 days total",
        icon: TimerIcon,
        isUnlocked: false,
        from: "from-orange-500",
        to: "to-red-500",
    },
];

export default function StickersPage() {
    return (
        <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
            {/* Header */}
            <header className="px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 shadow-lg shadow-fuchsia-200">
                        <AwardIcon size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900">My Stickers</h1>
                        <p className="text-xs text-slate-500">
                            Collect them all! {STICKERS.filter((s) => s.isUnlocked).length}/{STICKERS.length} unlocked
                        </p>
                    </div>
                </div>
            </header>

            {/* Sticker Grid */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
                    {STICKERS.map((sticker) => {
                        const Icon = sticker.icon;
                        return (
                            <div
                                key={sticker.id}
                                className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 ${sticker.isUnlocked
                                        ? `bg-gradient-to-br ${sticker.from} ${sticker.to} border-transparent text-white shadow-xl hover:scale-105 hover:shadow-2xl`
                                        : "bg-slate-100 border-slate-200 text-slate-400 opacity-60 grayscale"
                                    }`}
                                title={sticker.description}
                            >
                                {/* Purpose: Glow effect for unlocked stickers. */}
                                {sticker.isUnlocked && (
                                    <div className="absolute inset-0 rounded-2xl bg-white/10 animate-pulse pointer-events-none" />
                                )}

                                {/* Purpose: Lock overlay for locked stickers. */}
                                {!sticker.isUnlocked && (
                                    <div className="absolute top-2 right-2">
                                        <LockIcon size={14} className="text-slate-400" />
                                    </div>
                                )}

                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${sticker.isUnlocked
                                            ? "bg-white/20 backdrop-blur-sm"
                                            : "bg-slate-200"
                                        }`}
                                >
                                    <Icon size={24} />
                                </div>
                                <div className="text-center relative z-10">
                                    <p className="text-xs font-bold leading-tight">{sticker.name}</p>
                                    <p className={`text-[10px] mt-1 leading-snug ${sticker.isUnlocked ? "opacity-80" : "text-slate-400"
                                        }`}>
                                        {sticker.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Purpose: Motivational footer. */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-400">
                        Keep practising to unlock more stickers! ⭐
                    </p>
                </div>
            </div>
        </div>
    );
}
