# Auth Gatekeeper Live

**Date:** 2026-03-10
**Commit:** see below

## Summary

Implemented Firebase Email/Password authentication with a protected route group, keeping the chat widget and API routes public.

## Architecture

```
src/app/
├── page.tsx              ← PUBLIC (chat widget)
├── login/page.tsx        ← PUBLIC (login screen)
├── api/                  ← PUBLIC (bots, chat, leads)
└── (protected)/
    ├── layout.tsx         ← AuthProvider + AuthGuard wrapper
    ├── portal/page.tsx    ← GATED
    └── crm/page.tsx       ← GATED
```

## New Files

| File | Purpose |
|------|---------|
| `components/auth/AuthGuard.tsx` | AuthContext + `useAuth()` hook + AuthProvider + AuthGuard gate component |
| `app/login/page.tsx` | Enterprise login UI with `signInWithEmailAndPassword` |
| `app/(protected)/layout.tsx` | Wraps children in AuthProvider → AuthGuard |

## Modified Files

| File | Change |
|------|--------|
| `lib/firebase/client.ts` | Lazy initialization (`getClientAuth()`, `getClientDb()`, `getClientApp()`) to prevent build-time crashes |
| `app/(protected)/portal/page.tsx` | Moved from `app/portal/` — URL unchanged |
| `app/(protected)/crm/page.tsx` | Moved from `app/crm/` — URL unchanged |

## Issues Hit & Fixed

| Issue | Fix |
|-------|-----|
| `auth/invalid-api-key` at build time | Made Firebase client fully lazy — only initialized at runtime |
| Memory leak risk on `onAuthStateChanged` | Cleanup via `unsubscribe()` in `useEffect` return |

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
- Routes: `/` (static), `/login` (static), `/portal` (static, gated), `/crm` (static, gated) ✅
- Chat widget and APIs remain PUBLIC ✅
