# Incident Log: SG Tutor — Chat Silent Failure Fix
**Date**: 2026-03-05
**Timestamp**: 19:18:00+08:00
**Milestone**: sg-tutor-chat-fix

## Summary

Resolved the silent chat failure where the LLM halted after executing `log_student_mastery` without producing a text response. Added error boundary UI for surfacing DashScope API errors.

## Root Cause

In AI SDK v6, `streamText` defaults to `stopWhen: stepCountIs(1)`, meaning it stops after the first step. When the LLM calls `log_student_mastery`, that consumes the single step. The LLM never gets a chance to produce a text response.

## Changes Made

### Server-Side (`app/api/chat/route.ts`)
- Imported `stepCountIs` from `"ai"`
- Added `stopWhen: stepCountIs(5)` to `streamText` config — allows the LLM to call the mastery tool and still yield a text response

### Client-Side (`app/dashboard/chat/page.tsx`)
- Destructured `error` from `useChat()` for error boundary rendering
- Added red error banner that displays `error.message` for immediate debugging
- **Self-healed**: Removed invalid `maxSteps` option (does not exist in AI SDK v6 `UseChatOptions`)

## Key Discovery

| Concept | AI SDK v5 | AI SDK v6 |
|---|---|---|
| Multi-step tool calling | `maxSteps` in `useChat` (client) | `stopWhen: stepCountIs(N)` in `streamText` (server) |
| Default step count | `maxSteps: 1` | `stepCountIs(1)` |

## Build Verification

```
npm run build -w sg-tutor → EXIT CODE 0
✓ Compiled successfully
✓ Checking validity of types
```
