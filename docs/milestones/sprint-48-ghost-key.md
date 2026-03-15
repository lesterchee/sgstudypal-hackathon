# Sprint 48 — The Guest Bypass
**Date**: 2026-03-09
**Timestamp**: 09:18:00+08:00
**Milestone**: sprint-48-ghost-key

## Summary
Injected a Firebase Anonymous Authentication flow (`signInAnonymously`) into the Login UI. This provides a "Test as Guest" bypass button to route around localhost OAuth cross-origin restrictions, enabling immediate End-to-End testing of the authenticated dashboard and AI architecture.

## Changes
**File**: `apps/sg-tutor/app/login/page.tsx`

1. Imported `signInAnonymously` from `firebase/auth`.
2. Implemented `handleGuestLogin` that explicitly awaits an anonymous session and routes to `/dashboard`.
3. Added a clean, muted "Test as Guest (Dev Bypass)" button below the existing Google/Apple OAuth buttons, separated by an "or for developers" divider.

## Verification
`npx tsc --noEmit` passed with ZERO TypeScript errors.
