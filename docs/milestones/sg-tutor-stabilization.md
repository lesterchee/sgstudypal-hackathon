# Incident Log: SG Tutor Stabilization — Schema Fix + UI Wiring
**Date**: 2026-03-05
**Timestamp**: 19:55:00+08:00
**Milestone**: sg-tutor-stabilization

## Summary

Dual-phase stabilization: (1) fixed DashScope `ModelMessage[]` schema validation error, (2) wired sidebar Level/Subject filters and dynamic PDF viewer data fetching.

## Phase 1: Schema Fix (Previously Completed)

Already resolved in prior commit. `convertToModelMessages()` from AI SDK v6 transforms raw client `UIMessage` payloads into strict `ModelMessage[]` schema before passing to `streamText`.

## Phase 2: Sidebar Dynamic Routing

### `app/dashboard/layout.tsx`
- Imported `useSearchParams` from `next/navigation`
- Level buttons → `<Link href="/dashboard?level=p6">` with active state highlighting
- Subject buttons → `<Link href="/dashboard?subject=MATH">` with active state highlighting
- Filter values: `p6/p5/s4` for levels, `MATH/SCIENCE/ENGLISH/MT` for subjects

### `app/dashboard/page.tsx`
- Added `useSearchParams` to read `?subject=` query param
- Papers fetched from `/api/papers` are filtered by subject (case-insensitive match)
- Auto-selects first matching paper; falls back to first paper if no match

### `next.config.mjs`
- Self-healed: added `experimental.missingSuspenseWithCSRBailout: false` to suppress Next.js 14 Suspense boundary requirement for `useSearchParams()` during static prerendering. This is the official escape hatch — all dashboard pages are client-rendered anyway.

## Build Verification

```
npm run build -w sg-tutor → EXIT CODE 0
✓ Compiled successfully
✓ Checking validity of types
✓ Generating static pages (12/12)

Warnings (informational only):
- /dashboard, /dashboard/chat, /dashboard/mastery deopted to CSR
  (expected — all are "use client" pages)
```
