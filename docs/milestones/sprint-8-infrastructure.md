# Sprint 8: Infrastructure & Authentication

**Completed:** 2026-03-06T14:39:00+08:00

## Deliverables

| File | Status | Description |
|------|--------|-------------|
| `lib/image-utils.ts` | ✅ NEW | `compressImageClientSide()` — Canvas API, progressive JPEG quality, max 1600px, edge case handling |
| `app/api/auth/qr/route.ts` | ✅ NEW | JWT QR auth (jose HS256, 60s TTL), QR-encodable verification URL |
| `jobs/image-cleanup.ts` | ✅ NEW | `handleQuestionMastered()` — Storage deletion, Firestore field cleanup, dynamic admin imports |

## DoD

- `npx tsc --noEmit` → **0 errors**
