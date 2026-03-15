# Knowledge Base Schema Upgrade

**Date:** 2026-03-12  
**Scope:** `@repo/types` + `apps/hairspa-bot`  

---

## Schema Changes (`BotConfig.knowledgeBase`)

| Field | Before | After |
|---|---|---|
| `websiteUrl` | ❌ N/A | ✅ NEW mandatory |
| `businessFacts` | `string` | `string?` optional |
| `youtubeAssets` | `{ url, purpose }[]` | `{ url, purpose }[]?` optional |
| `supportPhone` | `string` | `string?` optional |
| `supportEmail` | `string` | `string` required (enforced in UI) |

## UI Changes

- **Client Website URL** — new input at top of Knowledge Base card (link icon, required `*`)
- **~Optional labels** — Training Documents, Business Facts & FAQs, YouTube Asset Links
- **Support Email** — marked with red `*` required indicator
- **Support Phone** — `~Optional` label, placeholder changed to `+65 0000-0000`
- **Form validation** — `handleSave` now checks `websiteUrl` and `supportEmail`

## Verification
- ✅ `next build` — compiled successfully (0 errors)
