"use client";

/**
 * TypingIndicator
 *
 * A sleek three-dot bouncing animation that signals the AI agent is composing
 * a response. Styled to match the hairspa-bot slate bubble theme.
 *
 * Usage:
 *   import { TypingIndicator } from "@repo/ui-chat";
 *   {isLoading && lastRole === "user" && <TypingIndicator />}
 */
// Purpose: A visual indicator displaying animated dots to signal that the AI is actively generating a response.
export function TypingIndicator() {
    return (
        <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-200 bg-slate-100 px-4 py-3.5 shadow-sm">
                <span
                    className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms] [animation-duration:900ms]"
                    aria-hidden="true"
                />
                <span
                    className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:200ms] [animation-duration:900ms]"
                    aria-hidden="true"
                />
                <span
                    className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:400ms] [animation-duration:900ms]"
                    aria-hidden="true"
                />
                <span className="sr-only">Melinda is typing…</span>
            </div>
        </div>
    );
}
