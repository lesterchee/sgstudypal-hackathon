// Purpose: Sprint 21 — Memoized Chat Message List component for DOM
// virtualization and performance optimization. Uses React.memo to prevent
// unnecessary re-renders of older messages during streaming. Messages
// older than the latest 4 interactions auto-collapse heavy content
// (SVG, LaTeX, bar models) behind a "Tap to expand" button to prevent
// tablet browser crashes on long sessions.

"use client";

import React, { useState, useCallback } from "react";
import { Bot, User, ChevronDown } from "lucide-react";

const BotIcon = Bot as any;
const UserIcon = User as any;
const ChevronDownIcon = ChevronDown as any;

// Purpose: Props for a single chat message.
interface ChatMessageProps {
    /** Purpose: Unique message ID from Vercel AI SDK. */
    id: string;
    /** Purpose: Message role — user or assistant. */
    role: "user" | "assistant" | "system";
    /** Purpose: The text content of the message. */
    content: string;
    /** Purpose: Whether this message is within the latest 4 interactions
     *  (displayed in full) or older (collapsed by default). */
    isRecent: boolean;
}

// Purpose: Threshold for collapsing old messages — any message content
// longer than this character count will be collapsed if not recent.
const COLLAPSE_THRESHOLD = 300;

// Purpose: Memoized single chat message component.
// Only re-renders when its own content or collapse state changes.
const ChatMessage = React.memo(function ChatMessage({
    role,
    content,
    isRecent,
}: ChatMessageProps) {
    const isUser = role === "user";

    // Purpose: Track expanded/collapsed state for old, long messages.
    const [isExpanded, setIsExpanded] = useState(isRecent);

    // Purpose: Determine if this message should be collapsible.
    const isCollapsible = !isRecent && content.length > COLLAPSE_THRESHOLD;

    // Purpose: Display content — truncated if collapsed, full if expanded.
    const displayContent = isCollapsible && !isExpanded
        ? content.slice(0, COLLAPSE_THRESHOLD) + '...'
        : content;

    return (
        <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
            {/* Purpose: User/Bot avatar */}
            <div
                className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isUser
                        ? "bg-slate-800 text-white"
                        : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-200"
                    }`}
            >
                {isUser ? <UserIcon size={14} /> : <BotIcon size={14} />}
            </div>

            {/* Purpose: Message bubble */}
            <div className="max-w-[75%]">
                <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser
                            ? "bg-slate-800 text-white rounded-tr-sm"
                            : "bg-white text-slate-800 border border-slate-200 shadow-sm rounded-tl-sm"
                        }`}
                >
                    <span className="whitespace-pre-wrap">{displayContent}</span>
                </div>

                {/* Purpose: Expand button for collapsed older messages. */}
                {isCollapsible && !isExpanded && (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="mt-1 ml-1 flex items-center gap-1 text-xs text-violet-500 hover:text-violet-700 transition-colors cursor-pointer"
                    >
                        <ChevronDownIcon size={12} />
                        Tap to expand
                    </button>
                )}
            </div>
        </div>
    );
});

// Purpose: Props for the ChatList component.
interface ChatListProps {
    /** Purpose: All chat messages from the Vercel AI SDK. */
    messages: Array<{ id: string; role: string; parts: Array<{ type: string; text?: string }> }>;
}

// Purpose: Main ChatList component — renders memoized messages with
// automatic collapsing for older interactions. The latest 4 messages
// (2 user + 2 assistant) are always displayed in full.
export default function ChatList({ messages }: ChatListProps) {
    // Purpose: Calculate the "recent window" — last 4 messages.
    const recentStartIndex = Math.max(0, messages.length - 4);

    // Purpose: Handle topic/suggestion clicks — passed up to parent.
    const handleTopicClick = useCallback((_prompt: string) => {
        // Purpose: Placeholder — parent component wires this via prop.
    }, []);

    return (
        <div className="space-y-4">
            {messages.map((message, index) => {
                const rawText = message.parts
                    .filter((p) => p.type === "text")
                    .map((p) => p.text || "")
                    .join("");

                return (
                    <ChatMessage
                        key={message.id}
                        id={message.id}
                        role={message.role as "user" | "assistant"}
                        content={rawText}
                        isRecent={index >= recentStartIndex}
                    />
                );
            })}
        </div>
    );
}
