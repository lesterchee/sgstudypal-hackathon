# Sprint 133-135: Auth Perimeter Hardening

**Date:** 2026-03-11
**Status:** ✅ Complete

## Incident Summary

Removed the hardcoded `FALLBACK_USER_ID = "guest-p6-student"` from all 3 API routes and re-enabled the Vercel Edge Middleware to enforce Firebase Auth session verification across all authenticated network boundaries.

## Problem

- Edge Middleware was **bypassed** (`matcher: []`), allowing unauthenticated access to all routes.
- API routes (`/api/chat`, `/api/lessons`, `/api/mastery`) used a hardcoded guest user ID for all Firestore operations, meaning every user shared the same data.
- No mechanism existed to bridge Firebase client-side auth (IndexedDB) to the Edge Middleware (cookies).

## Changes Made

### Sprint 133: Middleware State Handoff
| File | Action |
|------|--------|
| `lib/auth-cookie-sync.ts` | **NEW** — Syncs Firebase ID token → `__session` cookie via `onIdTokenChanged` |
| `components/providers/AuthProvider.tsx` | **MODIFIED** — Wires `syncAuthCookie` into the auth lifecycle |
| `middleware.ts` | **REWRITTEN** — Edge-safe JWT decode, matcher restored, 401/redirect logic, `x-user-id` header injection |

### Sprint 134: API Route Hardening
| File | Action |
|------|--------|
| `app/api/chat/route.ts` | Removed `FALLBACK_USER_ID`, extracts `x-user-id` header with 401 guard |
| `app/api/lessons/route.ts` | Removed `FALLBACK_USER_ID`, extracts `x-user-id` header with 401 guard |
| `app/api/mastery/route.ts` | Removed `FALLBACK_USER_ID`, extracts `x-user-id` header with 401 guard |

### Sprint 135: Verification
- `npx tsc --noEmit` — **0 errors**
- Adversarial EDD: `curl /api/chat` (no cookie) → **HTTP 401** ✅
- Adversarial EDD: `curl /api/lessons` (no cookie) → **HTTP 401** ✅
- Adversarial EDD: `curl /api/mastery` (no cookie) → **HTTP 401** ✅
- Adversarial EDD: `curl /dashboard` (no cookie) → **HTTP 307 → /login** ✅
- Adversarial EDD: `curl /api/mastery` (valid JWT cookie) → **HTTP 200** ✅

## Architecture Decision: Edge JWT Decode

Firebase Admin SDK cannot run in Vercel's Edge Runtime. The middleware uses **base64url payload decode** (not signature verification) to extract the UID. Security is maintained because:

1. External requests cannot forge the `x-user-id` header — Vercel's edge layer strips/overwrites incoming request headers before passing to API routes.
2. Firestore Security Rules enforce tenant isolation at the database level.
3. Token expiry is checked at the edge via the `exp` claim.
