# FOMO Intercept & Latency Removal

**Date:** 2026-03-08
**Commit:** see below

## Summary

Removed all artificial latency, injected a state-dependent FOMO interception rule, refactored the QuickReply state machine, and created a full code audit dump.

## 1. Latency Removed — `route.ts`

| Removed | Description |
|---------|-------------|
| `humanizationTransform` | 40-100ms per-chunk jitter TransformStream |
| Read Receipt delay | 20ms/character, capped at 2500ms |
| `experimental_transform` | Reference to humanizationTransform in streamText() |
| `StreamTextTransform` import | No longer needed |

## 2. FOMO Intercept — `route.ts`

Added **Rule 0 (HIGHEST PRIORITY)** to `<universal_laws>`. Fires when the user's first message matches "Leave my details" or "I have a question" intent. Returns a verbatim FOMO interception script ending with "would you like me to help you secure the $10 offer now?"

## 3. QuickReply State Machine — `page.tsx`

| State | Trigger | Buttons |
|-------|---------|---------|
| **Initial** | No user messages yet | Secure $10 / Leave details / Question |
| **FOMO Intercept** | Bot's last message contains "would you like me to help you secure the $10 offer now?" | Yes, secure $10 / Leave details / Question |
| **Hidden** | All other states | No buttons |

Removed unused: `useMemo`, `offerVariations`, `questionVariations`, `detailsVariations`, `pickRandom()`.

## 4. Audit Dump

Full code snapshot created at `/docs/audits/mvp-code-state.md`.

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
