"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useMemo, type FormEvent, useState } from "react";
import { SendHorizonal, User, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

// Purpose: Defines the configurable properties for the ChatInterface component.
export interface ChatInterfaceProps {
    /** API route the useChat hook will POST to */
    apiEndpoint?: string;
    /** Header title displayed at the top of the chat */
    title?: string;
    /** Placeholder text for the message input */
    placeholder?: string;
    /** Additional className for the outermost container */
    className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Extract the combined text content from a UIMessage's parts array. */
function getMessageText(message: UIMessage): string {
    return message.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

// Purpose: A full-featured chat UI component built on the Vercel AI SDK, handling message streams, error states, and auto-scrolling.
export function ChatInterface({
    apiEndpoint = "/api/chat",
    title = "AI Assistant",
    placeholder = "Type your message…",
    className = "",
}: ChatInterfaceProps) {
    const transport = useMemo(
        () => new DefaultChatTransport({ api: apiEndpoint }),
        [apiEndpoint],
    );

    const { messages, sendMessage, status, error } = useChat({ transport });

    const [input, setInput] = useState("");

    const isLoading = status === "submitted" || status === "streaming";

    /* ---- auto-scroll ---- */
    const bottomRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* ---- form submit ---- */
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;
        sendMessage({ text: trimmed });
        setInput("");
    };

    return (
        <div className={`flex flex-col h-screen w-full relative font-sans ${className}`}>
            {/* ─── Scrollable Message List ─── */}
            <div className="flex-1 w-full overflow-y-auto flex flex-col pb-32">
                {/* Empty state */}
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 animate-[fadeIn_0.5s_ease-out]">
                        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10">
                            <Sparkles className="w-8 h-8 text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-lg font-medium text-slate-700">
                                How can I help you today?
                            </p>
                            <p className="mt-1 text-sm text-slate-400 max-w-sm">
                                Ask me anything — I&apos;ll do my best to provide clear,
                                helpful answers.
                            </p>
                        </div>
                    </div>
                )}

                {/* Message rows — full-width, content constrained */}
                <div className="space-y-6">
                    {messages.map((msg) => {
                        const isUser = msg.role === "user";
                        const text = getMessageText(msg);
                        if (!text) return null;

                        return (
                            <div
                                key={msg.id}
                                className={`w-full flex justify-center animate-[fadeSlideUp_0.3s_ease-out] ${isUser ? "bg-slate-50/80" : "bg-white"
                                    }`}
                            >
                                <div className="w-full max-w-3xl px-4 py-6 flex gap-4">
                                    {/* Avatar */}
                                    <div
                                        className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-lg mt-0.5 ${isUser
                                            ? "bg-slate-700 text-white"
                                            : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                                            }`}
                                    >
                                        {isUser ? (
                                            <User className="w-3.5 h-3.5" />
                                        ) : (
                                            <Sparkles className="w-3.5 h-3.5" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 text-xs uppercase tracking-wide mb-2">
                                            {isUser ? "You" : title}
                                        </p>
                                        {isUser ? (
                                            <p className="whitespace-pre-wrap text-base md:text-lg leading-relaxed text-slate-700">
                                                {text}
                                            </p>
                                        ) : (
                                            <div className="prose prose-slate prose-lg max-w-none prose-p:leading-relaxed prose-headings:text-slate-900 prose-a:text-indigo-600 prose-strong:text-slate-900">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        code: ({ children, className: codeClassName }) => {
                                                            const isInline = !codeClassName;
                                                            return isInline ? (
                                                                <code className="px-1.5 py-0.5 rounded-md bg-slate-100 text-indigo-600 text-xs font-mono">
                                                                    {children}
                                                                </code>
                                                            ) : (
                                                                <code className="block p-4 my-3 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto">
                                                                    {children}
                                                                </code>
                                                            );
                                                        },
                                                    }}
                                                >
                                                    {text}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Typing indicator */}
                {isLoading && (
                    <div className="w-full flex justify-center bg-white animate-[fadeSlideUp_0.3s_ease-out]">
                        <div className="w-full max-w-3xl px-4 py-6 flex gap-4">
                            <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                                <Sparkles className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex items-center gap-1.5 pt-1">
                                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:0ms]" />
                                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:150ms]" />
                                <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:300ms]" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Error display */}
                {error && (
                    <div className="w-full flex justify-center">
                        <div className="w-full max-w-3xl px-4 py-3">
                            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                                <p className="font-medium">Something went wrong</p>
                                <p className="mt-1 text-red-500/80 text-xs">
                                    {error.message}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* ─── Bottom-Docked Input Bar ─── */}
            <form
                onSubmit={handleSubmit}
                className="fixed bottom-0 left-0 w-full flex justify-center bg-gradient-to-t from-white via-white to-transparent pb-8 pt-10 px-4"
            >
                <div className="w-full max-w-3xl bg-white shadow-xl border border-slate-200 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={placeholder}
                            className="flex-1 bg-transparent text-base text-slate-800 placeholder:text-slate-400 focus:outline-none py-2"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800 text-white hover:bg-slate-700 active:scale-95 transition-all duration-200 disabled:opacity-30 disabled:hover:bg-slate-800 disabled:cursor-not-allowed"
                            aria-label="Send message"
                        >
                            <SendHorizonal className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
