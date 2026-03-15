# Sprint 54: The Realignment Audit

## 1. Help Me Triage Center (`app/dashboard/help-me/page.tsx`)
```tsx
// Purpose: Help Me — Primary triage upload hub with Recent/Solved/Rejected tabs.
// Camera/upload components live here. Chat interface retained for subsequent tutoring.
// Sprint 50: Migrated queue, rejected, and solved data from test-me into tabbed layout.

"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
    Send, ImagePlus, X, Bot, User, Sparkles, WifiOff,
    Clock, CheckCircle2, ShieldX, EyeOff, QrCode, ChevronRight
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
const ShieldXIcon = ShieldX as any;
const EyeOffIcon = EyeOff as any;
const QrCodeIcon = QrCode as any;
const ChevronRightIcon = ChevronRight as any;

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
    { id: "rej1", fileName: "selfie_math.jpg", reasonCode: "FACE_DETECTED" as const, message: "🔒 We detected a face in your upload. For privacy, please crop or retake the photo without any faces.", rejectedAt: "5 min ago" },
    { id: "rej2", fileName: "meme_upload.png", reasonCode: "NON_EDUCATIONAL" as const, message: "📚 This doesn't look like a homework question. Please upload a photo of your worksheet or textbook.", rejectedAt: "20 min ago" },
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
    const [showQrModal, setShowQrModal] = useState(false);

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

    // Purpose: Tab configuration for triage center.
    const TABS: { key: TriageTab; label: string; count: number }[] = [
        { key: "recent", label: "Recent", count: PENDING_QUESTIONS.length },
        { key: "solved", label: "Solved", count: RECENTLY_SOLVED.length },
        { key: "rejected", label: "Rejected", count: REJECTED_UPLOADS.length },
    ];

    return (
        <div
            className="flex-1 flex flex-col h-full bg-gradient-to-b from-slate-50 to-white relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Purpose: Header with triage tabs + Connect to Mobile button. */}
            <header className="px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-200">
                            <SparklesIcon size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900">Help Me</h1>
                            <p className="text-xs text-slate-500">Upload a question • Get guided help</p>
                        </div>
                    </div>
                    {/* Purpose: Connect to Mobile — renders a mocked QR code bridge. */}
                    <button
                        onClick={() => setShowQrModal(!showQrModal)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white text-xs font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                    >
                        <QrCodeIcon size={16} />
                        Connect to Mobile
                    </button>
                </div>

                {/* Purpose: Triage tabs — Recent / Solved / Rejected. */}
                <div className="flex items-center gap-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${activeTab === tab.key
                                    ? "bg-violet-100 text-violet-700 shadow-sm"
                                    : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.key ? "bg-violet-200 text-violet-800" : "bg-gray-100 text-gray-400"
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </header>

            {/* Purpose: QR Code modal — mocked bridge to mobile camera upload. */}
            {showQrModal && (
                <div className="mx-6 mt-3 p-6 bg-white border border-slate-200 rounded-2xl shadow-lg shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-900">📱 Scan to Upload from Mobile</h3>
                        <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                            <XIcon size={16} />
                        </button>
                    </div>
                    <div className="flex items-center justify-center p-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <div className="text-center">
                            <div className="w-32 h-32 mx-auto mb-3 bg-slate-200 rounded-xl flex items-center justify-center">
                                <QrCodeIcon size={64} className="text-slate-400" />
                            </div>
                            <p className="text-xs text-slate-500">Point your phone camera here</p>
                            <p className="text-[10px] text-slate-400 mt-1">Link expires in 15 minutes</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Purpose: Triage content — renders based on active tab selection. */}
            {activeTab === "recent" && PENDING_QUESTIONS.length > 0 && (
                <div className="px-6 pt-3 pb-1 shrink-0">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {PENDING_QUESTIONS.map((q) => (
                            <button
                                key={q.id}
                                className="group flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-violet-400 hover:shadow-md transition-all duration-200 text-left cursor-pointer"
                            >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xl shrink-0">
                                    {q.thumbnail}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-900 truncate">{q.subject} — {q.topic}</p>
                                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                        <ClockIcon size={10} /> {q.timestamp}
                                    </p>
                                </div>
                                <ChevronRightIcon size={14} className="text-slate-300 group-hover:text-violet-500 transition-colors shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "solved" && (
                <div className="px-6 pt-3 pb-1 shrink-0">
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        {RECENTLY_SOLVED.map((paper, idx) => (
                            <div
                                key={paper.id}
                                className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${idx < RECENTLY_SOLVED.length - 1 ? "border-b border-slate-100" : ""}`}
                            >
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                                    <CheckCircle2Icon size={14} className="text-emerald-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-900 truncate">{paper.name}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{paper.date}</p>
                                </div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                    {paper.score}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "rejected" && REJECTED_UPLOADS.length > 0 && (
                <div className="px-6 pt-3 pb-1 shrink-0">
                    <div className="space-y-2">
                        {REJECTED_UPLOADS.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-50/50 border border-red-200/60">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center shrink-0 relative overflow-hidden">
                                    <div className="absolute inset-0 backdrop-blur-xl bg-red-200/60" />
                                    <EyeOffIcon size={16} className="text-red-400 relative z-10" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-red-800 truncate">{item.fileName}</p>
                                    <p className="text-[10px] text-red-600 mt-0.5 leading-relaxed">{item.message}</p>
                                </div>
                                <span className="text-[10px] text-red-400 shrink-0">{item.rejectedAt}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Purpose: Reconnection banner for stream drops. */}
            {isReconnecting && (
                <div className="mx-6 mt-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-center gap-2 shrink-0">
                    <WifiOffIcon size={16} className="shrink-0" />
                    <span>Connection lost. Reconnecting in {reconnectCountdown}s...</span>
                </div>
            )}

            {/* Purpose: Error boundary — renders API errors. */}
            {error && !isReconnecting && (
                <div className="mx-6 mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 shrink-0">
                    <span className="font-semibold">Error:</span> {error.message}
                </div>
            )}

            {/* Purpose: Chat messages area — retained for Socratic tutoring. */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-16">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                            <SparklesIcon size={28} className="text-violet-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800 mb-1">Welcome to AI Tutor</h2>
                            <p className="text-sm text-slate-500 max-w-sm">
                                Upload a screenshot of any Math or Science question and I&apos;ll guide you to the answer using Socratic questioning.
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
                        <div key={message.id} className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isUser
                                ? "bg-slate-800 text-white"
                                : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-200"
                                }`}>
                                {isUser ? <UserIcon size={14} /> : <BotIcon size={14} />}
                            </div>
                            <div className="max-w-[75%]">
                                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser
                                    ? "bg-slate-800 text-white rounded-tr-sm"
                                    : "bg-white text-slate-800 border border-slate-200 shadow-sm rounded-tl-sm"
                                    }`}>
                                    <span className="whitespace-pre-wrap">{mainContent}</span>
                                </div>
                                {!isUser && suggestions.length > 0 && !isStreaming && (
                                    <div className="flex flex-wrap gap-2 mt-2 ml-1">
                                        {suggestions.map((q, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleTopicClick(q)}
                                                className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full hover:bg-blue-100 hover:border-blue-300 transition-all duration-150 cursor-pointer"
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
                    <div className="flex items-start gap-3">
                        <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-200">
                            <BotIcon size={14} />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                            <div className="flex gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Purpose: Drag overlay for image drops. */}
            {isDragging && (
                <div className="absolute inset-0 bg-violet-50/90 backdrop-blur-sm flex items-center justify-center z-50 border-4 border-dashed border-violet-400 rounded-xl m-2">
                    <div className="text-center">
                        <ImagePlusIcon size={48} className="text-violet-500 mx-auto mb-3" />
                        <p className="text-violet-700 font-medium text-lg">Drop your image here</p>
                        <p className="text-violet-500 text-sm">PNG, JPEG supported</p>
                    </div>
                </div>
            )}

            {/* Purpose: Input area — image upload + text + send. */}
            <div className="shrink-0 px-6 py-4 border-t border-slate-200 bg-white/80 backdrop-blur-sm">
                {pendingImages.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                        {pendingImages.map((img, i) => (
                            <div key={i} className="relative group">
                                <img src={img.dataUrl} alt={img.name} className="w-16 h-16 rounded-lg object-cover border-2 border-violet-200 shadow-sm" />
                                <button
                                    onClick={() => removeImage(i)}
                                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                >
                                    <XIcon size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <form onSubmit={handleFormSubmit} className="flex items-end gap-3">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="shrink-0 w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-all"
                        title="Upload image"
                    >
                        <ImagePlusIcon size={18} />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                        multiple
                    />

                    <div className="flex-1">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Ask about this question..."
                            rows={1}
                            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
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
                        className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-violet-200 transition-all"
                    >
                        <SendIcon size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
}

```

## 2. Teach Me Curriculum Explorer (`app/dashboard/teach-me/page.tsx`)
```tsx
// Purpose: Teach Me — Syllabus-driven curriculum exploration hub.
// Sprint 51: Subject navigation bar + P6 MOE syllabus topic bubbles.
// Mastery dashboard preserved below curriculum section.

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Brain, BookOpen, Calculator, FlaskConical, Languages, MessageCircle,
    Trophy, Target, TrendingUp, Zap, Star, ChevronRight
} from "lucide-react";

const BrainIcon = Brain as any;
const BookOpenIcon = BookOpen as any;
const CalculatorIcon = Calculator as any;
const FlaskConicalIcon = FlaskConical as any;
const LanguagesIcon = Languages as any;
const MessageCircleIcon = MessageCircle as any;
const TrophyIcon = Trophy as any;
const TargetIcon = Target as any;
const TrendingUpIcon = TrendingUp as any;
const ZapIcon = Zap as any;
const StarIcon = Star as any;
const ChevronRightIcon = ChevronRight as any;

// Purpose: Subject configuration for the navigation bar.
type Subject = "Math" | "Science" | "English" | "Chinese";

const SUBJECT_NAV: { key: Subject; label: string; icon: any; color: string; activeColor: string }[] = [
    { key: "Math", label: "Mathematics", icon: CalculatorIcon, color: "text-blue-500", activeColor: "bg-blue-100 text-blue-700 border-blue-200" },
    { key: "Science", label: "Science", icon: FlaskConicalIcon, color: "text-emerald-500", activeColor: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { key: "English", label: "English", icon: BookOpenIcon, color: "text-amber-500", activeColor: "bg-amber-100 text-amber-700 border-amber-200" },
    { key: "Chinese", label: "Chinese", icon: LanguagesIcon, color: "text-rose-500", activeColor: "bg-rose-100 text-rose-700 border-rose-200" },
];

// Purpose: Realistic P6 MOE syllabus mock data across all 4 subjects.
interface SyllabusTopic {
    id: string;
    name: string;
    emoji: string;
    description: string;
    difficulty: "beginner" | "intermediate" | "advanced";
}

const P6_SYLLABUS: Record<Subject, SyllabusTopic[]> = {
    Math: [
        { id: "m1", name: "Fractions", emoji: "🔢", description: "Addition, subtraction, multiplication & division of fractions", difficulty: "intermediate" },
        { id: "m2", name: "Ratio", emoji: "⚖️", description: "Equivalent ratios, ratio word problems & proportion", difficulty: "intermediate" },
        { id: "m3", name: "Percentage", emoji: "📊", description: "Percentage of a quantity, discount & GST calculations", difficulty: "intermediate" },
        { id: "m4", name: "Speed", emoji: "🏃", description: "Distance, time & speed problems including average speed", difficulty: "advanced" },
        { id: "m5", name: "Algebra", emoji: "🔤", description: "Simple algebraic expressions, equations & word problems", difficulty: "advanced" },
        { id: "m6", name: "Geometry", emoji: "📐", description: "Area & perimeter of composite figures, volume of cubes/cuboids", difficulty: "intermediate" },
        { id: "m7", name: "Data Analysis", emoji: "📉", description: "Pie charts, line graphs & average/mean calculations", difficulty: "beginner" },
        { id: "m8", name: "Whole Numbers", emoji: "🧮", description: "Order of operations, factors, multiples & prime numbers", difficulty: "beginner" },
    ],
    Science: [
        { id: "s1", name: "Energy", emoji: "⚡", description: "Forms of energy, energy conversion & conservation", difficulty: "intermediate" },
        { id: "s2", name: "Forces", emoji: "🧲", description: "Gravitational force, friction, elastic spring force", difficulty: "intermediate" },
        { id: "s3", name: "Cycles", emoji: "🔄", description: "Water cycle, life cycles of plants & animals", difficulty: "beginner" },
        { id: "s4", name: "Systems", emoji: "🫁", description: "Human body systems — digestive, respiratory, circulatory", difficulty: "advanced" },
        { id: "s5", name: "Interactions", emoji: "🌱", description: "Food chains, food webs, adaptations & habitats", difficulty: "intermediate" },
        { id: "s6", name: "Cells", emoji: "🔬", description: "Plant & animal cells, cell division basics", difficulty: "advanced" },
    ],
    English: [
        { id: "e1", name: "Comprehension", emoji: "📖", description: "Open-ended & MCQ comprehension passages", difficulty: "intermediate" },
        { id: "e2", name: "Grammar", emoji: "✏️", description: "Tenses, subject-verb agreement, conditionals", difficulty: "intermediate" },
        { id: "e3", name: "Vocabulary", emoji: "📝", description: "Cloze passages, contextual vocabulary & idioms", difficulty: "beginner" },
        { id: "e4", name: "Synthesis & Transformation", emoji: "🔀", description: "Combining sentences, active/passive voice, direct/indirect speech", difficulty: "advanced" },
        { id: "e5", name: "Composition", emoji: "✍️", description: "Narrative, descriptive & expository writing", difficulty: "advanced" },
        { id: "e6", name: "Oral Communication", emoji: "🗣️", description: "Stimulus-based conversation & reading aloud", difficulty: "intermediate" },
    ],
    Chinese: [
        { id: "c1", name: "阅读理解", emoji: "📚", description: "Reading comprehension — MCQ and open-ended responses", difficulty: "intermediate" },
        { id: "c2", name: "作文", emoji: "🖊️", description: "Composition writing — narrative and picture-based essays", difficulty: "advanced" },
        { id: "c3", name: "词语", emoji: "🀄", description: "Vocabulary — fill in the blanks, word usage in context", difficulty: "beginner" },
        { id: "c4", name: "口试", emoji: "🎤", description: "Oral examination — reading passage and picture discussion", difficulty: "intermediate" },
        { id: "c5", name: "语法", emoji: "📏", description: "Grammar — sentence construction, connectors & punctuation", difficulty: "intermediate" },
    ],
};

// Purpose: Difficulty badge colors.
const DIFFICULTY_COLORS = {
    beginner: "bg-emerald-100 text-emerald-700",
    intermediate: "bg-amber-100 text-amber-700",
    advanced: "bg-red-100 text-red-700",
};

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
    const router = useRouter();
    const [activeSubject, setActiveSubject] = useState<Subject>("Math");
    const [masteryData, setMasteryData] = useState<MasteryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Purpose: Fetch mastery data from API.
    useEffect(() => {
        fetch("/api/mastery")
            .then((res) => res.json())
            .then((data: MasteryEntry[]) => setMasteryData(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const topics = P6_SYLLABUS[activeSubject];

    // Purpose: Navigate to Help Me chat with topic context pre-loaded.
    const handleTopicClick = (topic: SyllabusTopic) => {
        router.push(`/dashboard/help-me?subject=${activeSubject}&topic=${encodeURIComponent(topic.name)}`);
    };

    const totalConcepts = masteryData.length;
    const masteredCount = masteryData.filter((m) => m.mastery_level === "high").length;
    const overallScore = totalConcepts > 0
        ? Math.round(masteryData.reduce((sum, m) => sum + MASTERY_CONFIG[m.mastery_level].percent, 0) / totalConcepts)
        : 0;

    return (
        <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-amber-50/20 overflow-y-auto">
            {/* Purpose: Header with page title. */}
            <header className="px-8 pt-6 pb-4 shrink-0">
                <div className="flex items-center gap-3 mb-1">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200">
                        <BrainIcon size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Teach Me</h1>
                        <p className="text-xs text-slate-500">Explore the P6 MOE Syllabus</p>
                    </div>
                </div>
            </header>

            {/* Purpose: Subject navigation bar — English, Math, Science, Chinese. */}
            <div className="px-8 pb-4 shrink-0">
                <div className="flex items-center gap-2">
                    {SUBJECT_NAV.map((sub) => {
                        const isActive = activeSubject === sub.key;
                        return (
                            <button
                                key={sub.key}
                                onClick={() => setActiveSubject(sub.key)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer border ${isActive
                                        ? sub.activeColor
                                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                    }`}
                            >
                                <sub.icon size={14} />
                                {sub.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Purpose: Syllabus topic bubbles — clickable cards in responsive grid. */}
            <div className="px-8 pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {topics.map((topic) => (
                        <button
                            key={topic.id}
                            onClick={() => handleTopicClick(topic)}
                            className="group relative flex flex-col items-start p-5 rounded-2xl bg-white border border-slate-200 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-100 transition-all duration-200 text-left cursor-pointer"
                        >
                            <div className="flex items-center justify-between w-full mb-3">
                                <span className="text-2xl">{topic.emoji}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[topic.difficulty]}`}>
                                    {topic.difficulty}
                                </span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 mb-1">{topic.name}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">{topic.description}</p>
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRightIcon size={16} className="text-violet-400" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Purpose: Chat bridge — quick link to ask a general question. */}
            <div className="px-8 pb-6 shrink-0">
                <button
                    onClick={() => router.push(`/dashboard/help-me?subject=${activeSubject}`)}
                    className="w-full flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-200 hover:shadow-2xl hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <MessageCircleIcon size={20} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-bold">Ask the AI Tutor</h3>
                            <p className="text-xs opacity-80">Get Socratic-guided help on any {activeSubject} topic</p>
                        </div>
                    </div>
                    <ChevronRightIcon size={20} className="opacity-60" />
                </button>
            </div>

            {/* Purpose: Skill mastery section — preserved from original page. */}
            <div className="px-8 pb-8">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <TrophyIcon size={20} className="text-violet-600" />
                    My Mastery Progress
                </h2>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-pulse text-gray-400 text-sm">Loading mastery data...</div>
                    </div>
                ) : totalConcepts === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-12 bg-white rounded-2xl border border-slate-200">
                        <BrainIcon size={48} className="text-gray-200 mb-4" />
                        <h3 className="text-sm font-semibold text-gray-700 mb-1">No mastery data yet</h3>
                        <p className="text-xs text-gray-500 max-w-sm">
                            Start a tutoring session to begin tracking your concept mastery.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Purpose: Stats summary row. */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
                                    <ZapIcon size={14} /> Overall
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{overallScore}%</div>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
                                    <StarIcon size={14} /> Topics
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{totalConcepts}</div>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-emerald-500 text-xs font-medium mb-1">
                                    <TrophyIcon size={14} /> Mastered
                                </div>
                                <div className="text-2xl font-bold text-emerald-600">{masteredCount}</div>
                            </div>
                        </div>

                        {/* Purpose: Skill tree progress bars. */}
                        <div className="grid gap-3">
                            {masteryData.map((entry) => {
                                const config = MASTERY_CONFIG[entry.mastery_level];
                                const Icon = config.icon;
                                return (
                                    <div key={entry.concept} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <Icon size={16} className="text-gray-600" />
                                                <span className="font-medium text-gray-900 capitalize text-sm">
                                                    {entry.concept.replace(/-/g, " ")}
                                                </span>
                                            </div>
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${config.color}`}>
                                                {config.label}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${config.barColor} transition-all duration-700 ease-out`}
                                                style={{ width: `${config.percent}%` }}
                                            />
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

## 3. Test Me Assessment Hub (`app/dashboard/test-me/page.tsx`)
```tsx
// Purpose: Test Me — Clean assessment hub with subject tabs and 3 action cards.
// Sprint 52: Stripped complex queue/challenge/rejected UI (now in Help Me).
// Focus: Download Past Papers, AI Generated Test, Start Digital Paper.

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

// Purpose: Subject filter configuration — no "All" tab per spec.
type AssessmentSubject = "Mathematics" | "Science" | "English" | "Chinese";

const SUBJECT_TABS: { key: AssessmentSubject; label: string; icon: any; color: string }[] = [
    { key: "Mathematics", label: "Mathematics", icon: CalculatorIcon, color: "bg-blue-100 text-blue-700" },
    { key: "Science", label: "Science", icon: FlaskConicalIcon, color: "bg-emerald-100 text-emerald-700" },
    { key: "English", label: "English", icon: BookOpenIcon, color: "bg-amber-100 text-amber-700" },
    { key: "Chinese", label: "Chinese", icon: LanguagesIcon, color: "bg-rose-100 text-rose-700" },
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
        <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 overflow-y-auto">
            {/* Purpose: Header. */}
            <header className="px-8 pt-6 pb-4 shrink-0">
                <div className="flex items-center gap-3 mb-1">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200">
                        <FileTextIcon size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Test Me</h1>
                        <p className="text-xs text-slate-500">Practice with past papers, AI tests, and digital assessments</p>
                    </div>
                </div>
            </header>

            {/* Purpose: Subject navigation bar — no "All" tab. */}
            <div className="px-8 pb-5 shrink-0">
                <div className="flex items-center gap-2">
                    {SUBJECT_TABS.map((tab) => {
                        const isActive = activeSubject === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveSubject(tab.key)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer border ${isActive
                                        ? `${tab.color} border-current shadow-sm`
                                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                    }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Purpose: 3-card action layout. */}
            <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Card 1: Download Past Papers */}
                <div className="flex flex-col rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-3">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                <DownloadIcon size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">Download Past Papers</h2>
                                <p className="text-[10px] text-slate-400">{filteredPapers.length} papers available</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 px-5 pb-5 space-y-2">
                        {filteredPapers.map((paper) => (
                            <button
                                key={paper.id}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-150 cursor-pointer group text-left"
                            >
                                <div>
                                    <p className="text-xs font-semibold text-slate-900">{paper.name}</p>
                                    <p className="text-[10px] text-slate-400">{paper.school} • {paper.year}</p>
                                </div>
                                <DownloadIcon size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Card 2: AI Generated Test */}
                <div className="flex flex-col rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-3">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
                                <SparklesIcon size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">AI Generated Test</h2>
                                <p className="text-[10px] text-slate-400">Custom test based on your focus area</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 px-5 pb-5 flex flex-col">
                        <label className="text-xs font-medium text-slate-600 mb-2">What topic should we focus on?</label>
                        <input
                            type="text"
                            value={aiTestFocus}
                            onChange={(e) => setAiTestFocus(e.target.value)}
                            placeholder={`e.g. "${activeSubject === "Mathematics" ? "Ratio and Percentage" : activeSubject === "Science" ? "Energy conversion" : activeSubject === "English" ? "Synthesis & Transformation" : "阅读理解"}"`}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all mb-4"
                        />
                        <button
                            disabled={!aiTestFocus.trim()}
                            className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-violet-200 hover:shadow-xl hover:scale-[1.01] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <SparklesIcon size={16} />
                            Generate Test
                        </button>
                    </div>
                </div>

                {/* Card 3: Start Digital Paper */}
                <div className="flex flex-col rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-3">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                                <PenToolIcon size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">Start Digital Paper</h2>
                                <p className="text-[10px] text-slate-400">Interactive quiz with instant grading</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 px-5 pb-5 flex flex-col">
                        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-4xl mb-4">
                                ✍️
                            </div>
                            <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed mb-6">
                                Answer MCQ and short-answer questions interactively with instant AI grading.
                            </p>
                        </div>
                        <button
                            onClick={() => router.push("/dashboard/test-me/digital-paper")}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                        >
                            <PenToolIcon size={16} />
                            Start Paper
                            <ChevronRightIcon size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

```

## 4. Digital Grading Engine (`app/dashboard/test-me/digital-paper/page.tsx`)
```tsx
// Purpose: Digital Paper — Interactive quiz with MCQ + Short Answer questions
// and a mock grading engine that scores answers after submission.
// Sprint 53: Stateful quiz execution environment (idle → in-progress → graded).

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Award, ChevronRight } from "lucide-react";

const ArrowLeftIcon = ArrowLeft as any;
const CheckCircle2Icon = CheckCircle2 as any;
const XCircleIcon = XCircle as any;
const ClockIcon = Clock as any;
const AwardIcon = Award as any;
const ChevronRightIcon = ChevronRight as any;

// Purpose: Quiz state machine type.
type QuizState = "idle" | "in-progress" | "graded";

// Purpose: Question types supported by the grading engine.
interface MCQQuestion {
    id: string;
    type: "mcq";
    question: string;
    options: string[];
    correctAnswer: number; // index into options
    topic: string;
}

interface ShortAnswerQuestion {
    id: string;
    type: "short-answer";
    question: string;
    correctAnswer: string;
    acceptableAnswers: string[]; // case-insensitive alternatives
    topic: string;
}

type QuizQuestion = MCQQuestion | ShortAnswerQuestion;

// Purpose: Mock quiz data — P6 Math mini-assessment (3 MCQ + 2 Short Answer).
const QUIZ_DATA: {
    title: string;
    subject: string;
    timeLimit: string;
    questions: QuizQuestion[];
} = {
    title: "P6 Mathematics — Mini Assessment",
    subject: "Mathematics",
    timeLimit: "15 minutes",
    questions: [
        {
            id: "q1",
            type: "mcq",
            question: "A shirt originally costs $80. It is sold at a 25% discount. What is the selling price?",
            options: ["$55", "$60", "$65", "$20"],
            correctAnswer: 1,
            topic: "Percentage",
        },
        {
            id: "q2",
            type: "mcq",
            question: "The ratio of boys to girls in a class is 3 : 5. If there are 24 boys, how many girls are there?",
            options: ["30", "35", "40", "45"],
            correctAnswer: 2,
            topic: "Ratio",
        },
        {
            id: "q3",
            type: "mcq",
            question: "A car travels at 60 km/h for 2.5 hours. What is the total distance travelled?",
            options: ["120 km", "140 km", "150 km", "160 km"],
            correctAnswer: 2,
            topic: "Speed",
        },
        {
            id: "q4",
            type: "short-answer",
            question: "Simplify the expression: 3x + 7 − x + 2",
            correctAnswer: "2x + 9",
            acceptableAnswers: ["2x + 9", "2x+9", "9 + 2x", "9+2x"],
            topic: "Algebra",
        },
        {
            id: "q5",
            type: "short-answer",
            question: "What is ¾ of 120?",
            correctAnswer: "90",
            acceptableAnswers: ["90"],
            topic: "Fractions",
        },
    ],
};

export default function DigitalPaperPage() {
    const router = useRouter();
    const [quizState, setQuizState] = useState<QuizState>("idle");
    // Purpose: Track selected MCQ answers (question id → option index).
    const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
    // Purpose: Track typed short-answer responses (question id → text).
    const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
    // Purpose: Grading results (question id → correct boolean).
    const [results, setResults] = useState<Record<string, boolean>>({});
    const [score, setScore] = useState(0);

    const totalQuestions = QUIZ_DATA.questions.length;

    // Purpose: Start the quiz — transition from idle to in-progress.
    const handleStart = () => {
        setQuizState("in-progress");
        setMcqAnswers({});
        setShortAnswers({});
        setResults({});
        setScore(0);
    };

    // Purpose: Handle MCQ option selection.
    const handleMcqSelect = (questionId: string, optionIndex: number) => {
        setMcqAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    };

    // Purpose: Handle short-answer text input.
    const handleShortAnswerChange = (questionId: string, value: string) => {
        setShortAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    // Purpose: Grade the quiz — compare answers against mock answer key.
    const handleSubmit = () => {
        const gradeResults: Record<string, boolean> = {};
        let correctCount = 0;

        for (const question of QUIZ_DATA.questions) {
            if (question.type === "mcq") {
                const selected = mcqAnswers[question.id];
                const isCorrect = selected === question.correctAnswer;
                gradeResults[question.id] = isCorrect;
                if (isCorrect) correctCount++;
            } else {
                const answer = (shortAnswers[question.id] || "").trim().toLowerCase();
                const isCorrect = question.acceptableAnswers.some(
                    (a) => a.toLowerCase() === answer
                );
                gradeResults[question.id] = isCorrect;
                if (isCorrect) correctCount++;
            }
        }

        setResults(gradeResults);
        setScore(correctCount);
        setQuizState("graded");
    };

    // Purpose: Check if all questions have been answered.
    const allAnswered = QUIZ_DATA.questions.every((q) => {
        if (q.type === "mcq") return mcqAnswers[q.id] !== undefined;
        return (shortAnswers[q.id] || "").trim().length > 0;
    });

    const percentage = Math.round((score / totalQuestions) * 100);

    return (
        <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 overflow-y-auto">
            {/* Purpose: Header with back navigation. */}
            <header className="px-8 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/dashboard/test-me")}
                        className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                        <ArrowLeftIcon size={16} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">{QUIZ_DATA.title}</h1>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <ClockIcon size={11} /> {QUIZ_DATA.timeLimit}
                            </span>
                            <span className="text-xs text-slate-500">
                                {totalQuestions} questions
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Purpose: Idle state — pre-quiz landing screen. */}
            {quizState === "idle" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-5xl mb-6 shadow-xl shadow-emerald-200">
                        ✍️
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{QUIZ_DATA.title}</h2>
                    <p className="text-sm text-slate-500 max-w-md mb-2">
                        This assessment contains {totalQuestions} questions — {QUIZ_DATA.questions.filter((q) => q.type === "mcq").length} multiple choice and {QUIZ_DATA.questions.filter((q) => q.type === "short-answer").length} short answer.
                    </p>
                    <p className="text-xs text-slate-400 mb-8">Time limit: {QUIZ_DATA.timeLimit}</p>
                    <button
                        onClick={handleStart}
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-lg font-bold shadow-xl shadow-emerald-200 hover:shadow-2xl hover:scale-[1.03] transition-all duration-200 cursor-pointer"
                    >
                        Begin Assessment
                        <ChevronRightIcon size={20} />
                    </button>
                </div>
            )}

            {/* Purpose: In-progress state — interactive quiz questions. */}
            {quizState === "in-progress" && (
                <div className="flex-1 px-8 py-6 space-y-6">
                    {QUIZ_DATA.questions.map((question, idx) => (
                        <div key={question.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-start gap-3 mb-4">
                                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-xs font-bold text-slate-600 shrink-0">
                                    {idx + 1}
                                </span>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900 leading-relaxed">{question.question}</p>
                                    <span className="inline-block mt-1 text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                                        {question.topic}
                                    </span>
                                </div>
                            </div>

                            {question.type === "mcq" ? (
                                <div className="space-y-2 ml-10">
                                    {question.options.map((option, optIdx) => {
                                        const isSelected = mcqAnswers[question.id] === optIdx;
                                        return (
                                            <button
                                                key={optIdx}
                                                onClick={() => handleMcqSelect(question.id, optIdx)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all duration-150 cursor-pointer ${isSelected
                                                        ? "border-violet-400 bg-violet-50 text-violet-900 font-medium shadow-sm"
                                                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-violet-500 bg-violet-500" : "border-slate-300"
                                                    }`}>
                                                    {isSelected && (
                                                        <span className="w-2 h-2 rounded-full bg-white" />
                                                    )}
                                                </span>
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="ml-10">
                                    <input
                                        type="text"
                                        value={shortAnswers[question.id] || ""}
                                        onChange={(e) => handleShortAnswerChange(question.id, e.target.value)}
                                        placeholder="Type your answer..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Purpose: Submit button — enabled only when all questions answered. */}
                    <div className="pb-8">
                        <button
                            onClick={handleSubmit}
                            disabled={!allAnswered}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-xl shadow-emerald-200 hover:shadow-2xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <CheckCircle2Icon size={18} />
                            Submit Assessment
                        </button>
                    </div>
                </div>
            )}

            {/* Purpose: Graded state — shows results with correct/incorrect badges. */}
            {quizState === "graded" && (
                <div className="flex-1 px-8 py-6 space-y-6">
                    {/* Purpose: Score summary card. */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
                        <div className={`w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg ${percentage >= 80
                                ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-200"
                                : percentage >= 50
                                    ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200"
                                    : "bg-gradient-to-br from-red-400 to-rose-500 shadow-red-200"
                            }`}>
                            <AwardIcon size={36} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">
                            {score} / {totalQuestions}
                        </h2>
                        <p className={`text-lg font-bold ${percentage >= 80 ? "text-emerald-600" : percentage >= 50 ? "text-amber-600" : "text-red-600"
                            }`}>
                            {percentage}%
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                            {percentage >= 80 ? "Excellent work! 🎉" : percentage >= 50 ? "Good effort! Keep practicing 💪" : "Don't worry, review the topics and try again 📚"}
                        </p>
                    </div>

                    {/* Purpose: Per-question results breakdown. */}
                    {QUIZ_DATA.questions.map((question, idx) => {
                        const isCorrect = results[question.id];
                        return (
                            <div
                                key={question.id}
                                className={`bg-white rounded-2xl border p-6 shadow-sm ${isCorrect ? "border-emerald-200" : "border-red-200"
                                    }`}
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <span className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${isCorrect ? "bg-emerald-100" : "bg-red-100"
                                        }`}>
                                        {isCorrect
                                            ? <CheckCircle2Icon size={16} className="text-emerald-600" />
                                            : <XCircleIcon size={16} className="text-red-600" />
                                        }
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900 leading-relaxed">
                                            Q{idx + 1}. {question.question}
                                        </p>
                                        <span className="inline-block mt-1 text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                                            {question.topic}
                                        </span>
                                    </div>
                                </div>

                                <div className="ml-10 space-y-1">
                                    {question.type === "mcq" ? (
                                        <>
                                            <p className="text-xs text-slate-500">
                                                Your answer: <span className={`font-semibold ${isCorrect ? "text-emerald-600" : "text-red-600"}`}>
                                                    {question.options[mcqAnswers[question.id]] || "—"}
                                                </span>
                                            </p>
                                            {!isCorrect && (
                                                <p className="text-xs text-emerald-600">
                                                    Correct answer: <span className="font-semibold">{question.options[question.correctAnswer]}</span>
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-xs text-slate-500">
                                                Your answer: <span className={`font-semibold ${isCorrect ? "text-emerald-600" : "text-red-600"}`}>
                                                    {shortAnswers[question.id] || "—"}
                                                </span>
                                            </p>
                                            {!isCorrect && (
                                                <p className="text-xs text-emerald-600">
                                                    Correct answer: <span className="font-semibold">{question.correctAnswer}</span>
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Purpose: Retry + back buttons. */}
                    <div className="flex gap-4 pb-8">
                        <button
                            onClick={handleStart}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-violet-200 hover:shadow-xl transition-all duration-200 cursor-pointer"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => router.push("/dashboard/test-me")}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-all duration-200 cursor-pointer"
                        >
                            Back to Test Me
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

```

