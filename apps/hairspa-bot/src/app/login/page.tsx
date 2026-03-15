"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getClientAuth } from "@/lib/firebase/client";
import { Cpu, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Purpose: Authenticates merchants into the CommitPay platform using
// Firebase Email/Password Auth and redirects to the verified dashboard.
// ---------------------------------------------------------------------------
export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(getClientAuth(), email, password);
            router.push("/dashboard");
        } catch {
            setError("Invalid credentials. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                {/* Logo / Branding */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-5 shadow-lg shadow-violet-600/20">
                        <Cpu className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                        CommitPay AI
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1.5">
                        Sign in to your merchant dashboard
                    </p>
                </div>

                {/* Login Card */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm space-y-5"
                >
                    {error && (
                        <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2">
                            <span className="shrink-0">⚠️</span>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            autoComplete="email"
                            className="appearance-none block w-full px-3 py-2.5 border border-zinc-300 rounded-lg shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-violet-500 focus:border-violet-500 text-[16px] sm:text-sm bg-zinc-50"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            autoComplete="current-password"
                            className="appearance-none block w-full px-3 py-2.5 border border-zinc-300 rounded-lg shadow-sm placeholder-zinc-400 focus:outline-none focus:ring-violet-500 focus:border-violet-500 text-[16px] sm:text-sm bg-zinc-50"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg text-sm font-semibold shadow-sm transition-all focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Signing in…
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </button>

                    <p className="text-xs text-zinc-400 text-center italic pt-1">
                        This is an invite-only platform. Contact your
                        administrator for access.
                    </p>
                </form>
            </div>
        </div>
    );
}
