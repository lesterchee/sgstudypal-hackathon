# Icebreaker Menu Fix

**Date:** 2026-03-08
**Commit:** see below

## Summary

Simplified QuickReply visibility logic. Buttons now act strictly as initial icebreakers — they vanish permanently once the user sends any message, replacing the previous `hasCheckoutLink` scan.

## Change

| Before | After |
|--------|-------|
| `hasCheckoutLink` — scanned all message parts for "commitpayapp" / "click on this" | `hasUserInteracted` — simple `messages.some(m => m.role === "user")` |

The new logic implicitly handles the checkout link case since a user interaction is required to even trigger link delivery.

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
