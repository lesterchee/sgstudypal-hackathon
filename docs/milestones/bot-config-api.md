# BotConfig API

**Date:** 2026-03-08
**Commit:** see below

## Summary

Created `POST /api/bots` route to persist BotConfig to Firestore. Refactored `admin.ts` from eager module-scope init to a lazy getter pattern to prevent Next.js build-time crashes.

## New Route

**`POST /api/bots`** — `apps/hairspa-bot/src/app/api/bots/route.ts`

| Aspect | Detail |
|--------|--------|
| Input | `BotConfigPayload` JSON body |
| Auth | MVP bypass — auto-generates `botId` and `orgId` via `crypto.randomUUID()` |
| Firestore | Writes to `bots/{botId}` with `{ merge: true }` + `updatedAt` timestamp |
| Error handling | Full `try/catch`, returns `500` with error message |

## Admin SDK Refactor

**`src/lib/firebase/admin.ts`** — converted from eager to lazy:

| Before | After |
|--------|-------|
| `const adminApp = createAdminApp()` (runs at import) | `getAdminDb()` function (runs on first call) |
| Crashed build when env var missing | Build succeeds; throws at runtime only |

## Incident Log

- **Issue:** Next.js static page collection triggered `admin.ts` at build time → `FIREBASE_SERVICE_ACCOUNT` env var missing → build crash
- **Root cause:** Eager module-scope initialisation
- **Fix:** Lazy `getAdminDb()` getter with cached singleton

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
- `/api/bots` registered as dynamic (`ƒ`) route ✅
