# Flash Offer Funnel

**Date:** 2026-03-07
**Commit:** `10b3ec8e`

## Summary

Implemented the $10 Flash Offer guided funnel for the Melinda persona, replacing the previous static greeting with a promotional entry point and three Quick Reply routing paths.

## Frontend — `page.tsx`

- **Initial greeting** replaced with the 48-hour Flash Offer copy (bold markdown rendered inline via `renderBoldMarkdown()`)
- **QuickReplies** — 3 styled buttons that auto-hide after the first user interaction:
  - "👉 Secure the $10 online offer now"
  - "👉 I have a question"
  - "👉 Leave my details for the $28 promo"
- `sendMessage({ text })` fires the exact quick-reply string so the backend can match it

## Backend — `route.ts`

| Rule | Behaviour |
|------|-----------|
| **7 — FLASH OFFER ROUTING** | Detects exact quick-reply text and routes: enthusiastic $10 booking flow, neutral Q&A, or $28 promo with $10 upsell nudge |
| **8 — THE GENTLE NUDGE** | Post-routing freestyle with a persistent directive to nudge users back toward the $10 online offer |

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
