// Purpose: Sprint 26 — AuthProvider refactored to remove Ghost State.
// Sprint 133 — Added cookie sync to bridge Firebase client auth to Edge Middleware.
// All users must be verified (Google Sign-In) from Day 1. No more
// anonymous auth provisioning. The provider listens for auth state,
// sets loading=false when resolved, and syncs the __session cookie
// for the Edge Middleware to read.
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { syncAuthCookie } from "@/lib/auth-cookie-sync";

// Purpose: Expose the current Firebase User and loading state to any consuming component.
interface AuthContextValue {
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
});

// Purpose: Custom hook for clean consumer access to the auth context.
export function useAuth(): AuthContextValue {
    return useContext(AuthContext);
}

// Purpose: Provider component that subscribes to Firebase Auth state.
// Sprint 26: Removed signInAnonymously — all users must login via /login page.
// Sprint 133: Added syncAuthCookie to write the __session cookie for Edge Middleware.
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Purpose: Subscribe to Firebase auth state changes.
        const unsubscribe = onAuthStateChanged(auth, (resolvedUser) => {
            setUser(resolvedUser);
            setLoading(false);
        });

        // Purpose: Sprint 133 — Sync the Firebase ID token to a __session cookie
        // so the Edge Middleware can verify auth state on every request.
        const unsubscribeCookie = syncAuthCookie(auth);

        // Cleanup both subscriptions on unmount.
        return () => {
            unsubscribe();
            unsubscribeCookie();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
