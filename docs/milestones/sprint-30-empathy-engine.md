# Sprint 30 — The Carnegie Injection (Empathy Engine)
**Date**: 2026-03-08
**Timestamp**: 22:20:00+08:00
**Milestone**: sprint-30-empathy-engine

## Summary

Injected the `CARNEGIE_PEDAGOGY` constraint block into the dynamic prompt router, enforcing psychological empathy, face-saving corrections, collaborative Socratic framing, and perseverance-scaled dynamic praise.

## Changes Made

### `lib/ai/prompt-router.ts`

#### New: `buildCarnegiePedagogy(studentName, failedAttempts)` function

Returns a `<carnegie_pedagogy>` XML block with four mandatory constraints:

| # | Constraint | Rule |
|---|---|---|
| 1 | **Personalization** | Use `studentName` naturally (once per response, not overused) |
| 2 | **Save Face** | NEVER say "No", "Wrong", "Incorrect" — validate logic first, then redirect |
| 3 | **Socratic Collaboration** | No direct orders ("Draw a Bar Model"). Use collaborative questions ("What if we drew a Bar Model?") |
| 4 | **Dynamic Praise** | Praise the process, not just the answer. Conditional `PERSEVERANCE OVERRIDE` when `failedAttempts > 0` |

#### Modified: `generateSystemPrompt()` signature
```diff
  generateSystemPrompt(
    gradeLevel, isParentMode, subject,
-   tutorMode?, failedAttempts?
+   tutorMode?, failedAttempts?, studentName?
  )
```

#### Modified: `applyRuntimeModifiers()` 
- Now accepts `studentName?` parameter
- Appends Carnegie Pedagogy as the **final empathy layer** after all other modifiers
- Defaults `studentName` to `"student"` and `failedAttempts` to `0` if not provided

## Interpolation Variables

| Variable | Source | Fallback |
|---|---|---|
| `studentName` | Active session profile / Firebase Auth displayName | `"student"` |
| `failedAttempts` | Session state counter from mastery tool | `0` |

## Perseverance Override Logic

```
if failedAttempts > 0:
  → Append enthusiastic praise template
  → Scale celebration proportional to struggle count
  → Example: "YES! 🎉🎉🎉 You didn't give up!"
```

## Verification

```
npx tsc --noEmit → ZERO errors (clean output)
```

## Flagged Items

> [!NOTE]
> **`studentName` not yet wired in chat route**: The `route.ts` API handler currently does not pass `studentName` to `generateSystemPrompt()`. It must be extracted from Firebase Auth or session state when auth is fully wired. Until then, the fallback `"student"` is used.
