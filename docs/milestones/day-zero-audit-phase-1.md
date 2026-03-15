# Day-Zero Audit — Phase 1 Remediation

**Date**: 2026-03-11  
**Status**: Complete

---

## Summary

Resolved three Critical Day-Zero Audit findings across Auth, Webhooks, and Firestore:

| Audit ID | Finding | Fix |
|---|---|---|
| 1.1, 1.2, 3.5 | No server-side auth on API routes; cross-tenant data leaks | `verifyIdToken()` on all GET/POST/PATCH; `where("orgId","==",uid)` enforced |
| 3.2 | New leads invisible in CRM `onSnapshot` due to missing `isArchived` field | Injected `isArchived: false` in `deduplicateLead()` + enforced via Firestore rules |
| 3.4 | `allow create: if true` on leads collection — no schema validation | Replaced with `hasAll` + type guards + `isArchived == false` enforcement |
| 2.2 | TOCTOU race condition in payment webhook (double-billing risk) | Wrapped idempotency check + mutation in `runTransaction()` |

## Files Changed

### New Files
- `apps/hairspa-bot/src/lib/firebase/auth-guard.ts` — Centralised `verifyAuthToken()` + `isAuthenticated()` helper

### Modified Files
- `apps/hairspa-bot/src/lib/firebase/admin.ts` — Added `getAdminAuth()` singleton
- `apps/hairspa-bot/src/app/api/bots/route.ts` — Auth-gated GET/POST; `randomUUID()` orgId removed
- `apps/hairspa-bot/src/app/api/leads/route.ts` — Auth-gated GET/PATCH; tenant-scoped queries
- `apps/hairspa-bot/src/app/api/chat/route.ts` — `isArchived: false` in `deduplicateLead()` merge
- `apps/hairspa-bot/src/app/api/webhooks/payment/route.ts` — `runTransaction()` for atomic PAID transition
- `packages/core-engine/src/security/firestore.rules` — Schema-validated lead creation

## Verification

- `tsc --noEmit` ✅ PASS (zero errors)
- ESLint: N/A (no config in project)
