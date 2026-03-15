# Dashboard UX & Cache Fixes

**Date:** 2026-03-13
**Status:** ✅ Complete
**Build:** 0 TypeScript errors

## Changes

### 1. Cache Buster (Data Visibility)

**Problem:** Bot creation happened client-side via `setDoc()` directly to Firestore, bypassing the `/api/bots` POST route entirely. This meant:
- The server-side `revalidatePath` never fired for new bots.
- The Vercel edge cache for `/dashboard` was never invalidated.

**Fix:**
- **`page.tsx`**: Migrated `handleCreateBot` to call `/api/bots` POST with a Bearer token, ensuring the server-side `revalidatePath('/dashboard')` fires on every bot creation.
- **`route.ts`**: Added `revalidatePath('/dashboard')` to both POST and DELETE handlers, so bot mutations always bust the dashboard cache.
- Removed `export const dynamic = 'force-dynamic'` since the dashboard is a `"use client"` page (directive only applies to Server Components). Cache invalidation is handled by `revalidatePath` in the API route.

### 2. Portal Routing (UI Enhancement)

**Problem:** Bot card actions used `router.push()` for internal navigation instead of Next.js `<Link>`.

**Fix:**
- Replaced all `router.push()` on bot cards with `import Link from 'next/link'` components.
- Added a prominent **"Manage Bot"** CTA button as the primary action on each card, styled with the amber-to-orange gradient, routing to `/portal/${bot.id}`.
- "Edit" and "Leads" buttons retained as secondary actions with neutral outlined styling.
- All buttons use `whitespace-nowrap` per `.cursorrules` Rule 4E.

## Files Modified
- `apps/hairspa-bot/src/app/(protected)/dashboard/page.tsx`
- `apps/hairspa-bot/src/app/api/bots/route.ts`

---

### 3. View Bot Routing Pivot (2026-03-13)

**Problem:** The primary "Manage Bot" CTA on bot cards was redundant — it routed to `/portal/${bot.id}`, the same destination as the "Edit" button.

**Fix:**
- Renamed CTA to **"View Bot"** with a `visibility` icon.
- Re-routed from `/portal/${bot.id}` → `/?botId=${bot.id}` so the merchant can preview the public-facing chat interface that end-users see.
- "Edit" button retained at `/portal/${bot.id}` for configuration access.
