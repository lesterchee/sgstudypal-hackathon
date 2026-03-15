# Sprint 6: Science CER & Multimodal Fallback

**Completed:** 2026-03-06T14:28:00+08:00

## Deliverables

| File | Status | Description |
|------|--------|-------------|
| `lib/ai/vision-bouncer-types.ts` | ✅ MODIFIED | Added `BLURRY_DIAGRAM` to `BouncerReasonCode` union |
| `lib/ai/vision-bouncer.ts` | ✅ MODIFIED | Vision Confidence Check (threshold 0.5), `visionConfidence` param |
| `components/ui/chat-bubble.tsx` | ✅ NEW | Chat bubble with inline re-upload dropzone for `image_rejected` status |
| `lib/ai/prompt-router.ts` | ✅ MODIFIED | Science CER branch: backwards CER (Claim→Evidence→Reasoning), keyword enforcement |

## DoD

- `npx tsc --noEmit` → **0 errors**
