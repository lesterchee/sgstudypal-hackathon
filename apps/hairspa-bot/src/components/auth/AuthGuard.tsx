"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getClientAuth } from "@/lib/firebase/client";

// ---------------------------------------------------------------------------
// Purpose: React Context + hook to expose Firebase auth state app-wide.
// ---------------------------------------------------------------------------

interface AuthContextValue {
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function useAuth() {
    return useContext(AuthContext);
}

// ---------------------------------------------------------------------------
// Purpose: Provider that listens to onAuthStateChanged and cleans up on
// unmount to prevent memory leaks.
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(getClientAuth(), (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        // Purpose: Proper cleanup — prevents memory leaks on unmount.
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// ---------------------------------------------------------------------------
// Purpose: Gate component — prevents unauthenticated users from viewing
// protected routes. Shows a loading spinner while auth state resolves,
// redirects to /login if no user, renders children if authenticated.
// ---------------------------------------------------------------------------

export function AuthGuard({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [loading, user, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f7f5]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#f48c25] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-slate-400 font-medium">Loading…</p>
                </div>
            </div>
        );
    }

    if (!user) {
        // Purpose: Return null while redirect is in progress to prevent flash of content.
        return null;
    }

    return <>{children}</>;
}
