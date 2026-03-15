# Sprint 37 & 38 — Auth Ignition
**Date**: 2026-03-09
**Timestamp**: 08:14:00+08:00
**Milestone**: sprint-37-auth-ignition

## Summary

Removed the temporary DEV authentication bypass in the Dashboard UI and wired up a live `onAuthStateChanged` listener to enable true End-to-End (E2E) robust routing and session management.

## Sprint 37: Auth Bypass Removal

**File**: `apps/sg-tutor/app/dashboard/layout.tsx`

1. **Live Firebase Listener**: Replaced the hardcoded `setSession({ uid: "guest-p6-student" })` with Firebase `onAuthStateChanged`.
2. **E2E Protection**: Immediately routes unauthenticated traffic to `/login` via `router.push('/login')`.
3. **Hydration/Flash Prevention**: Implemented a `loadingAuth` state alongside a full-screen CSS spinner (`animate-spin border-violet-600`) to prevent the dashboard from briefly rendering during the initial Firebase auth check.

## Sprint 38: The Ignition Check

- `npx tsc --noEmit` verified strictly typed Firebase `User` object passing seamlessly into the `Session` state.
- Zero TypeScript compilation errors recorded on the Next.js `layout.tsx` component.
