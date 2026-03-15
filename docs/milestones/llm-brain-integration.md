# LLM Brain Integration — BotConfig → Qwen-Max System Prompt

**Date**: 2026-03-12
**Timestamp**: 21:42:00+08:00
**Milestone**: llm-brain-integration

## Summary

Wired the Chat Widget's `/api/chat` route in `apps/hairspa-bot` to dynamically fetch the merchant's `BotConfig` from Firestore and inject key variables (`botName`, `websiteUrl`, `regularPrice`, `businessFacts/FAQs`) directly into Qwen-Max's system prompt, making the bot a specialized, config-driven sales agent.

## Changes Made

### Prompt Builder Refactor (`src/app/api/chat/promptBuilder.ts`)
- **Before**: Hardcoded Jean Yip Hair Spa template with fixed outlets, services, and branding.
- **After**: Generic, config-driven prompt that dynamically injects:
  - `botName` → `<role>` tag
  - `knowledgeBase.websiteUrl` → `<role>` and `<knowledge_base>` tags
  - `regularPrice` / `flashOffer` → all pricing references
  - `knowledgeBase.businessFacts` → `<knowledge_base>` block for FAQ answering
- Added `<faq_fallback_directive>` — redirects out-of-scope questions to `supportEmail` / `supportPhone`.
- Updated `PromptBotConfig` interface to include `knowledgeBase.websiteUrl`, `supportEmail`, `supportPhone`.

### Chat Route Updates (`src/app/api/chat/route.ts`)
- **404 Edge Case**: If `botId` query param is provided but the Firestore doc doesn't exist, returns `{ error: "Bot not found..." }` with HTTP 404 instead of silently falling back.
- **Deep Merge**: `knowledgeBase` is now deep-merged with `FALLBACK_CONFIG` defaults to preserve unconfigured fields.
- **Fallback Message**: Updated to email-capture verbiage: *"I am currently experiencing high volume. Please leave your email and my human team will contact you."*
- **FALLBACK_CONFIG**: Added `knowledgeBase.websiteUrl`, `supportEmail`, `supportPhone` defaults.

### Types Enhancement (`packages/types/src/schemas/saas.ts`)
- Added optional `faqs?: string` field to `BotConfig.knowledgeBase` as a future-proofing alias.
- Fully backward-compatible — no existing consumers affected.

## Timeout Guardrail (Pre-Existing)
The 8-second `LLM_TIMEOUT_MS` race pattern was already in place (confirmed during audit). No changes needed.

## Verification

- `npx turbo run build --filter=hairspa-bot` — **0 TS errors** ✅
- `/api/chat` registered as dynamic (`ƒ`) route ✅
- All 14 routes compiled successfully ✅
