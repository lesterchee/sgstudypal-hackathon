# Fast-Lane Checkout Fix

**Date:** 2026-03-08
**Commit:** see below

## Summary

Short-circuited the $10 offer flow — bot now immediately provides the CommitPayApp checkout URL without collecting name/phone. QuickReply buttons are permanently suppressed once the checkout link is detected in the conversation.

## Backend — `route.ts`

- **`<objective>`** updated to include $10 Flash Offer routing
- **Rule 7 ($10 branch)**: Changed from "ask for name" → immediately reply with `[INSERT_COMMITPAYAPP_URL_HERE]`, no further questions

## Frontend — `page.tsx`

- **`hasCheckoutLink`**: Scans all message `parts` for `"commitpayapp"` or `"click on this"` (case-insensitive)
- **`showQuickReplies`**: Now gated by `!hasCheckoutLink` — buttons vanish permanently after link delivery

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
