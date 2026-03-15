# Incident Log: SG Tutor — Qwen-VL-Max Swap
**Date**: 2026-03-05
**Timestamp**: 16:30:00+08:00
**Milestone**: sg-tutor-qwen-swap

## Summary

Swapped the AI provider in `apps/sg-tutor/app/api/chat/route.ts` from `@ai-sdk/google` (Gemini 1.5 Pro) to `@ai-sdk/alibaba` (Qwen-VL-Max) for low-latency regional multimodal inference.

## Changes Made

### Dependency Changes (`apps/sg-tutor/package.json`)
- **Added**: `@ai-sdk/alibaba`
- **Removed**: `@ai-sdk/google` (confirmed no other routes in this app depended on it)

### Route Refactoring (`app/api/chat/route.ts`)
- Replaced `import { google } from '@ai-sdk/google'` with `import { alibaba } from '@ai-sdk/alibaba'`
- Model target changed: `google("gemini-1.5-pro")` → `alibaba("qwen-vl-max")`
- Added `zodSchema()` wrapper import and usage for zod v4 + AI SDK v6 `FlexibleSchema<T>` compatibility
- Changed `parameters` → `inputSchema` (correct key per AI SDK v6 `Tool` type definition)
- Added `experimental_attachments` null-check sanitization for empty/malformed image arrays
- All complex logic blocks annotated with `// Purpose:` comments per DOC-SYNC constraint

## Self-Healing Log

### Issue: `tool()` Type Error — `execute` typed as `undefined`
- **Root Cause**: Zod v4 `z.object()` returns a type that AI SDK v6's `FlexibleSchema<INPUT>` cannot infer `INPUT` from. The `NeverOptional<N, T>` conditional type resolves `execute` to `Partial<Record<keyof T, undefined>>` when `INPUT` is `never`.
- **Fix**: Wrapped the zod schema with `zodSchema()` (exported from `ai`) which wraps a zod schema into a `FlexibleSchema<T>` compatible type. Also used the correct key `inputSchema` instead of `parameters`.
- **Verification**: `npm run build -w sg-tutor` passes with ZERO TS errors.

## Mocked Variables

| Variable | Location | Status |
|---|---|---|
| `DASHSCOPE_API_KEY` | `.env.local` | **Required** — must be set before Qwen-VL-Max can process requests |
| `experimental_attachments` | Route handler | **Guarded** — null-check sanitization strips empty arrays |
| `mockUploadToGcpBucket()` | `jobs/scrape-test-papers.ts` | Carried over from Phase 1 — still mocked |

## Adversarial Edge Cases Addressed

1. **Empty `experimental_attachments`**: If the frontend sends `experimental_attachments: []`, the sanitization logic strips it to `undefined`.
2. **Malformed attachment objects**: Attachments missing `url` or with empty `url` strings are filtered out.
3. **Zod v4 schema inference**: Wrapped with `zodSchema()` to ensure `tool()` generic overload `Tool<INPUT, OUTPUT>` correctly resolves `INPUT`.

## Next Steps

1. Inject `DASHSCOPE_API_KEY` into `apps/sg-tutor/.env.local` for live inference.
2. Test multimodal flow end-to-end with actual image uploads.
3. Connect mastery logging tool output to Firestore persistence layer.
