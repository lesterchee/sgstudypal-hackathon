# Sprint 62: The SaaS Portal Audit

## 1. Global Dashboard Layout (`app/dashboard/layout.tsx`)
```tsx
// Purpose: Dashboard layout wrapper — verb-based primary navigation.
// Stripped contextual subject filters from global navigation to enforce
// progressive disclosure. Subjects are now injected at destination routes.
// Sprint 58: Light/Dark theme toggle injected into sidebar.

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { LogOut, Sparkles, FileText, Brain, Trophy, Award, CalendarCheck, Sun, Moon } from "lucide-react";
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

// Purpose: Verb-based navigation links. Progressive disclosure means
// subject context is pushed down to individual route pages, not global sidebar.
const NAV_ITEMS = [
    {
        label: "Help Me",
        href: "/dashboard/help-me",
        icon: SparklesIcon,
        activeGradient: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium shadow-sm",
    },
    {
        label: "Teach Me",
        href: "/dashboard/teach-me",
        icon: BrainIcon,
        activeGradient: "bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-sm",
    },
    {
        label: "Test Me",
        href: "/dashboard/test-me",
        icon: FileTextIcon,
        activeGradient: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-sm",
    },
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
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [session, setSession] = useState<{ uid: string; role: string } | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    // Purpose: Light/Dark theme toggle — Sprint 58.
    const [isDark, setIsDark] = useState(false);

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
        <div className={`flex h-screen transition-colors duration-200 ${isDark ? "bg-slate-950" : "bg-gray-50"}`}>
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
            <aside className={`w-64 flex flex-col shrink-0 border-r transition-colors duration-200 ${isDark ? "bg-slate-900 border-slate-800" : "bg-gray-50 border-gray-200"}`}>
                <Link href="/dashboard" className={`flex items-center gap-2 px-5 py-4 border-b transition-colors ${isDark ? "border-slate-800 hover:bg-slate-800" : "border-gray-200 hover:bg-gray-100"}`}>
                    <span className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>SG Tutor</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Beta</span>
                </Link>

                <div className="flex-1 overflow-y-auto py-4">
                    <div className="px-4">
                        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-gray-400"}`}>Navigation</h3>
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
                                                : isDark ? "text-slate-300 hover:bg-slate-800" : "text-gray-700 hover:bg-gray-100"
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

                <div className={`p-4 border-t space-y-1 ${isDark ? "border-slate-800" : "border-gray-200"}`}>
                    {/* Purpose: Light/Dark mode toggle — Sprint 58. */}
                    <button
                        onClick={() => setIsDark((d) => !d)}
                        className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${isDark ? "text-slate-300 hover:bg-slate-800" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                        {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
                        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${isDark ? "text-red-400 hover:bg-red-900/30" : "text-red-600 hover:bg-red-50"}`}
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
        </div>
    );
}

```

## 2. Help Me Triage Center (`app/dashboard/help-me/page.tsx`)
```tsx
// Purpose: Help Me — Clean SaaS queue workflow with thumbnail bar + dropzone + AI auto-greeting.
// Sprint 59: Reverted Theater Mode. Standard centered layout with horizontal
// thumbnail queue at top, file upload below, and Socratic chat at bottom.

"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
    Send, ImagePlus, X, Bot, User, Sparkles, WifiOff,
    Clock, CheckCircle2, EyeOff, QrCode, ChevronRight, Upload
} from "lucide-react";
import PopularTopicsGrid from "./components/PopularTopicsGrid";

const SendIcon = Send as any;
const ImagePlusIcon = ImagePlus as any;
const XIcon = X as any;
const BotIcon = Bot as any;
const UserIcon = User as any;
const SparklesIcon = Sparkles as any;
const WifiOffIcon = WifiOff as any;
const ClockIcon = Clock as any;
const CheckCircle2Icon = CheckCircle2 as any;
const EyeOffIcon = EyeOff as any;
const QrCodeIcon = QrCode as any;
const ChevronRightIcon = ChevronRight as any;
const UploadIcon = Upload as any;

// Purpose: Triage tab type — governs which section renders above the chat.
type TriageTab = "recent" | "solved" | "rejected";

// Purpose: Mock data — pending questions from mobile scan pipeline.
const PENDING_QUESTIONS = [
    { id: "q1", subject: "Math", topic: "Percentage", timestamp: "2 min ago", thumbnail: "📊" },
    { id: "q2", subject: "Math", topic: "Ratio", timestamp: "15 min ago", thumbnail: "📐" },
    { id: "q3", subject: "Science", topic: "Forces", timestamp: "1 hr ago", thumbnail: "⚡" },
];

// Purpose: Mock data — recently solved papers.
const RECENTLY_SOLVED = [
    { id: "r1", name: "2024 Nanyang Prelim (Math)", score: "38/40", date: "Yesterday" },
    { id: "r2", name: "2024 Raffles Prelim (Science)", score: "27/30", date: "3 days ago" },
    { id: "r3", name: "2024 PSLE Paper 1 (Math)", score: "42/45", date: "1 week ago" },
];

// Purpose: Mock data — Vision Bouncer rejected uploads with reason codes.
const REJECTED_UPLOADS = [
    { id: "rej1", fileName: "selfie_math.jpg", reasonCode: "FACE_DETECTED" as const, message: "🔒 Face detected. Please crop or retake without faces.", rejectedAt: "5 min ago" },
    { id: "rej2", fileName: "meme_upload.png", reasonCode: "NON_EDUCATIONAL" as const, message: "📚 Not a homework question. Upload a worksheet photo.", rejectedAt: "20 min ago" },
];

// Purpose: Parse AI responses to separate main content from ###SUGGESTIONS### block.
function parseSuggestions(text: string): { mainContent: string; suggestions: string[] } {
    const marker = "###SUGGESTIONS###";
    const idx = text.indexOf(marker);
    if (idx === -1) return { mainContent: text, suggestions: [] };
    const mainContent = text.slice(0, idx).trim();
    const suggestionsBlock = text.slice(idx + marker.length).trim();
    const suggestions = suggestionsBlock
        .split(/\n/)
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
        .filter((line) => line.length > 0)
        .slice(0, 3);
    return { mainContent, suggestions };
}

export default function HelpMePage() {
    const { messages, sendMessage, status, error } = useChat();
    const [activeTab, setActiveTab] = useState<TriageTab>("recent");
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [reconnectCountdown, setReconnectCountdown] = useState(0);

    // Purpose: Stream reconnection state.
    useEffect(() => {
        if (error && !isReconnecting) {
            setIsReconnecting(true);
            setReconnectCountdown(3);
        }
    }, [error, isReconnecting]);

    useEffect(() => {
        if (reconnectCountdown <= 0) {
            if (isReconnecting) setIsReconnecting(false);
            return;
        }
        const timer = setTimeout(() => setReconnectCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [reconnectCountdown, isReconnecting]);

    const searchParams = useSearchParams();
    const currentLevel = searchParams.get("level") || "p6";
    const currentSubject = searchParams.get("subject") || "MATH";

    const [pendingImages, setPendingImages] = useState<Array<{ name: string; dataUrl: string }>>([]);
    const [inputText, setInputText] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isStreaming = status === "streaming" || status === "submitted";

    const processFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = () => {
            setPendingImages((prev) => [
                ...prev,
                { name: file.name, dataUrl: reader.result as string },
            ]);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) Array.from(files).forEach(processFile);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        Array.from(e.dataTransfer.files).forEach(processFile);
    };

    const removeImage = (index: number) => {
        setPendingImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputText.trim();
        if (!text && pendingImages.length === 0) return;
        const parts: Array<{ type: "text"; text: string } | { type: "image"; image: string }> = [];
        for (const img of pendingImages) {
            parts.push({ type: "image", image: img.dataUrl });
        }
        if (text) {
            parts.push({ type: "text", text });
        }
        sendMessage({ parts } as any);
        setInputText("");
        setPendingImages([]);
    };

    const handleTopicClick = (prompt: string) => {
        sendMessage({ text: prompt });
    };

    // Purpose: AI auto-greeting — when user clicks a thumbnail from the queue,
    // inject a confirmation message into the chat.
    const handleQueueItemClick = (subject: string, topic: string) => {
        sendMessage({
            text: `I've received your image for ${subject} — ${topic}. Just to confirm, is this the question you want to tackle?`,
        });
    };

    // Purpose: Tab configuration for triage center.
    const TABS: { key: TriageTab; label: string; count: number }[] = [
        { key: "recent", label: "Recent", count: PENDING_QUESTIONS.length },
        { key: "solved", label: "Solved", count: RECENTLY_SOLVED.length },
        { key: "rejected", label: "Rejected", count: REJECTED_UPLOADS.length },
    ];

    // Purpose: Detect dominant subject from pending queue for label.
    const detectedSubject = PENDING_QUESTIONS.length > 0 ? PENDING_QUESTIONS[0].subject : null;

    return (
        <div
            className="flex-1 flex flex-col h-full bg-gray-50 relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Purpose: Clean SaaS header with title + triage tabs. */}
            <header className="px-6 py-4 border-b border-gray-200 bg-white shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100">
                            <SparklesIcon size={16} className="text-violet-600" />
                        </div>
                        <div>
                            <h1 className="text-base font-semibold text-gray-900">Help Me</h1>
                            <p className="text-xs text-gray-500">Upload a question • Get guided help</p>
                        </div>
                    </div>
                </div>
                {/* Purpose: Triage tabs — Recent / Solved / Rejected. */}
                <div className="flex items-center gap-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${activeTab === tab.key
                                ? "bg-violet-100 text-violet-700"
                                : "text-gray-500 hover:bg-gray-100"
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-1 text-[10px] ${activeTab === tab.key ? "text-violet-500" : "text-gray-400"}`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </header>

            {/* Purpose: TOP SECTION — Horizontal thumbnail bar showing queue items + pending images. */}
            <div className="px-6 py-3 shrink-0 border-b border-gray-100">
                {detectedSubject && (
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Detected: {detectedSubject}
                    </div>
                )}
                <div className="flex items-center gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                    {/* Purpose: Pending question thumbnails. */}
                    {activeTab === "recent" && PENDING_QUESTIONS.map((q) => (
                        <button
                            key={q.id}
                            onClick={() => handleQueueItemClick(q.subject, q.topic)}
                            className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-violet-300 hover:shadow-sm transition-all cursor-pointer"
                        >
                            <span className="text-lg">{q.thumbnail}</span>
                            <div className="text-left">
                                <p className="text-[11px] font-semibold text-gray-800">{q.topic}</p>
                                <p className="text-[9px] text-gray-400">{q.timestamp}</p>
                            </div>
                        </button>
                    ))}

                    {activeTab === "solved" && RECENTLY_SOLVED.map((s) => (
                        <div key={s.id} className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200">
                            <CheckCircle2Icon size={14} className="text-emerald-500" />
                            <div className="text-left">
                                <p className="text-[11px] font-medium text-gray-800 truncate max-w-[160px]">{s.name}</p>
                                <p className="text-[9px] text-gray-400">{s.score} • {s.date}</p>
                            </div>
                        </div>
                    ))}

                    {activeTab === "rejected" && REJECTED_UPLOADS.map((r) => (
                        <div key={r.id} className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                            <EyeOffIcon size={14} className="text-red-400" />
                            <div className="text-left">
                                <p className="text-[11px] font-medium text-red-700 truncate max-w-[160px]">{r.fileName}</p>
                                <p className="text-[9px] text-red-400">{r.rejectedAt}</p>
                            </div>
                        </div>
                    ))}

                    {/* Purpose: Pending image thumbnails from local uploads. */}
                    {pendingImages.map((img, i) => (
                        <div key={`img-${i}`} className="shrink-0 relative group">
                            <img src={img.dataUrl} alt={img.name} className="w-12 h-12 rounded-lg object-cover border-2 border-violet-200" />
                            <button
                                onClick={() => removeImage(i)}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <XIcon size={8} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Purpose: MIDDLE SECTION — File Upload/Dropzone card. */}
            <div className="px-6 py-4 shrink-0">
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${isDragging
                        ? "border-violet-400 bg-violet-50"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}
                >
                    <UploadIcon size={20} className={isDragging ? "text-violet-500" : "text-gray-400"} />
                    <div>
                        <p className={`text-sm font-medium ${isDragging ? "text-violet-700" : "text-gray-600"}`}>
                            {isDragging ? "Drop your image here" : "Click to upload or drag & drop"}
                        </p>
                        <p className="text-xs text-gray-400">PNG, JPEG, WEBP supported</p>
                    </div>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                />
            </div>

            {/* Purpose: Reconnection banner. */}
            {isReconnecting && (
                <div className="mx-6 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-2 shrink-0">
                    <WifiOffIcon size={14} className="shrink-0" />
                    Reconnecting in {reconnectCountdown}s...
                </div>
            )}
            {error && !isReconnecting && (
                <div className="mx-6 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 shrink-0">
                    <span className="font-semibold">Error:</span> {error.message}
                </div>
            )}

            {/* Purpose: BOTTOM SECTION — Socratic AI chat area. */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
                        <div className="w-14 h-14 rounded-xl bg-violet-100 flex items-center justify-center">
                            <SparklesIcon size={24} className="text-violet-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-800 mb-1">AI Tutor</h2>
                            <p className="text-xs text-gray-500 max-w-sm">
                                Upload a photo or select a question from the queue above.
                            </p>
                        </div>
                        <PopularTopicsGrid
                            level={currentLevel}
                            subject={currentSubject}
                            onSelectTopic={handleTopicClick}
                        />
                    </div>
                )}

                {messages.map((message) => {
                    const isUser = message.role === "user";
                    const rawText = message.parts
                        .filter((p) => p.type === "text")
                        .map((p) => (p as any).text)
                        .join("");
                    const { mainContent, suggestions } = isUser
                        ? { mainContent: rawText, suggestions: [] }
                        : parseSuggestions(rawText);
                    return (
                        <div key={message.id} className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
                            <div className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${isUser
                                ? "bg-gray-200 text-gray-600"
                                : "bg-violet-100 text-violet-600"
                                }`}>
                                {isUser ? <UserIcon size={12} /> : <BotIcon size={12} />}
                            </div>
                            <div className="max-w-[75%]">
                                <div className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${isUser
                                    ? "bg-gray-800 text-white rounded-tr-sm"
                                    : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
                                    }`}>
                                    <span className="whitespace-pre-wrap">{mainContent}</span>
                                </div>
                                {!isUser && suggestions.length > 0 && !isStreaming && (
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                        {suggestions.map((q, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleTopicClick(q)}
                                                className="px-2.5 py-1 text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-200 rounded-md hover:bg-violet-100 transition-colors cursor-pointer"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {isStreaming && messages.at(-1)?.role === "user" && (
                    <div className="flex items-start gap-2">
                        <div className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center bg-violet-100 text-violet-600">
                            <BotIcon size={12} />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl rounded-tl-sm px-3 py-2">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Purpose: Drag overlay. */}
            {isDragging && (
                <div className="absolute inset-0 bg-violet-50/90 backdrop-blur-sm flex items-center justify-center z-50 border-4 border-dashed border-violet-400 rounded-xl m-2">
                    <div className="text-center">
                        <UploadIcon size={48} className="text-violet-500 mx-auto mb-3" />
                        <p className="text-violet-700 font-medium text-lg">Drop your image here</p>
                    </div>
                </div>
            )}

            {/* Purpose: Sticky chat input bar. */}
            <div className="shrink-0 px-6 py-3 border-t border-gray-200 bg-white">
                <form onSubmit={handleFormSubmit} className="flex items-end gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="shrink-0 w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-violet-600 hover:border-violet-300 transition-all cursor-pointer"
                        title="Upload image"
                    >
                        <ImagePlusIcon size={16} />
                    </button>
                    <div className="flex-1">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Ask about this question..."
                            rows={1}
                            className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleFormSubmit(e);
                                }
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isStreaming || (!inputText.trim() && pendingImages.length === 0)}
                        className="shrink-0 w-9 h-9 rounded-lg bg-violet-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-violet-500 transition-all cursor-pointer"
                    >
                        <SendIcon size={14} />
                    </button>
                </form>
            </div>
        </div>
    );
}

```

