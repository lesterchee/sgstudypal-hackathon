# Portal UI Wired

**Date:** 2026-03-10
**Commit:** see below

## Summary

Converted the static Client Portal HTML into a fully stateful Next.js Client Component wired to the `/api/bots` endpoint, with synchronized DB schema.

## Schema Changes — `saas.ts`

| Change | Detail |
|--------|--------|
| `BotConfig.finalContactQuestion` | New `string` field for the lead-closing question |
| `BotConfig.knowledgeBase.youtubeAssets` | Replaced `youtubeLinks: string[]` → `{ url: string; purpose: string }[]` |
| `BotConfig.brandSettings.avatarUrl` | New optional `string` field |

## Portal Page — `apps/hairspa-bot/src/app/portal/page.tsx`

### State Architecture

| State | Type | Purpose |
|-------|------|---------|
| `config` | `BotConfigState` | Master config object with all form fields |
| `isSaving` | `boolean` | Loading state for API calls |
| `missingFields` | `string[]` | Validation errors displayed in banner |

### Functional Updaters (No Direct Mutation)

| Helper | Targets |
|--------|---------|
| `updateField(key, value)` | Top-level config fields |
| `updateGuidedFunnel(key, value)` | `config.guidedFunnel.*` |
| `updateKnowledgeBase(key, value)` | `config.knowledgeBase.*` |
| `updateBrandSettings(key, value)` | `config.brandSettings.*` |
| `toggleDay(day)` | `appointmentDays` array toggle |
| `updateSlot(index, value)` | `appointmentSlots` by index |
| `updateYouTubeAsset(index, field, value)` | Specific YouTube asset field |
| `addYouTubeAsset()` / `removeYouTubeAsset(index)` | YouTube asset CRUD |
| `toggleVariation(variation)` | `secureOfferVariations` checkbox toggle |

### Sections (7)

1. Core Offer & Identity — botName, regularPrice, flashOffer, coreObjective
2. Conversion Psychology — fomoMessage with "Restore recommended" button
3. The Guided Funnel — 3 funnel options, variation checkboxes, commitPayUrl, finalContactQuestion
4. Appointment Scheduling — 7-day toggle buttons, 3 time slot inputs
5. Knowledge Base — file upload placeholder, businessFacts, youtube asset CRUD, escalation routing
6. Brand Settings — avatar placeholder, logo upload placeholder, primaryColor with live swatch
7. The Engine Room — locked read-only section with tooltip

### Validation

- `handleSave` checks botName, regularPrice, flashOffer
- Missing fields → red banner at top of page with auto-scroll
- POSTs to `/api/bots`

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
- `/portal` route registered as static page ✅
