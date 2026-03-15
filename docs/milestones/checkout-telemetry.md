# Milestone: Checkout Telemetry — `checkoutUrl` Cross-SaaS Payment Tracking

**Date:** 2026-03-13
**Status:** ✅ Complete

## Summary

Added an optional `checkoutUrl` field to the `BotConfig` schema, enabling merchants to supply an external checkout gateway URL (e.g. CommitPay). The AI dynamically injects this URL with tracking telemetry parameters (`?ref=salesbot&botId=`) into customer conversations when purchase intent is detected.

## Changes

| File | Action | Description |
|------|--------|-------------|
| `packages/types/src/schemas/saas.ts` | MODIFIED | Added `checkoutUrl?: string` to `BotConfig` interface |
| `apps/hairspa-bot/src/app/(protected)/portal/[botId]/page.tsx` | MODIFIED | Added "CommitPay Checkout Link" input to Core Offer section |
| `apps/hairspa-bot/src/app/api/chat/promptBuilder.ts` | MODIFIED | Injected `<checkout_directive>` with telemetry params when `checkoutUrl` present |
| `apps/hairspa-bot/src/app/page.tsx` | MODIFIED | Upgraded `renderMarkdown()` with markdown link parsing (`target="_blank"`, `rel="noopener noreferrer"`) |

## Verification

- **TypeScript Build:** `npx turbo run build --filter=hairspa-bot` — ✅ 0 errors
- **Portal UI:** New input renders in Section 1 (Core Offer & Identity)
- **LLM Injection:** `<checkout_directive>` only emitted when `checkoutUrl` is non-empty
- **Chat Widget:** Markdown links now render as clickable `<a>` tags opening in new tabs
