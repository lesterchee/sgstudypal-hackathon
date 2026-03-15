# UI/UX Refinements — Currency Symbols & Reactive FOMO

**Date:** 2026-03-12  
**Scope:** `apps/hairspa-bot` — Bot Configuration Portal  
**Commit:** `feat(hairspa-bot): persistent $ currency symbols + reactive FOMO message`

---

## Changes

### 1. Persistent Currency Symbols (Core Offer Card)
- Regular Price and Flash Offer inputs now display a fixed `$` prefix via an absolute-positioned `<span>` inside a `relative` container.
- State stores numeric-only strings (`"28"`, `"10"`) — the `$` is purely presentational.
- `onChange` handlers strip any manually typed `$` characters.

### 2. Reactive FOMO Message (Conversion Psychology Card)
- FOMO message is computed dynamically from `flashOffer` and `regularPrice` state.
- Template: `"The $${flashOffer || '[Flash Price]'} is only available if secured online now…"`
- Textarea is now **read-only** (`bg-slate-100 cursor-not-allowed`).
- "Restore recommended" button resets prices to defaults (`$28` / `$10`).

## Verification
- ✅ `next build` — compiled successfully (0 errors, 0 warnings)
- ✅ No breaking changes to the data contract (`fomoMessage` still persists to Firestore via `handleSave`)
