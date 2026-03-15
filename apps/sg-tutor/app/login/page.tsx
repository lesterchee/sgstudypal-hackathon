"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithRedirect, getRedirectResult, signInAnonymously, signInWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider, appleProvider } from "@/lib/firebase";
import { LogIn, Apple } from "lucide-react";

const LogInIcon = LogIn as any;
const AppleIcon = Apple as any;

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    // Purpose: Listens for incoming authenticated sessions and pushes to dashboard.
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                router.push("/dashboard");
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Purpose: Actively awaits and processes returning Firebase OAuth redirect tokens.
    useEffect(() => {
        const processAuth = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result?.user) {
                    router.push("/dashboard");
                }
            } catch (err: any) {
                console.error("Firebase Redirect Result Error:", err);
                setError(err.message || "Sign-in redirect failed. Please try again.");
            }
        };
        processAuth();
    }, [router]);

    // Purpose: Redirect-based Google Auth.
    const handleGoogleLogin = async () => {
        setError(null);
        try {
            await signInWithRedirect(auth, googleProvider);
        } catch (err: any) {
            console.error("Firebase Auth Error (Google):", err);
            setError(err.message || "Google sign-in failed. Please try again.");
        }
    };

    // Purpose: Redirect-based Apple Auth.
    const handleAppleLogin = async () => {
        setError(null);
        try {
            await signInWithRedirect(auth, appleProvider);
        } catch (err: any) {
            console.error("Firebase Auth Error (Apple):", err);
            setError(err.message || "Apple sign-in failed. Please try again.");
        }
    };

    // Purpose: Bypasses localhost OAuth restrictions for dev testing by generating a real Firebase Anonymous session.
    const handleGuestLogin = async () => {
        setError(null);
        try {
            await signInAnonymously(auth);
            router.push("/dashboard");
        } catch (err: any) {
            console.error("Ghost Key Error:", err);
            setError(err.message || "Guest login failed.");
        }
    };

    // Purpose: Sprint 162 — Hackathon Judge Login Bypass.
    const handleJudgeLogin = async () => {
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, "judge@devpost.com", "geminilive2026");
            router.push("/live");
        } catch (err: any) {
            console.error("Firebase Auth Error (Judge):", err);
            setError(err.message || "Judge login failed.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">SgStudyPal</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in to access your dashboard
                    </p>
                </div>

                {error && (
                    <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <button
                        onClick={handleGoogleLogin}
                        className="flex items-center justify-center w-full px-4 py-3 space-x-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        <LogInIcon className="w-5 h-5" />
                        <span>Continue with Google</span>
                    </button>

                    <button
                        onClick={handleAppleLogin}
                        className="flex items-center justify-center w-full px-4 py-3 space-x-2 text-sm font-medium text-white bg-black border border-transparent rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                    >
                        <AppleIcon className="w-5 h-5" />
                        <span>Continue with Apple</span>
                    </button>

                    <div className="relative pt-4 pb-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 text-gray-400 bg-white">or for developers</span>
                        </div>
                    </div>

                    {/* Purpose: Sprint 162 — High-visibility Devpost Judge login button */}
                    <button
                        onClick={handleJudgeLogin}
                        className="flex items-center justify-center w-full px-4 py-3 space-x-2 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg shadow-lg hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:-translate-y-0.5"
                    >
                        <span>✨ Log in as Devpost Judge</span>
                    </button>

                    <button
                        onClick={handleGuestLogin}
                        className="flex items-center justify-center w-full px-4 py-3 space-x-2 text-sm font-medium text-gray-500 bg-transparent border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
                    >
                        <span>Test as Guest (Dev Bypass)</span>
                    </button>
                </div>

                <div className="text-center text-xs text-gray-500 pt-4">
                    By continuing, you agree to our Terms of Service and Privacy Policy. Securely encrypted via Ghost Data Protocol.
                </div>
            </div>
        </div>
    );
}
