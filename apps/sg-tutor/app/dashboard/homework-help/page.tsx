// Purpose: Help Me — Master/Detail Triage layout (Sprint 65).
// Left Sidebar (w-72): Tab toggle (Recent/Solved/Rejected), vertical queue slides, sticky upload button.
// Right Main Area: Selected image preview + Socratic AI chat.
// Upload Modal: Overlay with drag & drop zone + QR Connect.

"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
    Send, ImagePlus, X, Bot, User, WifiOff,
    Clock, CheckCircle2, EyeOff, QrCode, Upload, PanelLeft
} from "lucide-react";

const SendIcon = Send as any;
const ImagePlusIcon = ImagePlus as any;
const XIcon = X as any;
const BotIcon = Bot as any;
const UserIcon = User as any;
const WifiOffIcon = WifiOff as any;
const ClockIcon = Clock as any;
const CheckCircle2Icon = CheckCircle2 as any;
const EyeOffIcon = EyeOff as any;
const QrCodeIcon = QrCode as any;
const UploadIcon = Upload as any;
const PanelLeftIcon = PanelLeft as any;

// Purpose: Triage tab type.
type TriageTab = "recent" | "solved" | "rejected";

// Purpose: Production demo data — 2 real P6 Math problems from the
// public/homework-help directory. Thumbnails point to actual image assets.
const PENDING_QUESTIONS = [
    { id: "sample-math", subject: "Math P6", topic: "Fractions", timestamp: "Just now", thumbnail: "/homework-help/math-problem-1.png" },
    { id: "q1", subject: "Math P6", topic: "Speed", timestamp: "2 min ago", thumbnail: "/homework-help/math-problem-2.png" },
];

// Purpose: Mock data — recently solved papers.
const RECENTLY_SOLVED = [
    { id: "r1", name: "2024 Nanyang Prelim (Math)", score: "38/40", date: "Yesterday" },
    { id: "r2", name: "2024 Raffles Prelim (Science)", score: "27/30", date: "3 days ago" },
    { id: "r3", name: "2024 PSLE Paper 1 (Math)", score: "42/45", date: "1 week ago" },
];

