# Firebase Infrastructure Init

**Date:** 2026-03-08
**Commit:** see below

## Summary

Installed and configured the Firebase Client and Admin SDKs in the hairspa-bot workspace to support the multi-tenant SaaS architecture.

## Files Created

| File | Purpose | Exports |
|------|---------|---------|
| `src/lib/firebase/client.ts` | Frontend Firestore reads (lead status, org config) | `app`, `db` |
| `src/lib/firebase/admin.ts` | Server-side Firestore writes (lead capture, org mgmt) | `adminApp`, `adminDb` |

## Architecture

- **Client SDK**: Uses `NEXT_PUBLIC_FIREBASE_*` env vars, `getApps()` singleton for HMR safety
- **Admin SDK**: Uses `FIREBASE_SERVICE_ACCOUNT` (JSON string), `getApps()` singleton with explicit error throw if missing

## Constraints Respected

- ❌ Did NOT alter `/packages/types` (deferred to separate payload)
- ❌ Did NOT generate Firebase Security Rules

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
