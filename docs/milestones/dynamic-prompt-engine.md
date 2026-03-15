# Dynamic Prompt Engine

**Date:** 2026-03-10
**Commit:** see below

## Summary

Refactored the hardcoded `SYSTEM_PROMPT` into a dynamic generator that fetches and injects the merchant's BotConfig from Firestore at runtime.

## New File — `promptBuilder.ts`

`buildSystemPrompt(config)` converts the static prompt into a template literal with these injection points:

| Injection Point | Config Field |
|-----------------|-------------|
| `<role>` tag | `config.botName` |
| `<objective>` tag | `flashOffer`, `regularPrice` |
| Rule 0 (FOMO Intercept) | `flashOffer`, `regularPrice` |
| Rule 1 (Offer Integrity) | `regularPrice`, `flashOffer` |
| Rule 3 (Objection Handling) | `regularPrice`, `flashOffer` |
| Rule 4 (Identity) | `flashOffer` |
| Rule 6 (Telemarketing) | `regularPrice` |
| Rule 7, PATH A | `flashOffer`, `commitPayUrl` |
| Rule 7, PATH B Step 3 | `appointmentDays.join(", ")` |
| Rule 7, PATH B Step 4 | `appointmentSlots.join(", ")` |
| Rule 7, PATH B Step 5 | `finalContactQuestion` |
| Rule 7, PATH B Step 6 | `flashOffer`, `commitPayUrl` |
| Rule 8 (FOMO Loop) | `fomoMessage` |

## Refactored — `route.ts`

| Change | Detail |
|--------|--------|
| Imports | Added `getAdminDb`, `buildSystemPrompt` |
| Config fetch | Reads `botId` from request JSON, fetches from Firestore `bots` collection |
| MVP fallback | If no `botId`, fetches first doc in collection |
| Graceful degradation | Nested try/catch — if Firebase fails, uses `FALLBACK_CONFIG` (original Jean Yip defaults) |
| Diagnostics | Logs config source (`doc:botId` or `first-in-collection`) |

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
- XML tag structure preserved in template literal ✅
- Fallback protocol ensures chat never breaks if Firestore is down ✅
