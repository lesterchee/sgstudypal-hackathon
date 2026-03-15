# Scale Phase Refactor — Milestone

> **Executed**: 2026-03-11 15:48 SGT
> **DoD**: ✅ Zero TS errors · ✅ Production build passed (1614ms)
> **Scope**: 6-point optimization across edge latency, PDPA compliance, token efficiency, cache freshness, CRM accountability, and Firestore query performance

---

## Incident Log

| # | Vector | File(s) Modified | Status |
|---|--------|-------------------|--------|
| 1 | Edge Latency (`sin1`) | `api/chat/route.ts`, `api/bots/route.ts`, `api/leads/route.ts` | ✅ |
| 2 | PII Leakage Guard | `packages/core-engine/src/utils/logger.ts` [NEW], `api/chat/route.ts` | ✅ |
| 3 | Sliding Window (10 msgs) | `api/chat/route.ts` | ✅ |
| 4 | Stale Cache Bust | `api/bots/route.ts` | ✅ |
| 5 | Action Accountability | `packages/types/src/schemas/saas.ts`, `api/leads/route.ts`, `crm/[botId]/page.tsx` | ✅ |
| 6 | Firestore Index | `crm/[botId]/page.tsx`, `firestore.indexes.json` [NEW] | ✅ |

---

## Key Design Decisions

1. **secureLog**: Masks emails (`l***@g***.com`) and phones (`****4567`) via regex. Exported from `@repo/core-engine/utils/logger`.
2. **Sliding Window**: Slices to last 10 messages. System prompt injected via separate `system` param, unaffected.
3. **Activity History**: Uses `FieldValue.arrayUnion` — append-only, no read-modify-write race conditions.
4. **Inequality Trap**: Changed `isArchived != true` → `isArchived == false` in onSnapshot query. Requires explicit `isArchived: false` on new leads.

---

## Post-Deploy Action Required

```bash
npx firebase-tools deploy --only firestore:indexes --project sglegalaiengine
```
