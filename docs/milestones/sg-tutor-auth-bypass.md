# Incident Log: SG Tutor Local Dev Auth Bypass

**Date:** 2026-03-05
**App:** `sg-tutor`
**Status:** TEMPORARY BYPASS ACTIVE

## Context
A temporary bypass of the Next.js authentication middleware and layout guards has been injected to allow unhindered local testing of the `/dashboard` routes without needing a real Firebase Auth session.

## Files Modified
1. `apps/sg-tutor/app/dashboard/layout.tsx`
   - **Action:** Commented out the `auth.onAuthStateChanged` hook that was redirecting unauthenticated users to `/login`.
   - **Action:** Injected a hardcoded mock session:
     ```typescript
     const session = { user: { uid: 'guest-p6-student', role: 'student' } };
     // @ts-ignore - Dev bypass
     if (typeof window !== 'undefined') window.session = session;
     ```

2. `apps/sg-tutor/app/api/chat/route.ts` & `apps/sg-tutor/app/api/mastery/route.ts`
   - **Note:** These already used a hardcoded fallback (`const FALLBACK_USER_ID = "guest-p6-student";`) for Firestore writes and reads, so no further modifications were necessary for the backend routes.

## Action Required Before Production
- Remove the temporary dev bypass block in `apps/sg-tutor/app/dashboard/layout.tsx`.
- Uncomment the actual `onAuthStateChanged` auth check to re-enable security.
- Replace the `FALLBACK_USER_ID` in `mastery` and `chat` API routes with proper auth token extraction (e.g., via `next-firebase-auth-edge` or standard Firebase Admin verification).
