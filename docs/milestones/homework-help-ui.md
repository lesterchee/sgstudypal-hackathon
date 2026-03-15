# Homework Help UI — Sprint 129–130

**Date:** 2026-03-11
**Status:** Deployed

## Sprint 129 — System Prompt Standardization

**File:** `apps/sg-tutor/app/api/chat/route.ts`

Standardized the `ocrContextSuffix` default value to inject an instruction that forces the AI to end every image analysis with the deterministic phrase:
> "Is my understanding of the question correct?"

This gives the frontend a reliable string to detect the OCR verification state and conditionally render the correct Action Row buttons.

## Sprint 130 — Action Row UI Injection

**File:** `apps/sg-tutor/app/dashboard/homework-help/page.tsx`

Replaced the single ELI5 button (Sprint 123) with a conditional Action Row that renders two distinct button sets based on the AI's response content:

| AI response state | Buttons |
|---|---|
| OCR Verification (contains trigger phrase) | ✅ Yes, help me solve it · ❌ No, let me clarify |
| Post-Solution (all other responses) | 🔄 Give me a similar question · 💡 Explain this further |

All buttons use `sendMessage({ text: "..." })` to inject guided prompts into the chat stream.

## Incident Log

| # | Type | Description | Resolution |
|---|---|---|---|
| 1 | API Adaptation | User spec referenced `append()` — not available in this codebase's `@ai-sdk/react` `useChat` hook | Adapted all Quick Reply handlers to use `sendMessage({ text })` |
| 2 | TSC Verification | `npx tsc --noEmit` — 0 errors | Passed |
