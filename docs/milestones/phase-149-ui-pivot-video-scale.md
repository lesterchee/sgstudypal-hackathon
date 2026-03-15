# Phase 149 — Live Tutor UI Pivot & Video Scale

**Status:** ✅ DONE  
**Date:** 2026-03-14  
**Commit:** `6617541e`

## Summary

Removed the SharedUploader card from the Live Tutor layout and enlarged the student's PiP video container by 1.5× for better camera visibility during sessions.

## Changes

| File | Change |
|------|--------|
| `app/dashboard/live-tutor/page.tsx` | Removed `SharedUploader` card, `pendingImages` state, and unused `Camera`/`CameraOff`/`Upload` imports. Enlarged PiP from `w-48 h-36` → `w-72 h-54` (1.5×). Agent Activity stream preserved. |

## Rationale

The uploader was redundant on the Live Tutor page since Phase 147 already bridges homework images via `localStorage("pendingHomeworkBase64")` — uploads happen on the Homework Help page and flow through automatically. The larger PiP gives students better visual feedback of their camera framing.

## Verification

- [x] `npx tsc --noEmit` — 0 TypeScript errors
- [x] `SharedUploader.tsx` component file retained for homework-help page use
