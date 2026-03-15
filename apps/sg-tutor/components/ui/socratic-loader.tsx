// Purpose: Socratic Skeleton Loader — displays cycling loading messages while
// the AI Tutor processes a question. Messages rotate every 3 seconds via
// useEffect interval. Safely cleans up the interval on unmount or when the
// API returns early (even if response arrives in <3s).

"use client";

import { useState, useEffect } from "react";
import { Brain } from "lucide-react";

const BrainIcon = Brain as any;

// Purpose: Loading message sequence — designed to feel conversational and
// to set the student's expectation of what the AI is doing behind the scenes.
const LOADING_MESSAGES = [
    "Analyzing your working... 🔍",
    "Extracting the numbers... 🔢",
    "Checking the syllabus rules... 📚",
    "Preparing your first hint... 💡",
];

// Purpose: Props for the SocraticLoader component.
interface SocraticLoaderProps {
    /** Purpose: Whether the loader is actively shown. When false, the component
     *  renders nothing and the interval is cleaned up. */
    isLoading: boolean;
}

// Purpose: Main component — renders an animated loading card with cycling
// messages. The interval auto-cleans on unmount or when isLoading flips to false.
export default function SocraticLoader({ isLoading }: SocraticLoaderProps) {
    const [messageIndex, setMessageIndex] = useState(0);

    // Purpose: Cycle messages every 3 seconds. Cleans up on unmount or when
    // isLoading switches to false (e.g., API returns in <3s).
    useEffect(() => {
        if (!isLoading) {
            // Purpose: Reset to first message when loading stops, so the next
            // time it starts, it begins from "Analyzing your working..."
            setMessageIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 3000);

        // Purpose: Cleanup — prevent memory leaks and stale intervals.
        return () => clearInterval(interval);
    }, [isLoading]);

    // Purpose: Don't render anything when not loading.
    if (!isLoading) return null;

    return (
        <div className="flex items-start gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Purpose: AI avatar with a pulsing animation to indicate activity. */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0 animate-pulse">
                <BrainIcon size={16} className="text-white" />
            </div>

            {/* Purpose: Loading card with the current cycling message. */}
            <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-white border border-slate-200 shadow-sm">
                {/* Purpose: Animated dots indicator. */}
                <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>

                {/* Purpose: Current loading message — transitions on each 3s cycle. */}
                <p className="text-sm text-slate-600 font-medium transition-all duration-300">
                    {LOADING_MESSAGES[messageIndex]}
                </p>
            </div>
        </div>
    );
}
