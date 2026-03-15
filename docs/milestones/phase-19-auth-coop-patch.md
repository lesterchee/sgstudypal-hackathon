# Phase 19 — Auth COOP Patch & Silent Failure Fix
**Date**: 2026-03-09
**Timestamp**: 08:32:00+08:00

## Summary

Fixed silent Firebase Auth popup failures caused by browser Cross-Origin-Opener-Policy blocking, and hardened the login UI error surface.

## Sprint 41: Silent Failure Fix

**File**: `apps/sg-tutor/app/login/page.tsx`

- Added `setError(null)` at the start of both handlers to reset stale errors on retry
- Added `console.error("Firebase Auth Error:", err)` for production debugging
- Added fallback error messages (`"Google sign-in failed. Please try again."`)

## Sprint 42: COOP Header Patch

**File**: `apps/sg-tutor/next.config.mjs`

Injected `async headers()` returning `Cross-Origin-Opener-Policy: same-origin-allow-popups` on all routes (`/(.*)`). This prevents the browser from blocking Firebase Auth's `window.closed` polling on the popup window.

## Verification

```
npx tsc --noEmit → ZERO errors
```
