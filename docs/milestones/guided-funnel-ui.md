# Guided Funnel UI — Dynamic Bindings & AI Generation

**Date:** 2026-03-12  
**Scope:** `apps/hairspa-bot` — Bot Configuration Portal  
**Commit:** `45b1f977` (`chore: ui updates and ghost file purge`)

---

## Changes

### 1. Dynamic Flash Offer (Option 01)
- `secureOfferText` is now reactively bound to `flashOffer` state via `useEffect`.
- Template: `` `Secure the $${flashOffer || '[Flash Price]'} offer now` ``
- Input is read-only — updates automatically when the merchant changes the Flash Offer price.

### 2. Generate Variations Button (Fixed)
- Created `POST /api/generate/route.ts` — uses Dashscope (Qwen-Max), same LLM provider as the chat route.
- Request: `{ context, currentText, flashOffer?, regularPrice? }`
- Response: `{ variations: string[] }` — 5 LLM-generated button-text variations.
- Button shows `progress_activity` spinner + "Generating…" text while fetching.

### 3. Scaled to All 3 Funnel Options
- Generate + Variations UI replicated to Option 02 (Question) and Option 03 (Book Later).
- Each button passes the correct `context` to `/api/generate` for context-aware variation generation.
- State schema expanded: `questionVariations: string[]` and `bookLaterVariations: string[]` added to `BotConfigState.guidedFunnel`.
- `toggleVariation` refactored to accept a generic key parameter.

## Verification
- ✅ `next build` — compiled successfully (0 errors), `/api/generate` route registered
- ✅ No breaking changes to existing data contract
