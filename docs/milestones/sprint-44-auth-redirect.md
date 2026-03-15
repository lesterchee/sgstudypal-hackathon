# Sprint 44 — Auth Redirect Rewire
**Date**: 2026-03-09
**Timestamp**: 08:38:00+08:00

## Summary

Replaced `signInWithPopup` with `signInWithRedirect` for both Google and Apple login flows, permanently bypassing browser-level COOP/COEP popup blocks.

## Changes

**File**: `apps/sg-tutor/app/login/page.tsx`

- `signInWithPopup` → `signInWithRedirect` (both Google and Apple handlers)
- Removed `router.push('/dashboard')` from try blocks — redirect navigates the browser away; the existing `onAuthStateChanged` listener in `layout.tsx` catches the session on return and routes to `/dashboard`
- Error handling and `console.error` logging preserved in catch blocks

## Auth Flow (Post-Redirect)

```
Login Page → signInWithRedirect(auth, provider)
  → Browser navigates to Google/Apple OAuth
  → Google/Apple redirects back to app
  → onAuthStateChanged fires in layout.tsx
  → setSession({ uid, role }) + router stays on /dashboard
```

## Verification

```
npx tsc --noEmit → ZERO errors
```
