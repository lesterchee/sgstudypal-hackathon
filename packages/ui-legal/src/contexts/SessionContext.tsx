"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface SessionContextType {
    caseId: string | null;
    setCaseId: (id: string | null) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [caseId, setCaseId] = useState<string | null>(null);

    return (
        <SessionContext.Provider value={{ caseId, setCaseId }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error("useSession must be used within a SessionProvider");
    }
    return context;
}
