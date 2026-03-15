// Purpose: Sprint 23 — Subscription and User Profile types for multi-seat
// billing logic. Defines the SubscriptionPlan, per-seat pricing, and intro
// offer schema consumed by the profiles page and billing API.

// Purpose: Supported subscription plans.
export type PlanTier = 'free' | 'premium' | 'school';

// Purpose: Multi-seat subscription schema — 1 Profile = 1 Paid Seat.
export interface Subscription {
    /** Purpose: The active subscription plan. */
    plan: PlanTier;
    /** Purpose: Number of paid seats (child profiles). Max 5 for premium. */
    seats: number;
    /** Purpose: Price per seat in SGD. Premium = $49/seat/month. */
    pricePerSeat: number;
    /** Purpose: Intro offer code — e.g., '2_months_free' for early adopters. */
    introOffer: string | null;
    /** Purpose: Timestamp when the current billing cycle started. */
    billingCycleStart: number;
    /** Purpose: Timestamp when the current billing cycle ends. */
    billingCycleEnd: number;
    /** Purpose: Whether the subscription is currently active. */
    isActive: boolean;
}

// Purpose: Shape of a child profile within the parent's Firestore user document.
export interface ChildProfile {
    /** Purpose: Unique child identifier (Firestore subcollection ID). */
    uid: string;
    /** Purpose: Display name chosen by the parent. */
    name: string;
    /** Purpose: Current grade level (P1-P6). */
    gradeLevel: string;
    /** Purpose: Emoji avatar for the profile card. */
    avatarEmoji: string;
    /** Purpose: Accumulated XP for gamification. */
    xp: number;
    /** Purpose: Total questions mastered. */
    questionsMastered: number;
    /** Purpose: Timestamp of last active session. */
    lastActiveAt: number;
}

// Purpose: Extended UserProfile for multi-seat parents.
export interface ParentUserProfile {
    /** Purpose: Parent's Firebase Auth uid. */
    uid: string;
    /** Purpose: Parent's email address. */
    email: string;
    /** Purpose: Parent's display name. */
    displayName: string;
    /** Purpose: Whether the parent signed in anonymously initially. */
    isAnonymous: boolean;
    /** Purpose: Array of child profiles — each consumes 1 seat. */
    profiles: ChildProfile[];
    /** Purpose: Active subscription details. */
    subscription: Subscription;
    /** Purpose: Timestamp of account creation. */
    createdAt: number;
}
