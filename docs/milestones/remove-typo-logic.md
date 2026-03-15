# Remove Typo Logic

**Date:** 2026-03-07
**Commit:** see below

## Summary

Removed the entire `injectTypos` function and its invocation from the humanization transform in `route.ts`. The 40-100ms jitter remains intact for natural pacing. Rules 7 and 8 are untouched.

## What was removed

- `injectTypos()` — 2% probability letter-transposition function with regex shield
- The `{ ...chunk, text: injectTypos(chunk.text) }` spread in the transform (replaced with direct `controller.enqueue(chunk)`)
- JSDoc references to "typo injection"

## What was kept

- 40-100ms per-chunk jitter
- All lifecycle chunk passthrough
- Rules 1-8 (system prompt) — completely untouched

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
