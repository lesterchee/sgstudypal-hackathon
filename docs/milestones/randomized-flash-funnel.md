# Randomized Flash Offer Funnel

**Date:** 2026-03-07
**Commit:** `27a5eefb`

## Summary

Replaced static Quick Reply buttons with randomized wording variations and updated backend routing from exact-string matching to intent-based detection.

## Frontend — `page.tsx`

- **3 variation pools**: `offerVariations` (8), `questionVariations` (6), `detailsVariations` (5)
- **`pickRandom<T>` helper** selects one from each pool
- **`useMemo([], [])`** locks selection on initial mount — no re-shuffle during React re-renders
- Each label prefixed with "👉 " at render time

## Backend — `route.ts`

- **Rule 7 (FLASH OFFER ROUTING)** updated from exact-match to intent-based routing with keyword examples (e.g., `Secure`, `Unlock`, `Claim`, `Grab`, `Reserve`, `Lock in`, `Book`, `Get`)
- **Rule 8 (GENTLE NUDGE)** unchanged — freestyle with persistent $10 nudge directive

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
