# Click-to-Pay Tracker — Milestone Log

> **Date**: 2026-03-11  
> **Sprint**: Click-to-Pay Tracker  
> **Status**: ✅ Complete — DoD Passed

## Summary

Introduced a `/pay/[botId]` dynamic redirect route that acts as a click-tracking interceptor for checkout links in the hairspa-bot.

## Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/pay/[botId]/route.ts` | **NEW** | GET handler — fetches `commitPayUrl` from Firestore, optionally marks lead as `clickedPay: true` / `crmStatus: "Hot"`, then 302-redirects with `?sourceId=` appended. |
| `src/app/api/chat/promptBuilder.ts` | **MODIFIED** | Injected tracking link (`/pay/${config.id}`) instead of raw `commitPayUrl`. Added `<link_attribution>` directive for the bot to append `?leadId=`. |
| `src/app/api/chat/route.ts` | **MODIFIED** | Added `id: "default"` to `FALLBACK_CONFIG` to satisfy updated `PromptBotConfig` interface. |

## Adversarial Edge Cases Addressed

- **Existing query params on `commitPayUrl`**: Uses `URL` constructor with `searchParams.append()`. Falls back to string concat if URL is not absolute.
- **Missing `leadId`**: Firestore update gracefully skipped; redirect still fires.
- **Lead update failure**: Caught and logged — redirect proceeds regardless.
- **Missing env var `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL`**: Falls back to relative `/pay/${config.id}`.

## DoD Validation

- `npx tsc --noEmit` → **0 errors**
- `npm run build` → **Compiled successfully** (1660.6ms), route registered as `ƒ /pay/[botId]`
