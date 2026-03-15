# Incident Log: SG Tutor — Schema Validation Fix
**Date**: 2026-03-05
**Timestamp**: 19:35:00+08:00
**Milestone**: sg-tutor-schema-fix

## Summary

Resolved `ModelMessage[] schema` validation error from the Alibaba DashScope provider by converting raw client UI messages through `convertToModelMessages()`.

## Root Cause

The `useChat` hook sends messages in the `UIMessage` format (with `id`, `parts`, `experimental_attachments` etc.). The Alibaba provider's DashScope API expects strict `ModelMessage[]` schema (`role` + `content` string or content parts). Passing raw UI messages directly caused schema validation failure.

## Fix Applied

### `app/api/chat/route.ts`
1. Imported `convertToModelMessages` from `"ai"`
2. Pre-sanitize: strip empty/malformed `experimental_attachments` arrays (Qwen edge case)
3. Convert: `const modelMessages = await convertToModelMessages(sanitizedMessages)`
4. Pass `modelMessages` (not raw `sanitizedMessages`) to `streamText`

> [!NOTE]
> `convertToModelMessages` is async in AI SDK v6 (returns `Promise<ModelMessage[]>`), unlike v5's sync `convertToCoreMessages`.

## Build Verification

```
npm run build -w sg-tutor → EXIT CODE 0
✓ Compiled successfully
✓ Checking validity of types
```
