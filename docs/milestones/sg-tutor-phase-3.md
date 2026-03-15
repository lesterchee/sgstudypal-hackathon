# Incident Log: SG Tutor Phase 3 — Firestore, Mastery Dashboard, PWA
**Date**: 2026-03-05
**Timestamp**: 18:45:00+08:00
**Milestone**: sg-tutor-phase-3

## Summary

Phase 3 wires the AI SDK tool calling into Firebase Firestore, builds a gamified mastery dashboard, and configures the app as an installable PWA.

## Changes Made

### Step 1: Firestore Wiring (Backend)

#### New Files
- **`lib/firebase-admin.ts`** — Server-side Firebase Admin SDK init. Supports production (JSON service account from env) and local dev (projectId-only fallback).

#### Modified Files
- **`app/api/chat/route.ts`** — The `log_student_mastery` tool's `execute` function now writes to `users/{userId}/sessions` in Firestore using a fire-and-forget pattern (`.catch()` prevents write failures from blocking the AI stream).

#### Firestore Schema
```
users/
  {userId}/
    sessions/
      {autoId}/
        concept: string        // e.g. "fractions"
        mastery_level: string   // "low" | "medium" | "high"
        timestamp: string       // ISO 8601
        source: string          // "sg-tutor-socratic"
```

### Step 2: Gamified Mastery Dashboard (Frontend)

#### New Files
- **`app/api/mastery/route.ts`** — GET endpoint that reads from Firestore, aggregates by concept (latest assessment wins), and returns an array of mastery entries.
- **`app/dashboard/mastery/page.tsx`** — Gamified skill tree with:
  - 4 stats cards (Overall Score, Topics Explored, Mastered, Proficient)
  - Per-concept progress bars with color-coded mastery levels (Beginner/Proficient/Mastered)
  - Empty state when no data exists
- **Dashboard sidebar** — Added "Skill Mastery" nav link with Brain icon.

### Step 3: PWA Configuration

#### New Files
- **`public/manifest.json`** — PWA manifest with standalone display, education category, violet theme.
- **`public/sw.js`** — Basic service worker with cache-first for static assets, network-first for API routes.
- **`public/icons/icon-192.png`**, **`icon-512.png`** — Placeholder purple icons.

#### Modified Files
- **`app/layout.tsx`** — Added manifest link, `apple-touch-icon`, viewport/theme-color config, and inline service worker registration script.

## Flagged Items (Requires Orchestrator Approval)

> [!WARNING]
> **Hardcoded `userId`**: Both `app/api/chat/route.ts` and `app/api/mastery/route.ts` use `FALLBACK_USER_ID = "guest-p6-student"`. This MUST be replaced with real Firebase Auth token extraction before any multi-user deployment.

> [!NOTE]
> **PWA Icons**: Currently placeholder solid-purple squares. Production icons should be designed and replaced.

## Adversarial EDD Results

| Edge Case | Status | Notes |
|---|---|---|
| Firestore write blocks AI stream | ✅ Mitigated | Fire-and-forget pattern with `.catch()` |
| Missing Firebase credentials at build time | ✅ Handled | Graceful fallback returns `[]` from mastery API |
| Empty `experimental_attachments` | ✅ Guarded | Sanitized to `undefined` before provider call |
| No mastery data in Firestore | ✅ Rendered | Empty state UI with guidance message |

## Build Verification

```
npm run build -w sg-tutor → EXIT CODE 0
✓ Compiled successfully
✓ Checking validity of types
✓ Generating static pages (12/12)

Routes compiled:
  /api/chat (Dynamic)
  /api/mastery (Static)
  /dashboard/mastery (Static)
```

## Next Steps

1. Replace `FALLBACK_USER_ID` with Firebase Auth token extraction from request headers.
2. Design production PWA icons (192x192 + 512x512).
3. Deploy to Vercel and test PWA install flow on iOS Safari.
4. Wire real-time mastery updates (consider Firestore `onSnapshot` for live dashboard).
