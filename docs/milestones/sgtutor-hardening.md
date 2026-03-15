# Sprint 136-139: SG-Tutor Integration Hardening

**Date:** 2026-03-11
**Status:** ✅ Complete

## Incident Summary

Swept remaining Day-Zero Audit vulnerabilities from `sg-tutor`: removed hardcoded cryptographic fallback, consolidated duplicate Firebase client initializers, secured git boundaries, and cleaned stale type declarations.

## Vulnerabilities Remediated

| Sprint | Vulnerability | Remediation |
|--------|--------------|-------------|
| 136 | `getJwtSecret()` fell back to `'sg-tutor-qr-default-dev-secret'` — local token forgery risk | Throws `CRITICAL` error if `JWT_QR_SECRET` unset |
| 137 | Duplicate Firebase client singletons (`lib/firebase.ts` + `lib/firebase/client.ts`) — potential double-init in SSR | Deleted `lib/firebase/client.ts`, consolidated to single `lib/firebase.ts` |
| 138 | `.gitignore` missing `.env` and `keys/` — credential leak risk | Added both entries |
| 138 | No `.env.example` — onboarding friction, missing key documentation | Created with all required vars |
| 138 | `env.d.ts` had stale `@google/anti-gravity` and `@sgdivorceai/types` module declarations + wrong env var names | Removed stale declarations, updated to `FIREBASE_SERVICE_ACCOUNT_KEY` |

## Verification

- `npx tsc --noEmit` (sg-tutor) — **0 errors** ✅
- `npm run build` (sg-tutor) — **0 errors**, 20 static pages, no duplicate Firebase app errors ✅
