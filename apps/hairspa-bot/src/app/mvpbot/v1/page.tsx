import { redirect } from "next/navigation";

// ---------------------------------------------------------------------------
// Purpose: Legacy MVP route — all traffic is now redirected to the dynamic
// multi-tenant chat route. This eliminates duplicate widget code and
// establishes /chat/[botId] as the single source of truth.
// ---------------------------------------------------------------------------

export default function LegacyMVPRedirect() {
    redirect("/chat/3e3bb407-c85e-4624-a7a2-bf7983f68cfe");
}
