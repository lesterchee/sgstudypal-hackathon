// Purpose: Auth Upgrade Modal — triggers at the "Aha!" moment when the ghost
// user masters their first question (questionsMastered === 1). Prompts them
// to link an email/Google account to preserve their XP and unlock the Junior
// Vault. Handles the dismiss edge case with a cache-loss warning.

"use client";

import { useState } from "react";
import { Trophy, ShieldCheck, X, AlertTriangle } from "lucide-react";

const TrophyIcon = Trophy as any;
const ShieldCheckIcon = ShieldCheck as any;
const XIcon = X as any;
const AlertTriangleIcon = AlertTriangle as any;

// Purpose: Props for the AuthUpgradeModal component.
interface AuthUpgradeModalProps {
    /** Purpose: Whether the modal is visible. */
    isOpen: boolean;
    /** Purpose: Callback fired when the user clicks "Link My Account". */
    onUpgrade: () => void;
    /** Purpose: Callback fired when the user dismisses the modal. */
    onDismiss: () => void;
}

// Purpose: Main component — renders the conversion modal overlay with
// celebratory copy, Google Sign-In CTA, and a dismiss warning.
export default function AuthUpgradeModal({
    isOpen,
    onUpgrade,
    onDismiss,
}: AuthUpgradeModalProps) {
    // Purpose: Track whether the user has clicked "dismiss" once, showing
    // the cache-loss warning before actually closing the modal.
    const [showDismissWarning, setShowDismissWarning] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md mx-4 rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                {/* Purpose: Celebratory gradient header with trophy icon. */}
                <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 px-6 py-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <TrophyIcon size={32} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                        Boom! 🎉 First Concept Mastered!
                    </h2>
                </div>

                {/* Purpose: Main content — conversion copy and CTA. */}
                <div className="px-6 py-6 space-y-4">
                    <p className="text-sm text-slate-700 leading-relaxed text-center">
                        Don&apos;t lose your XP if your browser resets! Link an email to
                        <span className="font-bold text-violet-600"> save your progress</span> and
                        unlock the <span className="font-bold text-amber-600">Junior Vault</span>.
                    </p>

                    {/* Purpose: Google Sign-In CTA button — triggers the auth linking flow. */}
                    <button
                        onClick={onUpgrade}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                    >
                        <ShieldCheckIcon size={18} />
                        Link My Account (Google)
                    </button>

                    {/* Purpose: Dismiss flow — first click shows warning, second click closes. */}
                    {!showDismissWarning ? (
                        <button
                            onClick={() => setShowDismissWarning(true)}
                            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer py-2"
                        >
                            Maybe later
                        </button>
                    ) : (
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-2">
                            <div className="flex items-center gap-2">
                                <AlertTriangleIcon size={14} className="text-amber-600 shrink-0" />
                                <p className="text-xs font-semibold text-amber-800">
                                    Are you sure? If you clear your browser cache, all your
                                    progress and XP will be permanently lost.
                                </p>
                            </div>
                            <button
                                onClick={onDismiss}
                                className="w-full text-center text-xs text-amber-600 hover:text-amber-800 font-semibold transition-colors cursor-pointer py-1"
                            >
                                I understand, dismiss anyway
                            </button>
                        </div>
                    )}
                </div>

                {/* Purpose: Close button — top-right corner. */}
                <button
                    onClick={() => setShowDismissWarning(true)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors cursor-pointer"
                >
                    <XIcon size={16} className="text-white" />
                </button>
            </div>
        </div>
    );
}
