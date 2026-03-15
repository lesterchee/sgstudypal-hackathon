# Phase 146 — Image Payload Schema Patch

**Status:** ✅ DONE  
**Date:** 2026-03-14  
**Commit:** `a033e527`

## Summary

Fixed the Gemini Vision `inlineData` contract by explicitly parsing and passing `mimeType` alongside the raw base64 image data in the AI SDK image part.

## Change

| File | Change |
|------|--------|
| `apps/sg-tutor/app/api/chat/route.ts` | Parse `mimeType` from data URL prefix (e.g., `data:image/jpeg;base64,...` → `image/jpeg`). Pass `{ type: "image", image: rawBase64, mimeType: parsedMimeType }` instead of bare `{ type: "image", image: rawBase64 }`. Fallback to `image/png` when no prefix exists. |

## Verification

- [x] `npx tsc --noEmit` — 0 TypeScript errors
- [x] No other payload construction or SDK scrubber bypass logic altered
