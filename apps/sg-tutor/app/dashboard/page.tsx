// Purpose: Dashboard triage page — verb-based entry point with a hydration-safe
// randomized motivation engine. Routes students to Help Me, Teach Me, or Test Me.

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Brain, FileText, Trophy, Award } from "lucide-react";

const SparklesIcon = Sparkles as any;
const BrainIcon = Brain as any;
const FileTextIcon = FileText as any;
const TrophyIcon = Trophy as any;
const AwardIcon = Award as any;

// Purpose: Randomized motivation engine to prevent UI staleness and boost
// student dopamine on login. Templates accept studentName and currentGrade.
const GREETING_TEMPLATES = [
    (name: string, grade: string) => `Welcome back, ${name}! Let's crush ${grade} together! 🚀`,
    (name: string, grade: string) => `Ready to level up, ${name}? ${grade} doesn't stand a chance. ⚡`,
    (name: string, grade: string) => `Hey ${name}! Let's make this your best ${grade} week yet. 🏆`,
    (name: string, grade: string) => `${name}, you're back! Time to show ${grade} who's boss. 💪`,
    (name: string, grade: string) => `Great to see you, ${name}! Every question you try makes you stronger. 🌟`,
    (name: string, grade: string) => `${name}, champions don't rest! Let's keep pushing through ${grade}. 🔥`,
];

// Purpose: Verb-based action cards for the triage dashboard.
const ACTION_CARDS = [
    {
        title: "Homework Help",
        description: "Snap a photo of your homework and get step-by-step guidance from your AI tutor.",
        href: "/dashboard/homework-help",
        icon: SparklesIcon,
        gradient: "from-violet-600 to-indigo-600",
        bgLight: "bg-violet-50",
        textColor: "text-violet-700",
    },
    {
        title: "Syllabus Pop Quiz",
        description: "Master new concepts with interactive quizzes tailored to your level.",
        href: "/dashboard/pop-quiz",
        icon: BrainIcon,
        gradient: "from-amber-500 to-orange-500",
        bgLight: "bg-amber-50",
        textColor: "text-amber-700",
    },
    {
        title: "Past Year Exam Papers",
        description: "Practice with real exam papers and track your progress over time.",
        href: "/dashboard/past-papers",
        icon: FileTextIcon,
        gradient: "from-emerald-500 to-teal-500",
        bgLight: "bg-emerald-50",
        textColor: "text-emerald-700",
    },
];

export default function DashboardPage() {
    // Purpose: Hydration-safe greeting — initialized as empty string on the server,
    // then populated on mount via useEffect to prevent SSR/CSR mismatch.
    const [greeting, setGreeting] = useState("");

    // Purpose: TEMPORARY — in production, these come from Firebase Auth + Firestore.
    const studentName = "Student";
    const currentGrade = "Primary 6";

    useEffect(() => {
        // Purpose: Select a random greeting ONLY on the client after hydration
        // to avoid Next.js SSR mismatch errors.
        const idx = Math.floor(Math.random() * GREETING_TEMPLATES.length);
        setGreeting(GREETING_TEMPLATES[idx](studentName, currentGrade));
    }, []);

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 p-6 md:p-10 overflow-y-auto">
            {/* Purpose: Dynamic greeting header — populated after mount to avoid hydration mismatch. */}
            <header className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 min-h-[2.25rem]">
                    {greeting || "Welcome back! 🚀"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">What would you like to do today?</p>
            </header>

            {/* Purpose: Verb-based action cards — 3 primary actions in a responsive grid. */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {ACTION_CARDS.map((card) => (
                    <Link
                        key={card.title}
                        href={card.href}
                        className="group relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                    >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                            <card.icon size={24} className="text-white" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">{card.title}</h2>
                        <p className="text-sm text-gray-500 leading-relaxed">{card.description}</p>
                        <div className={`mt-4 text-xs font-medium ${card.textColor}`}>
                            Get started →
                        </div>
                    </Link>
                ))}
            </div>

            {/* TODO: V1.2 Post-Hackathon — Re-enable Accomplishments and Stickers
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    href="/dashboard/accomplishments"
                    className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
                >
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <TrophyIcon size={20} className="text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-900">My Accomplishments</h3>
                        <p className="text-xs text-gray-500">See your streaks, stats, and progress</p>
                    </div>
                </Link>
                <Link
                    href="/dashboard/stickers"
                    className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
                >
                    <div className="w-10 h-10 rounded-lg bg-fuchsia-50 flex items-center justify-center">
                        <AwardIcon size={20} className="text-fuchsia-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-900">My Stickers</h3>
                        <p className="text-xs text-gray-500">Collect badges as you master new skills</p>
                    </div>
                </Link>
            </div>
            */}
        </div>
    );
}
