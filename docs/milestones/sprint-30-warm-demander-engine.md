# Sprint 30 — Warm Demander Engine (Carnegie + Lemov Fusion)
**Date**: 2026-03-08
**Timestamp**: 22:28:00+08:00
**Milestone**: sprint-30-warm-demander-engine

## Summary

Replaced the Carnegie-only pedagogy block with the **Warm Demander Pedagogy** — a fusion of Carnegie's psychological empathy with Lemov's instructional rigor. The AI now protects the student's ego while strictly enforcing 100% academic accuracy via Qwen Max.

## Changes Made

### `lib/ai/prompt-router.ts`

#### Replaced: `buildCarnegiePedagogy` → `buildWarmDemanderPedagogy`

| # | Constraint | Framework | Rule |
|---|---|---|---|
| 1 | **Personalization** | Carnegie | Use `studentName` naturally, once per response, team framing |
| 2 | **Right is Right + Save Face** | Lemov + Carnegie | NEVER say "Wrong", but NEVER accept half-right as fully correct. Validate the true part, hold the line on what's missing |
| 3 | **No Opt Out** | Lemov | If student says "I don't know", break concept into a micro-question. Student MUST state the final correct answer |
| 4 | **Stretch It + Dynamic Praise** | Lemov + Carnegie | Praise process, not just answer. When `failedAttempts > 0`, over-index on praise then IMMEDIATELY follow with a harder edge-case of `currentConcept` |

#### Modified: `generateSystemPrompt()` signature
```diff
  generateSystemPrompt(
    gradeLevel, isParentMode, subject,
-   tutorMode?, failedAttempts?, studentName?
+   tutorMode?, failedAttempts?, studentName?, currentConcept?
  )
```

#### Modified: `applyRuntimeModifiers()`
- Now accepts `currentConcept?` parameter
- Passes it to `buildWarmDemanderPedagogy` (defaults to `"this topic"`)

## Interpolation Variables

| Variable | Source | Fallback |
|---|---|---|
| `studentName` | Firebase Auth displayName / session | `"student"` |
| `failedAttempts` | Mastery tool session counter | `0` |
| `currentConcept` | Active concept from chat context | `"this topic"` |

## Routing Protocol

- All evaluation routed through **Qwen Max** (DashScope provider)
- **No Anthropic/Claude imports** — verified via `grep -r` (zero matches)
- Low APAC latency preserved

## Verification

```
npx tsc --noEmit → ZERO errors (clean output)
grep -r "anthropic|claude" → No matches found
```
