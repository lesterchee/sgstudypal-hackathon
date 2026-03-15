# Portal UI Micro-Interactions

**Date:** 2026-03-12  
**Scope:** `apps/hairspa-bot` — Bot Configuration Portal  

---

## Changes

### 1. Dynamic AI Refresh (Option 01)
- ✅ Already wired — `handleGenerate` passes `flashOffer` and `regularPrice` in every API call.

### 2. Default Copy Updates
- Option 02 default: `"Ask Question"` → `"I have a question"`
- Option 03: `bookLaterText` now reactively bound to `regularPrice` via `useEffect`.  
  Template: `` `Leave my details for the $${regularPrice || '[Regular Price]'} promo` ``  
  Input is read-only with helper text: _"This text updates automatically when you change the Regular Price."_

### 3. Unchecked Days UI
- Unchecked days: `bg-slate-100 text-slate-400 line-through` + absolute diagonal cross overlay.
- Active days retain `bg-[#f48c25] text-white` styling.

### 4. Time Slot Restore Buttons
- Each slot shows a "Restore recommended" button (orange accent) only when the value differs from `DEFAULT_SLOTS`.
- Defaults: `10am - 12pm`, `12pm - 4pm`, `4pm - 8pm`.

### 5. Sticky Header Upgrade
- Replaced semi-transparent `backdrop-blur` header with solid `bg-white shadow-sm`.
- Cards no longer bleed through the header on scroll.
- Validation banner z-index bumped to `z-[51]` to stack above header.

### 6. Save & Close Button
- New outline button in sticky header with `logout` icon.
- Calls `handleSave()` → on success routes to `/dashboard` via `useRouter`.
- `handleSave` refactored to return `Promise<boolean>`; shared loading/disabled state.

### 7. Button Dimension Normalization
- All 3 header buttons: `h-10 whitespace-nowrap` for uniform height and no text wrapping.

## Verification
- ✅ `next build` — compiled successfully (0 errors)
