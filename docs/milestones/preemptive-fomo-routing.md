# Pre-emptive FOMO Routing

**Date:** 2026-03-07
**Commit:** see below

## Summary

Updated Rule 7's question-intent branch to deliver a pre-emptive FOMO message the instant the user selects a "question" Quick Reply — before they even ask their specific question. This creates a double FOMO funnel: Rule 7 fires on initial selection, and Rule 8 fires after every answered question.

## Backend — `route.ts`

**Rule 7 question-intent branch:**

| Before | After |
|--------|-------|
| Static: "Of course 😊 You're welcome to ask any questions you may have, or leave your details if you prefer." | **Pre-emptive FOMO**: Welcomes questions, then immediately delivers $10 vs $28 price dynamic with a conversion question at the end |

Key constraint: Wording must be dynamically varied every time but must always hit: (1) welcome, (2) $10 online-only pricing, (3) $28 revert if details left for later, (4) close with "$10 offer now?" question.

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
