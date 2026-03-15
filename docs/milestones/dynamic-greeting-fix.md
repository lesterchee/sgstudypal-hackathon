# Dynamic Greeting Fix

**Date:** 2026-03-13
**Status:** ✅ Complete
**Build:** 0 TypeScript errors

## Problem

The public chat widget's initial greeting, quick reply buttons, header subtitle, and FOMO intercept detection all had **hardcoded pricing** (`$28`/`$10`). When a merchant configured custom pricing (e.g., `$288`/`$88`) in the portal, the greeting still showed the old values — creating a state mismatch between the frontend UI and the backend LLM system prompt.

## Fix

Refactored `app/page.tsx` to fetch the merchant's public config from `/api/bots/[botId]/public` on mount, then dynamically inject `regularPrice` and `flashOffer` into:

| Location | Before | After |
|----------|--------|-------|
| Initial greeting | Hardcoded `$28`/`$10` | `$${pricing.regularPrice}` / `$${pricing.flashOffer}` |
| Quick reply CTA | `"Secure the $10 offer"` | `"Secure the $${pricing.flashOffer} offer"` |
| FOMO intercept detection | `includes("$10 offer now?")` | `includes("$${pricing.flashOffer} offer now?")` |
| Header subtitle | `"$28 Scalp Detox"` | `"$${pricing.regularPrice} Scalp Detox"` |

### Fallback Safety
- If no `botId` is present or the fetch fails, falls back to `{ regularPrice: "28", flashOffer: "10" }`.
- A loading spinner prevents flashing the fallback pricing before the real values arrive.

## Files Modified
- `apps/hairspa-bot/src/app/page.tsx`