## 3. Teach Me Curriculum Explorer & Lesson View (`app/dashboard/teach-me/page.tsx`)
```tsx
// Purpose: Teach Me — Clean SaaS curriculum explorer with compact topic grid,
// simulated progress bars, and inline Lesson View toggle.
// Sprint 60: Removed Playlist horizontal scroll. Grid with progress bars.
// Clicking a card opens a Lesson View (checklist + chat) instead of routing to /help-me.

"use client";

import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import {
    Brain, BookOpen, Calculator, FlaskConical, Languages,
    Trophy, Target, TrendingUp, Zap, Star, ChevronRight,
    ArrowLeft, CheckCircle2, Circle, Send, Bot, User
} from "lucide-react";

const BrainIcon = Brain as any;
const BookOpenIcon = BookOpen as any;
const CalculatorIcon = Calculator as any;
const FlaskConicalIcon = FlaskConical as any;
const LanguagesIcon = Languages as any;
const TrophyIcon = Trophy as any;
const TargetIcon = Target as any;
const TrendingUpIcon = TrendingUp as any;
const ZapIcon = Zap as any;
const StarIcon = Star as any;
const ChevronRightIcon = ChevronRight as any;
const ArrowLeftIcon = ArrowLeft as any;
const CheckCircle2Icon = CheckCircle2 as any;
const CircleIcon = Circle as any;
const SendIcon = Send as any;
const BotIcon = Bot as any;
const UserIcon = User as any;

// Purpose: Subject configuration for the navigation bar.
type Subject = "Math" | "Science" | "English" | "Chinese";

const SUBJECT_NAV: { key: Subject; label: string; icon: any; activeColor: string }[] = [
    { key: "Math", label: "Mathematics", icon: CalculatorIcon, activeColor: "bg-blue-100 text-blue-700 border-blue-200" },
    { key: "Science", label: "Science", icon: FlaskConicalIcon, activeColor: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { key: "English", label: "English", icon: BookOpenIcon, activeColor: "bg-amber-100 text-amber-700 border-amber-200" },
    { key: "Chinese", label: "Chinese", icon: LanguagesIcon, activeColor: "bg-rose-100 text-rose-700 border-rose-200" },
];

// Purpose: Realistic P6 MOE syllabus mock data across all 4 subjects.
interface SyllabusTopic {
    id: string;
    name: string;
    emoji: string;
    description: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    progress: number; // Purpose: Simulated percent complete (0-100).
    subtopics: string[]; // Purpose: Lesson View checklist items.
}

const P6_SYLLABUS: Record<Subject, SyllabusTopic[]> = {
    Math: [
        { id: "m1", name: "Fractions", emoji: "🔢", description: "Addition, subtraction, multiplication & division of fractions", difficulty: "intermediate", progress: 60, subtopics: ["Adding fractions", "Subtracting fractions", "Multiplying fractions", "Dividing fractions", "Word problems"] },
        { id: "m2", name: "Ratio", emoji: "⚖️", description: "Equivalent ratios, ratio word problems & proportion", difficulty: "intermediate", progress: 40, subtopics: ["Equivalent ratios", "Simplifying ratios", "Ratio word problems", "Proportion"] },
        { id: "m3", name: "Percentage", emoji: "📊", description: "Percentage of a quantity, discount & GST calculations", difficulty: "intermediate", progress: 25, subtopics: ["Percentage of a quantity", "Discount", "GST calculation", "Increase/decrease"] },
        { id: "m4", name: "Speed", emoji: "🏃", description: "Distance, time & speed problems including average speed", difficulty: "advanced", progress: 10, subtopics: ["Speed formula", "Distance problems", "Time problems", "Average speed"] },
        { id: "m5", name: "Algebra", emoji: "🔤", description: "Simple algebraic expressions, equations & word problems", difficulty: "advanced", progress: 0, subtopics: ["Expressions", "Simplifying", "Solving equations", "Word problems"] },
        { id: "m6", name: "Geometry", emoji: "📐", description: "Area & perimeter of composite figures, volume of cubes/cuboids", difficulty: "intermediate", progress: 75, subtopics: ["Area of composite figures", "Perimeter", "Volume of cubes", "Volume of cuboids"] },
        { id: "m7", name: "Data Analysis", emoji: "📉", description: "Pie charts, line graphs & average/mean calculations", difficulty: "beginner", progress: 90, subtopics: ["Pie charts", "Line graphs", "Average/mean", "Interpreting data"] },
        { id: "m8", name: "Whole Numbers", emoji: "🧮", description: "Order of operations, factors, multiples & prime numbers", difficulty: "beginner", progress: 100, subtopics: ["Order of operations", "Factors", "Multiples", "Prime numbers"] },
    ],
    Science: [
        { id: "s1", name: "Energy", emoji: "⚡", description: "Forms of energy, energy conversion & conservation", difficulty: "intermediate", progress: 55, subtopics: ["Forms of energy", "Energy conversion", "Conservation of energy"] },
        { id: "s2", name: "Forces", emoji: "🧲", description: "Gravitational force, friction, elastic spring force", difficulty: "intermediate", progress: 30, subtopics: ["Gravitational force", "Friction", "Elastic spring force", "Effects of forces"] },
        { id: "s3", name: "Cycles", emoji: "🔄", description: "Water cycle, life cycles of plants & animals", difficulty: "beginner", progress: 80, subtopics: ["Water cycle", "Plant life cycles", "Animal life cycles"] },
        { id: "s4", name: "Systems", emoji: "🫁", description: "Human body systems — digestive, respiratory, circulatory", difficulty: "advanced", progress: 15, subtopics: ["Digestive system", "Respiratory system", "Circulatory system"] },
        { id: "s5", name: "Interactions", emoji: "🌱", description: "Food chains, food webs, adaptations & habitats", difficulty: "intermediate", progress: 45, subtopics: ["Food chains", "Food webs", "Adaptations", "Habitats"] },
        { id: "s6", name: "Cells", emoji: "🔬", description: "Plant & animal cells, cell division basics", difficulty: "advanced", progress: 5, subtopics: ["Plant cells", "Animal cells", "Cell division"] },
    ],
    English: [
        { id: "e1", name: "Comprehension", emoji: "📖", description: "Open-ended & MCQ comprehension passages", difficulty: "intermediate", progress: 50, subtopics: ["MCQ passages", "Open-ended answers", "Inference questions"] },
        { id: "e2", name: "Grammar", emoji: "✏️", description: "Tenses, subject-verb agreement, conditionals", difficulty: "intermediate", progress: 65, subtopics: ["Tenses", "Subject-verb agreement", "Conditionals", "Conjunctions"] },
        { id: "e3", name: "Vocabulary", emoji: "📝", description: "Cloze passages, contextual vocabulary & idioms", difficulty: "beginner", progress: 70, subtopics: ["Cloze passages", "Contextual vocabulary", "Idioms"] },
        { id: "e4", name: "Synthesis & Transformation", emoji: "🔀", description: "Combining sentences, active/passive voice", difficulty: "advanced", progress: 20, subtopics: ["Combining sentences", "Active/passive voice", "Direct/indirect speech"] },
        { id: "e5", name: "Composition", emoji: "✍️", description: "Narrative, descriptive & expository writing", difficulty: "advanced", progress: 35, subtopics: ["Narrative writing", "Descriptive writing", "Expository writing"] },
        { id: "e6", name: "Oral Communication", emoji: "🗣️", description: "Stimulus-based conversation & reading aloud", difficulty: "intermediate", progress: 40, subtopics: ["Reading aloud", "Stimulus-based conversation"] },
    ],
    Chinese: [
        { id: "c1", name: "阅读理解", emoji: "📚", description: "Reading comprehension — MCQ and open-ended responses", difficulty: "intermediate", progress: 45, subtopics: ["MCQ comprehension", "Open-ended responses", "Vocabulary in context"] },
        { id: "c2", name: "作文", emoji: "🖊️", description: "Composition writing — narrative and picture-based essays", difficulty: "advanced", progress: 15, subtopics: ["Narrative essays", "Picture-based essays", "Structure & flow"] },
        { id: "c3", name: "词语", emoji: "🀄", description: "Vocabulary — fill in the blanks, word usage in context", difficulty: "beginner", progress: 85, subtopics: ["Fill in the blanks", "Word usage", "Synonyms & antonyms"] },
        { id: "c4", name: "口试", emoji: "🎤", description: "Oral examination — reading passage and picture discussion", difficulty: "intermediate", progress: 30, subtopics: ["Reading passage", "Picture discussion"] },
        { id: "c5", name: "语法", emoji: "📏", description: "Grammar — sentence construction, connectors & punctuation", difficulty: "intermediate", progress: 55, subtopics: ["Sentence construction", "Connectors", "Punctuation"] },
    ],
};

// Purpose: Progress bar color based on percentage.
function progressColor(pct: number): string {
    if (pct >= 80) return "bg-emerald-500";
    if (pct >= 50) return "bg-blue-500";
    if (pct >= 20) return "bg-amber-500";
    return "bg-gray-300";
}

// Purpose: Mastery data type for the skill tree section.
interface MasteryEntry {
    concept: string;
    mastery_level: "low" | "medium" | "high";
    timestamp: string;
}

const MASTERY_CONFIG = {
    low: { label: "Beginner", color: "bg-amber-100 text-amber-800 border-amber-200", barColor: "bg-amber-400", percent: 30, icon: TargetIcon },
    medium: { label: "Proficient", color: "bg-blue-100 text-blue-800 border-blue-200", barColor: "bg-blue-500", percent: 65, icon: TrendingUpIcon },
    high: { label: "Mastered", color: "bg-emerald-100 text-emerald-800 border-emerald-200", barColor: "bg-emerald-500", percent: 95, icon: TrophyIcon },
};

export default function TeachMePage() {
    const [activeSubject, setActiveSubject] = useState<Subject>("Math");
    const [masteryData, setMasteryData] = useState<MasteryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    // Purpose: Lesson View state — when set, shows lesson instead of grid.
    const [activeTopic, setActiveTopic] = useState<SyllabusTopic | null>(null);
    // Purpose: Track completed subtopics in Lesson View.
    const [completedSubtopics, setCompletedSubtopics] = useState<Set<string>>(new Set());

    // Purpose: Lesson View chat — separate useChat instance for the lesson.
    const { messages: lessonMessages, sendMessage: sendLessonMessage, status: lessonStatus } = useChat();
    const [lessonInput, setLessonInput] = useState("");
    const isLessonStreaming = lessonStatus === "streaming" || lessonStatus === "submitted";

    // Purpose: Fetch mastery data from API.
    useEffect(() => {
        fetch("/api/mastery")
            .then((res) => res.json())
            .then((data: MasteryEntry[]) => setMasteryData(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const topics = P6_SYLLABUS[activeSubject];

    // Purpose: Open Lesson View for a topic.
    const handleTopicClick = (topic: SyllabusTopic) => {
        setActiveTopic(topic);
        setCompletedSubtopics(new Set());
        setLessonInput("");
    };

    // Purpose: Toggle subtopic completion in the checklist.
    const toggleSubtopic = (subtopic: string) => {
        setCompletedSubtopics((prev) => {
            const next = new Set(prev);
            if (next.has(subtopic)) next.delete(subtopic);
            else next.add(subtopic);
            return next;
        });
    };

    // Purpose: Send a message in the Lesson View chat.
    const handleLessonSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = lessonInput.trim();
        if (!text) return;
        sendLessonMessage({ text });
        setLessonInput("");
    };

    const totalConcepts = masteryData.length;
    const masteredCount = masteryData.filter((m) => m.mastery_level === "high").length;
    const overallScore = totalConcepts > 0
        ? Math.round(masteryData.reduce((sum, m) => sum + MASTERY_CONFIG[m.mastery_level].percent, 0) / totalConcepts)
        : 0;

    // Purpose: Lesson View — full-screen overlay with checklist + chat.
    if (activeTopic) {
        return (
            <div className="flex-1 flex flex-col h-full bg-gray-50">
                {/* Purpose: Lesson header with back button. */}
                <header className="px-6 py-3 border-b border-gray-200 bg-white shrink-0 flex items-center gap-3">
                    <button
                        onClick={() => setActiveTopic(null)}
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                        <ArrowLeftIcon size={16} />
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{activeTopic.emoji}</span>
                        <div>
                            <h1 className="text-sm font-bold text-gray-900">{activeTopic.name}</h1>
                            <p className="text-[10px] text-gray-500">{activeSubject} • {activeTopic.difficulty}</p>
                        </div>
                    </div>
                </header>

                {/* Purpose: Split layout — left checklist, right chat. */}
                <div className="flex-1 flex min-h-0">
                    {/* Purpose: Left sidebar — sub-topic checklist. */}
                    <div className="w-64 border-r border-gray-200 bg-white flex flex-col shrink-0">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lesson Plan</h2>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                                {completedSubtopics.size}/{activeTopic.subtopics.length} complete
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto py-2">
                            {activeTopic.subtopics.map((sub) => {
                                const done = completedSubtopics.has(sub);
                                return (
                                    <button
                                        key={sub}
                                        onClick={() => toggleSubtopic(sub)}
                                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs transition-colors cursor-pointer ${done ? "text-emerald-600" : "text-gray-700 hover:bg-gray-50"}`}
                                    >
                                        {done
                                            ? <CheckCircle2Icon size={14} className="text-emerald-500 shrink-0" />
                                            : <CircleIcon size={14} className="text-gray-300 shrink-0" />
                                        }
                                        <span className={done ? "line-through opacity-60" : ""}>{sub}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Purpose: Right panel — Socratic AI chat for the lesson. */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0">
                            {lessonMessages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                                    <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                                        <BrainIcon size={22} className="text-violet-600" />
                                    </div>
                                    <p className="text-xs text-gray-500 max-w-sm">
                                        Ask me anything about <strong>{activeTopic.name}</strong>. I&apos;ll guide you step-by-step.
                                    </p>
                                </div>
                            )}

                            {lessonMessages.map((msg) => {
                                const isUser = msg.role === "user";
                                const text = msg.parts
                                    .filter((p) => p.type === "text")
                                    .map((p) => (p as any).text)
                                    .join("");
                                return (
                                    <div key={msg.id} className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
                                        <div className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${isUser ? "bg-gray-200 text-gray-600" : "bg-violet-100 text-violet-600"}`}>
                                            {isUser ? <UserIcon size={12} /> : <BotIcon size={12} />}
                                        </div>
                                        <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm leading-relaxed ${isUser
                                            ? "bg-gray-800 text-white rounded-tr-sm"
                                            : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
                                            }`}>
                                            <span className="whitespace-pre-wrap">{text}</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {isLessonStreaming && lessonMessages.at(-1)?.role === "user" && (
                                <div className="flex items-start gap-2">
                                    <div className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center bg-violet-100 text-violet-600">
                                        <BotIcon size={12} />
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-xl rounded-tl-sm px-3 py-2">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Purpose: Lesson chat input. */}
                        <div className="shrink-0 px-6 py-3 border-t border-gray-200 bg-white">
                            <form onSubmit={handleLessonSubmit} className="flex items-end gap-2">
                                <div className="flex-1">
                                    <textarea
                                        value={lessonInput}
                                        onChange={(e) => setLessonInput(e.target.value)}
                                        placeholder={`Ask about ${activeTopic.name}...`}
                                        rows={1}
                                        className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleLessonSubmit(e);
                                            }
                                        }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLessonStreaming || !lessonInput.trim()}
                                    className="shrink-0 w-9 h-9 rounded-lg bg-violet-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-violet-500 transition-all cursor-pointer"
                                >
                                    <SendIcon size={14} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-y-auto">
            {/* Purpose: Header. */}
            <header className="px-6 pt-5 pb-3 shrink-0">
                <div className="flex items-center gap-3 mb-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100">
                        <BrainIcon size={16} className="text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-base font-semibold text-gray-900">Teach Me</h1>
                        <p className="text-xs text-gray-500">Explore the P6 MOE Syllabus</p>
                    </div>
                </div>
            </header>

            {/* Purpose: Subject navigation bar. */}
            <div className="px-6 pb-4 shrink-0">
                <div className="flex items-center gap-2">
                    {SUBJECT_NAV.map((sub) => {
                        const isActive = activeSubject === sub.key;
                        return (
                            <button
                                key={sub.key}
                                onClick={() => setActiveSubject(sub.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border ${isActive
                                    ? sub.activeColor
                                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                    }`}
                            >
                                <sub.icon size={13} />
                                {sub.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Purpose: Compact topic grid with progress bars. */}
            <div className="px-6 pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {topics.map((topic) => (
                        <button
                            key={topic.id}
                            onClick={() => handleTopicClick(topic)}
                            className="group flex flex-col p-4 rounded-xl bg-white border border-gray-200 hover:border-violet-300 hover:shadow-sm transition-all text-left cursor-pointer"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xl">{topic.emoji}</span>
                                <span className="text-[10px] font-medium text-gray-400">{topic.progress}%</span>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-0.5">{topic.name}</h3>
                            <p className="text-[11px] text-gray-500 leading-relaxed mb-3 line-clamp-2">{topic.description}</p>
                            {/* Purpose: Simulated progress bar. */}
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-auto">
                                <div
                                    className={`h-1.5 rounded-full ${progressColor(topic.progress)} transition-all duration-500`}
                                    style={{ width: `${topic.progress}%` }}
                                />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Purpose: Mastery progress section. */}
            <div className="px-6 pb-6">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <TrophyIcon size={16} className="text-violet-600" />
                    My Mastery Progress
                </h2>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-pulse text-gray-400 text-xs">Loading mastery data...</div>
                    </div>
                ) : totalConcepts === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-8 bg-white rounded-xl border border-gray-200">
                        <BrainIcon size={36} className="text-gray-200 mb-3" />
                        <h3 className="text-xs font-semibold text-gray-600 mb-1">No mastery data yet</h3>
                        <p className="text-[11px] text-gray-400">Start a lesson to begin tracking.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                            <div className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="text-[10px] text-gray-400 flex items-center gap-1 mb-0.5"><ZapIcon size={10} /> Overall</div>
                                <div className="text-lg font-bold text-gray-900">{overallScore}%</div>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="text-[10px] text-gray-400 flex items-center gap-1 mb-0.5"><StarIcon size={10} /> Topics</div>
                                <div className="text-lg font-bold text-gray-900">{totalConcepts}</div>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="text-[10px] text-emerald-500 flex items-center gap-1 mb-0.5"><TrophyIcon size={10} /> Mastered</div>
                                <div className="text-lg font-bold text-emerald-600">{masteredCount}</div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            {masteryData.map((entry) => {
                                const config = MASTERY_CONFIG[entry.mastery_level];
                                const Icon = config.icon;
                                return (
                                    <div key={entry.concept} className="bg-white rounded-lg border border-gray-200 p-3">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <Icon size={14} className="text-gray-500" />
                                                <span className="font-medium text-gray-900 capitalize text-xs">{entry.concept.replace(/-/g, " ")}</span>
                                            </div>
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.color}`}>{config.label}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div className={`h-1.5 rounded-full ${config.barColor} transition-all duration-700 ease-out`} style={{ width: `${config.percent}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

```

## 4. Test Me Assessment Hub (`app/dashboard/test-me/page.tsx`)
```tsx
// Purpose: Test Me — Clean SaaS assessment hub with 3-card grid layout.
// Sprint 61: Removed Shorts hero. Restored grid-cols-3 layout.
// Order: AI Generated Test | Start Digital Paper | Download Past Papers.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    FileText, Download, Sparkles, PenTool, ChevronRight,
    Calculator, FlaskConical, BookOpen, Languages
} from "lucide-react";

const FileTextIcon = FileText as any;
const DownloadIcon = Download as any;
const SparklesIcon = Sparkles as any;
const PenToolIcon = PenTool as any;
const ChevronRightIcon = ChevronRight as any;
const CalculatorIcon = Calculator as any;
const FlaskConicalIcon = FlaskConical as any;
const BookOpenIcon = BookOpen as any;
const LanguagesIcon = Languages as any;

// Purpose: Subject filter configuration — no "All" tab.
type AssessmentSubject = "Mathematics" | "Science" | "English" | "Chinese";

const SUBJECT_TABS: { key: AssessmentSubject; label: string; icon: any; activeColor: string }[] = [
    { key: "Mathematics", label: "Mathematics", icon: CalculatorIcon, activeColor: "bg-blue-100 text-blue-700 border-blue-200" },
    { key: "Science", label: "Science", icon: FlaskConicalIcon, activeColor: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { key: "English", label: "English", icon: BookOpenIcon, activeColor: "bg-amber-100 text-amber-700 border-amber-200" },
    { key: "Chinese", label: "Chinese", icon: LanguagesIcon, activeColor: "bg-rose-100 text-rose-700 border-rose-200" },
];

// Purpose: Mock past papers data filtered by subject.
interface PastPaper {
    id: string;
    name: string;
    year: number;
    school: string;
    subject: AssessmentSubject;
}

const PAST_PAPERS: PastPaper[] = [
    { id: "pp1", name: "PSLE Paper 1", year: 2024, school: "MOE", subject: "Mathematics" },
    { id: "pp2", name: "Nanyang Prelim", year: 2024, school: "Nanyang Primary", subject: "Mathematics" },
    { id: "pp3", name: "Raffles Prelim", year: 2024, school: "Raffles Girls", subject: "Mathematics" },
    { id: "pp4", name: "ACS Prelim", year: 2024, school: "ACS Primary", subject: "Mathematics" },
    { id: "pp5", name: "PSLE Paper 1", year: 2024, school: "MOE", subject: "Science" },
    { id: "pp6", name: "Tao Nan Prelim", year: 2024, school: "Tao Nan School", subject: "Science" },
    { id: "pp7", name: "PSLE Paper 1", year: 2024, school: "MOE", subject: "English" },
    { id: "pp8", name: "Henry Park Prelim", year: 2024, school: "Henry Park Primary", subject: "English" },
    { id: "pp9", name: "PSLE Paper 1", year: 2024, school: "MOE", subject: "Chinese" },
    { id: "pp10", name: "Nan Hua Prelim", year: 2024, school: "Nan Hua Primary", subject: "Chinese" },
];

export default function TestMePage() {
    const router = useRouter();
    const [activeSubject, setActiveSubject] = useState<AssessmentSubject>("Mathematics");
    const [aiTestFocus, setAiTestFocus] = useState("");

    // Purpose: Filter past papers by selected subject.
    const filteredPapers = PAST_PAPERS.filter((p) => p.subject === activeSubject);

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-y-auto">
            {/* Purpose: Header. */}
            <header className="px-6 pt-5 pb-3 shrink-0">
                <div className="flex items-center gap-3 mb-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100">
                        <FileTextIcon size={16} className="text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-base font-semibold text-gray-900">Test Me</h1>
                        <p className="text-xs text-gray-500">Practice with past papers, AI tests, and digital assessments</p>
                    </div>
                </div>
            </header>

            {/* Purpose: Subject navigation bar. */}
            <div className="px-6 pb-4 shrink-0">
                <div className="flex items-center gap-2">
                    {SUBJECT_TABS.map((tab) => {
                        const isActive = activeSubject === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveSubject(tab.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border ${isActive
                                    ? tab.activeColor
                                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                    }`}
                            >
                                <tab.icon size={13} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Purpose: 3-card grid — AI Generated Test | Start Digital Paper | Download Past Papers. */}
            <div className="px-6 pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Purpose: Card 1 — AI Generated Test (LEFT). */}
                    <div className="flex flex-col bg-white rounded-xl border border-gray-200 hover:border-violet-300 hover:shadow-sm transition-all">
                        <div className="p-5 border-b border-gray-100">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                                    <SparklesIcon size={18} className="text-violet-600" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-900">AI Generated Test</h2>
                                    <p className="text-[11px] text-gray-500">Custom quiz based on your weak areas</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <label className="text-xs font-medium text-gray-600 mb-1.5">Focus area</label>
                            <input
                                type="text"
                                value={aiTestFocus}
                                onChange={(e) => setAiTestFocus(e.target.value)}
                                placeholder={`e.g. "${activeSubject === "Mathematics" ? "Ratio and Percentage" : activeSubject === "Science" ? "Energy conversion" : activeSubject === "English" ? "Synthesis & Transformation" : "阅读理解"}"`}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all mb-3"
                            />
                            <button
                                disabled={!aiTestFocus.trim()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mt-auto"
                            >
                                <SparklesIcon size={14} />
                                Generate Test
                            </button>
                        </div>
                    </div>

                    {/* Purpose: Card 2 — Start Digital Paper (CENTER). */}
                    <button
                        onClick={() => router.push("/dashboard/test-me/digital-paper")}
                        className="group flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-sm transition-all p-8 text-center cursor-pointer"
                    >
                        <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                            <PenToolIcon size={24} className="text-emerald-600" />
                        </div>
                        <h2 className="text-sm font-semibold text-gray-900 mb-1">Start Digital Paper</h2>
                        <p className="text-[11px] text-gray-500 max-w-[200px] mb-4">
                            Interactive quiz with MCQ + Short Answer — instant AI grading
                        </p>
                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                            Begin
                            <ChevronRightIcon size={14} />
                        </div>
                    </button>

                    {/* Purpose: Card 3 — Download Past Papers (RIGHT). */}
                    <div className="flex flex-col bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                        <div className="p-5 border-b border-gray-100">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <DownloadIcon size={18} className="text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-900">Download Past Papers</h2>
                                    <p className="text-[11px] text-gray-500">{filteredPapers.length} papers for {activeSubject}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 flex-1 space-y-1.5 overflow-y-auto max-h-[240px]">
                            {filteredPapers.map((paper) => (
                                <button
                                    key={paper.id}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left cursor-pointer"
                                >
                                    <div>
                                        <p className="text-xs font-medium text-gray-800">{paper.name}</p>
                                        <p className="text-[10px] text-gray-400">{paper.school} • {paper.year}</p>
                                    </div>
                                    <DownloadIcon size={12} className="text-gray-400 shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

```

