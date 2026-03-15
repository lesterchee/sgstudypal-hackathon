# Sprint 46 — The OAuth Token Catcher
**Date**: 2026-03-09
**Timestamp**: 08:42:00+08:00
**Milestone**: sprint-46-redirect-processor

## Summary
Refactored the `getRedirectResult` listener in the Login UI from a passive error catcher into an active, async token processor to break infinite redirect loops.

## Changes
**File**: `apps/sg-tutor/app/login/page.tsx`

Replaced the passive listener with an active async function `processAuth` that explicitly awaits the resolution of `getRedirectResult(auth)`. If a `user` object is found within that isolated context, it immediately routes the user to `/dashboard`.

This guarantees consumption of the OAuth redirect token upon the browser's return from Google, preventing race conditions or perpetual loops with the broader `onAuthStateChanged` listener.

## Verification
`npx tsc --noEmit` passed with ZERO errors.
