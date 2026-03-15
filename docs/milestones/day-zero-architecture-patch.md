# Day-Zero Architecture Patch — Milestone

> **Executed**: 2026-03-11 15:10 SGT
> **DoD**: ✅ Zero TS errors · ✅ Production build passed (1735ms)
> **Scope**: 10-point hardening across security, data integrity, real-time UX, and billing enforcement

---

## Incident Log

| # | Vector | File(s) Modified | Status |
|---|--------|-------------------|--------|
| 1 | Webhook Idempotency | `api/webhooks/payment/route.ts` | ✅ |
| 2 | Timezone Correction (UTC→SGT) | `analytics/[botId]/page.tsx` | ✅ |
| 3 | IP Rate Limiting (20/hr) | `api/chat/route.ts` | ✅ |
| 4 | Adversarial Injection Guards | `api/chat/promptBuilder.ts` | ✅ |
| 5 | Lead Deduplication | `api/chat/route.ts` | ✅ |
| 6 | Real-Time CRM (onSnapshot) | `crm/[botId]/page.tsx` | ✅ |
| 7 | Graceful Degradation (8s timeout) | `api/chat/route.ts` | ✅ |
| 8 | Soft Deletes & Rules | `firestore.rules`, `crm/[botId]/page.tsx` | ✅ |
| 9 | Secure Public Bot Config | `api/bots/[botId]/public/route.ts` [NEW] | ✅ |
| 10 | SaaS Subscription Enforcement | `api/chat/route.ts` | ✅ |

---

## Key Design Decisions

1. **Rate Limiter**: In-memory `Map` — adequate for single-region Vercel deployment. Upgrade to Vercel KV for multi-region.
2. **Real-Time CRM**: Layered `onSnapshot` on top of API fetch — if Firebase Client SDK env vars are missing, the API fetch fallback remains active.
3. **Soft Deletes**: Setting `crmStatus = "Archive"` auto-sets `isArchived: true`. Firestore rules now block hard `delete` on leads.
4. **SaaS Enforcement**: Only `isActive: false` blocks chat. Missing field = active (backward-compatible).
5. **Deduplication**: Fire-and-forget `arrayUnion` merge — doesn't block the stream response.
