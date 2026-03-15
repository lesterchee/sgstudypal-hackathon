# Enterprise Hardening Sweep

**Date:** 2026-03-12  
**Scope:** `apps/hairspa-bot` + `packages/types`  

---

## Phase 1: Core Infrastructure

### 1. Firestore Security Rules
- ✅ Already correctly scoped: `request.auth.uid == resource.data.orgId` on `bots` and `leads`.
- No changes needed.

### 2. Soft Deletes
- Added `deletedAt?: number | null` to `BotConfig` in `@repo/types`.
- API `DELETE /api/bots` migrated from `deleteDoc` → `set({ deletedAt: Date.now() }, { merge: true })`.
- Dashboard query filters out `deletedAt` bots client-side.

### 3. `/api/generate` Auth + Rate Limiting
- **Before:** Zero authentication — anyone could spam LLM credits.
- **After:** Auth guard (`verifyAuthToken`) + 10 req/IP/hour in-memory rate limiter.
- Portal generate fetch now sends `Authorization: Bearer ${token}`.

## Phase 2: UI/UX & Failsafes

### 4. Unsaved Changes Trap
- `isDirty` state set `true` on any `updateField()` call.
- `beforeunload` listener warns user before leaving with unsaved changes.
- `isDirty` resets to `false` after successful save.

### 5. LLM Outage Fallback — ✅ Already Done
- `/api/chat` already has 8s timeout + fallback message.

### 6. Empty State Dashboard — ✅ Already Done
- CTA already renders when `bots.length === 0`.

### 7. Dynamic OpenGraph
- Added `openGraph` (type, locale, siteName) and `twitter` card metadata to `layout.tsx`.

### 8. Conversion Telemetry
- `onClick` interceptor on chat message area logs `[Telemetry] Checkout Initiated` when commitpay links are clicked.

### 9. Image Compression — Skipped
- No image upload logic found anywhere in the codebase.

### 10. A11y Accessibility
- `aria-label="Type your message"` on chat input.
- `aria-label="Send message"` on send button.

## Verification
- ✅ `next build` — compiled successfully (0 errors)
