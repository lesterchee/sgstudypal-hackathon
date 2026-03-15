# Chat Widget UI Polish

**Date:** 2026-03-12  
**Scope:** `apps/hairspa-bot` — Public Chat Widget (`app/page.tsx`)  

---

## Changes

### 1. iOS Zoom Fix
- Input `text-[13px]` → `text-[16px]` — prevents Safari auto-zoom on focus.

### 2. Dynamic Viewport Height (100dvh)
- Container: `inset-0` + `height: 100dvh` on mobile — fullscreen, no URL bar cropping.
- Desktop: `sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[85vh]` retains floating card layout.

### 3. Smooth Auto-Scrolling
- `useEffect` dependency array: `[messages]` → `[messages, isStreaming]`.
- Scrolls into view during streaming, not just on new message arrival.

## Verification
- ✅ `next build` — compiled successfully (0 errors)
