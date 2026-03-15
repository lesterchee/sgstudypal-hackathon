// ---------------------------------------------------------------------------
// Multi-Tenant SaaS Types — CommitPay AI Engine
// ---------------------------------------------------------------------------

export type SubscriptionTier = "beta" | "pro" | "enterprise";
export type LeadStatus =
    | "Pending Checkout"
    | "Converted"
    | "Engaged"
    | "Escalated";

export interface Organization {
    id: string;
    companyName: string;
    ownerEmail: string;
    stripeCustomerId: string | null;
    subscriptionTier: SubscriptionTier;
    createdAt: number; // Unix timestamp
}

export interface BotConfig {
    id: string;
    orgId: string;
    botName: string;
    regularPrice: string;
    flashOffer: string;
    checkoutUrl?: string; // external checkout gateway URL (e.g. CommitPay)
    coreObjective: string;
    fomoMessage: string;
    guidedFunnel: {
        secureOfferText: string;
        secureOfferVariations: string[];
        commitPayUrl: string;
        questionText: string;
        bookLaterText: string;
    };
    finalContactQuestion: string;
    appointmentSlots: string[]; // e.g., ["10am - 12pm", "12pm - 4pm", "4pm - 8pm"]
    appointmentDays: string[]; // e.g., ["Monday", "Tuesday", ...]
    knowledgeBase: {
        websiteUrl: string;
        businessFacts?: string;
        faqs?: string; // Future-proofing alias — portal currently uses businessFacts for FAQs
        youtubeAssets?: { url: string; purpose: string }[];
        supportPhone?: string;
        supportEmail: string;
    };
    brandSettings: {
        primaryColor: string;
        logoUrl?: string;
        avatarUrl?: string;
    };
    updatedAt: number; // Unix timestamp
    deletedAt?: number | null; // Unix timestamp — null/undefined = active
}

export interface Lead {
    id: string;
    botId: string;
    orgId: string;
    name?: string;
    email?: string;
    phone?: string;
    preferredOutlet?: string;
    preferredDay?: string;
    preferredTime?: string;
    offerIntent?: "flash" | "regular";
    contactPreference?: string;
    status: LeadStatus;
    createdAt: number; // Unix timestamp
    // Purpose: Click-to-Pay tracking fields (set by /pay/[botId] route).
    clickedPay?: boolean;
    clickedPayAt?: any; // Firestore Timestamp
    // Purpose: Closed-loop payment tracking (set by payment gateway webhook).
    paymentStatus?: string; // e.g. "PAID"
    paymentAmount?: number; // cents
    // Purpose: Soft-delete flag — archived leads are hidden from CRM view.
    isArchived?: boolean;
    // Purpose: CRM audit trail — tracks who touched a lead and when.
    activityHistory?: { uid: string; action: string; timestamp: string }[];
}
