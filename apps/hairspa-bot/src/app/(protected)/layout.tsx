"use client";

import { AuthProvider, AuthGuard } from "@/components/auth/AuthGuard";

// ---------------------------------------------------------------------------
// Purpose: Protected layout — wraps all child routes (portal, crm, dashboard)
// in the AuthGuard. The chat widget (/) and /api/* routes remain PUBLIC
// because they live outside this route group.
// ---------------------------------------------------------------------------

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AuthGuard>
                {children}
            </AuthGuard>
        </AuthProvider>
    );
}
