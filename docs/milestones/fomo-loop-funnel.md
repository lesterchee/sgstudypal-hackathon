# FOMO Loop Funnel

**Date:** 2026-03-07
**Commit:** `2cd25bff`

## Summary

Replaced the "Gentle Nudge" freestyle directive with a strict FOMO Loop that forces a $10 vs $28 price reminder after every answered question. Made QuickReply buttons persistent — they re-appear after every assistant message to keep the conversion funnel always visible.

## Backend — `route.ts`

| Rule | Before | After |
|------|--------|-------|
| **8** | GENTLE NUDGE (generic freestyle) | **FOMO LOOP** — must conclude every answer with a dynamically rephrased $10 vs $28 reminder |

## Frontend — `page.tsx`

- **Before:** `hasUserReplied` — QuickReplies hidden permanently after first click
- **After:** `showQuickReplies` — renders whenever `lastMessage.role === "assistant"` and stream is idle
- Same `useMemo`-locked randomized labels persist across re-renders

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
