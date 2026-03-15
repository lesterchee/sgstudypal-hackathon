# Data Validation Prompt

**Date:** 2026-03-08
**Commit:** see below

## Summary

Added a CRITICAL VALIDATION gate to Path B Step 2 in the system prompt. The AI must verify email and phone data before advancing the lead capture funnel.

## Validation Rules

| Field | Check |
|-------|-------|
| **Email** | Must contain `@` and a valid domain structure |
| **Phone** | Must look like a standard 8-digit Singapore number |

## Rejection Behaviour

If the user provides obvious dummy data (`1234567`, `test@test.com`, `abc`, etc.), the AI gently flags it and re-asks. The funnel does **not** advance to Step 3 until data looks realistically valid.

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