// Purpose: Mock data — Vision Bouncer rejected uploads.
const REJECTED_UPLOADS = [
    { id: "rej1", fileName: "selfie_math.jpg", reasonCode: "FACE_DETECTED" as const, message: "🔒 Face detected. Please crop or retake.", rejectedAt: "5 min ago" },
    { id: "rej2", fileName: "meme_upload.png", reasonCode: "NON_EDUCATIONAL" as const, message: "📚 Not a homework question.", rejectedAt: "20 min ago" },
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

export default function HomeworkHelpPage() {
    // Purpose: Intercept the SDK's internal fetch to inject base64 imageData
    // into the request body. The DefaultChatTransport's fetch override fires
    // on every sendMessage call, reading pendingImageRef at call-time.
    // This bypasses the SDK's scrubber that drops custom body properties,
    // guaranteeing the base64 imageData reaches the Next.js route intact.
    const { messages, sendMessage, status, error } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
            fetch: async (input, init) => {
                const reqBody = JSON.parse(init?.body as string);
                const customBody = {
                    ...reqBody,
                    imageData: pendingImageRef.current || undefined,
                };
                return globalThis.fetch(input, {
                    ...init,
                    body: JSON.stringify(customBody),
                });
            },
        }),
    });
    const [activeTab, setActiveTab] = useState<TriageTab>("recent");
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [reconnectCountdown, setReconnectCountdown] = useState(0);
    const [showUploadModal, setShowUploadModal] = useState(false);
    // Purpose: Track selected queue item for right-panel image preview.
    const [selectedQueueItem, setSelectedQueueItem] = useState<string | null>(null);
    // Purpose: Sprint 96 — Collapsible sidebar toggle.
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Purpose: Sprint 105 — Anti-Jitter. Use instant scroll during streaming to prevent layout thrashing, and smooth scroll when finished.
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const isCurrentlyStreaming = status === "streaming" || status === "submitted";
        messagesEndRef.current?.scrollIntoView({
            behavior: isCurrentlyStreaming ? "auto" : "smooth"
        });
    }, [messages, status]);

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
    // Purpose: Stable ref bridge for the fetch interceptor to read pending image
    // without triggering re-renders or stale closure issues in the hook.
    const pendingImageRef = useRef<string | null>(null);

    const isStreaming = status === "streaming" || status === "submitted";

    const processFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = () => {
            setPendingImages((prev) => {
                const updated = [
                    ...prev,
                    { name: file.name, dataUrl: reader.result as string },
                ];
                // Purpose: Sprint 133 — Persist uploaded filenames for Live Tutor cross-page bridge.
                localStorage.setItem("pendingHomework", updated.map((f) => f.name).join(", "));
                return updated;
            });
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
        setPendingImages((prev) => {
            const updated = prev.filter((_, i) => i !== index);
            // Purpose: Sprint 133 — Sync localStorage when images are removed.
            if (updated.length > 0) {
                localStorage.setItem("pendingHomework", updated.map((f) => f.name).join(", "));
            } else {
                localStorage.removeItem("pendingHomework");
            }
            return updated;
        });
    };

    // Purpose: Sprint 105 — Bridge local image state to the fetch interceptor
    // ref and trigger SDK submission. The fetch override on DefaultChatTransport
    // reads pendingImageRef.current at call-time, injecting imageData into the
    // POST body before it leaves the browser.
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputText.trim();
        if (!text && pendingImages.length === 0) return;

        // Purpose: Write pending image to ref so the fetch interceptor can grab it.
        pendingImageRef.current = pendingImages.length > 0
            ? pendingImages[0].dataUrl
            : null;

        sendMessage({ text: text || (pendingImages.length > 0 ? "Please analyze this image." : "") });

        setInputText("");
        setPendingImages([]);
    };

    const handleTopicClick = (prompt: string) => {
        sendMessage({ text: prompt });
    };

    // Purpose: Sprint 105.2 — Fix mock queue item clicks dropping the image payload.
    // Fetch the local public image, convert to base64, and route it through the
    // pendingImageRef side-channel so the fetch interceptor injects imageData.
    const handleQueueItemClick = async (id: string, subject: string, thumbnailPath?: string) => {
        setSelectedQueueItem(id);

        let base64Data: string | undefined = undefined;

        if (thumbnailPath && thumbnailPath.startsWith("/")) {
            try {
                const response = await fetch(thumbnailPath);
                const blob = await response.blob();
                const reader = new FileReader();
                base64Data = await new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            } catch (err) {
                console.error("Failed to convert thumbnail to base64", err);
            }
        }

        const text = id === "sample-math"
            ? "I've uploaded a photo of a Math problem, but it might be a bit blurry. Could you please extract the text, read it back to me, and confirm the details before we start solving it together?"
            : `I've received your image for ${subject}. Just to confirm, is this the question you want to tackle?`;

        // Purpose: Inject the base64 data into the pendingImageRef for the fetch interceptor.
        pendingImageRef.current = base64Data || null;
        sendMessage({ text });
    };

    // Purpose: Tab configuration.
    const TABS: { key: TriageTab; label: string; count: number }[] = [
        { key: "recent", label: "Recent", count: PENDING_QUESTIONS.length },
        { key: "solved", label: "Solved", count: RECENTLY_SOLVED.length },
        { key: "rejected", label: "Rejected", count: REJECTED_UPLOADS.length },
    ];

    return (
        <div className="flex-1 flex h-full bg-gray-50 dark:bg-slate-950 relative">
            {/* Purpose: Sprint 96 — LEFT SIDEBAR (collapsible w-72). */}
            <aside className={`${isSidebarOpen ? "w-72 flex" : "hidden"} flex-col shrink-0 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 md:flex transition-all`}>
                {/* Purpose: Sprint 96 — Upload button moved to very top. */}
                <div className="shrink-0 p-3 border-b border-gray-200 dark:border-slate-800">
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-500 transition-colors cursor-pointer"
                    >
                        <UploadIcon size={14} />
                        Upload More Questions
                    </button>
                </div>

                {/* Purpose: Tab pill-toggle — hidden for hackathon demo.
                <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 shrink-0">
                    <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${activeTab === tab.key
                                    ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                                    }`}
                            >
                                {tab.label} <span className="text-[9px] opacity-60">{tab.count}</span>
                            </button>
                        ))}
                    </div>
                </div>
                */}

                {/* Purpose: Scrollable queue list — large thumbnail cards. */}
                <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1.5 min-h-0">
                    {activeTab === "recent" && PENDING_QUESTIONS.map((q) => (
                        <button
                            key={q.id}
                            onClick={() => handleQueueItemClick(q.id, q.subject, q.thumbnail)}
                            className={`w-full flex flex-col items-center p-3 rounded-lg transition-all text-center cursor-pointer ${selectedQueueItem === q.id
                                ? "bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700"
                                : "hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent"
                                }`}
                        >
                            <div className="w-full h-24 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-3xl mb-2 overflow-hidden">
                                {q.thumbnail.startsWith("/") ? (
                                    <img src={q.thumbnail} alt={q.topic} className="w-full h-full object-cover" />
                                ) : (
                                    q.thumbnail
                                )}
                            </div>
                            <p className="text-xs font-semibold text-gray-800 dark:text-white">{q.subject}</p>
                            <p className="text-[9px] text-gray-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                                <ClockIcon size={8} /> {q.timestamp}
                            </p>
                        </button>
                    ))}

                    {activeTab === "solved" && RECENTLY_SOLVED.map((s) => (
                        <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-transparent">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                                <CheckCircle2Icon size={14} className="text-emerald-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-800 dark:text-white truncate">{s.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{s.score}</span>
                                    <span className="text-[9px] text-gray-400 dark:text-slate-500">{s.date}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {activeTab === "rejected" && REJECTED_UPLOADS.map((r) => (
                        <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-transparent">
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                <EyeOffIcon size={14} className="text-red-500 dark:text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-red-700 dark:text-red-400 truncate">{r.fileName}</p>
                                <p className="text-[9px] text-red-400 dark:text-red-500/70 mt-0.5">{r.message}</p>
                            </div>
                        </div>
                    ))}

                    {/* Purpose: Pending image thumbnails from local uploads. */}
                    {pendingImages.map((img, i) => (
                        <div key={`img-${i}`} className="relative group p-1">
                            <img src={img.dataUrl} alt={img.name} className="w-full rounded-lg object-cover border border-gray-200 dark:border-slate-700" />
                            <button
                                onClick={() => removeImage(i)}
                                className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <XIcon size={10} />
                            </button>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Purpose: RIGHT MAIN AREA — Image preview + Socratic Chat. */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Purpose: Sprint 96 — Sidebar toggle button. */}
                <div className="shrink-0 px-4 py-2 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
                    >
                        <PanelLeftIcon size={16} />
                    </button>
                </div>
                {/* Purpose: Reconnection + error banners. */}
                {isReconnecting && (
                    <div className="mx-4 mt-3 px-4 py-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2 shrink-0">
                        <WifiOffIcon size={14} className="shrink-0" />
                        Reconnecting in {reconnectCountdown}s...
                    </div>
                )}
                {error && !isReconnecting && (
                    <div className="mx-4 mt-3 px-4 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-lg text-xs text-red-700 dark:text-red-400 shrink-0">
                        <span className="font-semibold">Error:</span> {error.message}
                    </div>
                )}

                {/* Purpose: Sprint 96 — Chat messages area with standardized font. */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
                            <div className="w-14 h-14 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                                <BotIcon size={24} className="text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-1">AI Tutor</h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm">
                                    Select a question from the queue or upload a new one to get started.
                                </p>
                            </div>
                        </div>
                    )}

                    {messages.map((message, idx) => {
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
                                    ? "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300"
                                    : "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
                                    }`}>
                                    {isUser ? <UserIcon size={12} /> : <BotIcon size={12} />}
                                </div>
                                <div className="max-w-[75%]">
                                    <div className={`rounded-xl px-3 py-2 text-base font-sans leading-relaxed ${isUser
                                        ? "bg-gray-800 dark:bg-slate-700 text-white rounded-tr-sm"
                                        : "bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-tl-sm"
                                        }`}>
                                        <span className="whitespace-pre-wrap">{mainContent}</span>
                                    </div>

                                    {/* Purpose: Sprint 130 — Guided CUI. Conditionally render Action Rows based on the AI's current state in the tutoring loop. */}
                                    {!isUser && idx === messages.length - 1 && !isStreaming && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {mainContent.includes("Is my understanding of the question correct?") ? (
                                                <>
                                                    {/* OCR Verification Flow */}
                                                    <button
                                                        onClick={() => sendMessage({ text: "Yes, help me solve it." })}
                                                        className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-md transition-colors shadow-sm cursor-pointer"
                                                    >
                                                        ✅ Yes, help me solve it
                                                    </button>
                                                    <button
                                                        onClick={() => sendMessage({ text: "No, let me clarify. The correct question is: " })}
                                                        className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-md transition-colors shadow-sm cursor-pointer"
                                                    >
                                                        ❌ No, let me clarify
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Post-Solution Learning Flow */}
                                                    <button
                                                        onClick={() => sendMessage({ text: "I'm good. Give me a new, similar question to test my understanding." })}
                                                        className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-md transition-colors shadow-sm cursor-pointer"
                                                    >
                                                        🔄 I&apos;m good. Give me a similar question
                                                    </button>
                                                    <button
                                                        onClick={() => sendMessage({ text: "I'm still a bit stuck. This concept isn't quite clicking for me yet. Could you explain the hardest part one more time using a different approach? Break it down into bite-sized pieces for a 12-year-old. Using a clear analogy from everyday life in Singapore—like taking the MRT, buying food at the hawker centre, or managing pocket money—would really help me visualize it." })}
                                                        className="text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-md transition-colors shadow-sm cursor-pointer"
                                                    >
                                                        💡 I need more help. Explain this further
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {isStreaming && messages.at(-1)?.role === "user" && (
                        <div className="flex items-start gap-2">
                            <div className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400">
                                <BotIcon size={12} />
                            </div>
                            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl rounded-tl-sm px-3 py-2">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Purpose: Sticky chat input bar. */}
                <div className="shrink-0 px-6 py-3 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <form onSubmit={handleFormSubmit} className="flex items-end gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="shrink-0 w-9 h-9 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-400 hover:text-violet-600 hover:border-violet-300 transition-all cursor-pointer"
                            title="Upload image"
                        >
                            <ImagePlusIcon size={16} />
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
                                className="w-full resize-none rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
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

            {/* Purpose: Upload Modal — full-screen overlay with drag & drop + QR code. */}
            {showUploadModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Upload Questions</h2>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                <XIcon size={14} />
                            </button>
                        </div>

                        {/* Purpose: Drag & Drop zone. */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => { handleDrop(e); setShowUploadModal(false); }}
                            onClick={() => { fileInputRef.current?.click(); setShowUploadModal(false); }}
                            className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all mb-4 ${isDragging
                                ? "border-violet-400 bg-violet-50 dark:bg-violet-900/30"
                                : "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-600"
                                }`}
                        >
                            <UploadIcon size={28} className="text-gray-400 dark:text-slate-500 mb-2" />
                            <p className="text-sm font-medium text-gray-600 dark:text-slate-300">Drop images or click to upload</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">PNG, JPEG, WEBP</p>
                        </div>

                        {/* Purpose: QR Connect section. */}
                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                            <div className="w-16 h-16 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 border border-gray-200 dark:border-slate-700">
                                <QrCodeIcon size={32} className="text-gray-300 dark:text-slate-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-800 dark:text-white">📱 Scan to Upload via Mobile</p>
                                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">Point your phone camera at the QR code</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Purpose: Drag overlay for the main area. */}
            {isDragging && !showUploadModal && (
                <div className="absolute inset-0 bg-violet-50/90 dark:bg-violet-950/90 backdrop-blur-sm flex items-center justify-center z-40 border-4 border-dashed border-violet-400 rounded-xl m-2">
                    <div className="text-center">
                        <UploadIcon size={48} className="text-violet-500 mx-auto mb-3" />
                        <p className="text-violet-700 dark:text-violet-300 font-medium text-lg">Drop your image here</p>
                    </div>
                </div>
            )}
        </div>
    );
}
