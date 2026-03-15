# Portal CRUD Fixes

**Date:** 2026-03-12  
**Scope:** `apps/hairspa-bot` — API Routes + Dashboard  

---

## Bug Fixes

### 1. Create Bot Data Leak
- **Root Cause:** `BotConfigPayload` in `api/bots/route.ts` was stale — missing `websiteUrl`, `questionVariations`, `bookLaterVariations`, `finalContactQuestion`, `appointmentDays`. Had wrong field name `youtubeLinks` instead of `youtubeAssets`.
- **Fix:** Synced payload interface with current `@repo/types` schema. The actual Firestore write (`set(record, { merge: true })`) already spread the full body, so data was being saved but the contract was misaligned.
- **Dashboard Fix:** `DEFAULT_BOT_CONFIG` updated — numeric-only prices (`"28"` / `"10"`), added `websiteUrl`, `questionVariations`, `bookLaterVariations`.

### 2. Delete Bot CRUD
- **Backend:** New `DELETE /api/bots?botId=xxx` handler with auth + ownership verification.
- **Frontend:** Red outline Delete button on each dashboard bot card with `window.confirm` safety gate.
- **UX:** Bot removed from local state immediately on success — no page refresh needed.

### 3. Payload Wiring Audit
- **Finding:** Portal `handleSave` already uses `{ ...config, id: botId }` (live React state). No static template leak.
- **Dashboard:** `handleCreateBot` correctly seeds with `DEFAULT_BOT_CONFIG` then redirects to portal — expected behavior.
- **Added:** `console.log("[handleSave] Sending payload to DB:", payload)` for debug visibility.
- **Added:** Response status check (`res.ok` + `data.success`) to surface API errors.

### 4. Header Button Trifecta Wiring
- **Create Bot** → `handleCreateBot`: `await handleSave()` → route to `/dashboard` on success.
- **Save & Preview** → `handleSavePreview`: `await handleSave()` → success/error toast (3s auto-dismiss), stays on page.
- **Save & Close** → `handleSaveAndClose`: unchanged, already correct.
- All 3 share unified `isSaving` disabled state to prevent race conditions.
- Added `saveStatus` state + auto-dismissing emerald/red toast banner below header.

### 5. Firebase Auth Token Injection (401 Fix)
- **Portal GET** (`loadConfig`): Added `Authorization: Bearer ${token}` header.
- **Portal POST** (`handleSave`): Added `Authorization: Bearer ${token}` header + failsafe redirect to `/login`.
- **Dashboard DELETE** (`handleDeleteBot`): Added `Authorization: Bearer ${token}` header.
- All 3 calls now use `user.getIdToken()` from `useAuth` hook.

## Verification
- ✅ `next build` — compiled successfully (0 errors)
