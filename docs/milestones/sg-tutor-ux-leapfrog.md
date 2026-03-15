# Milestone: SG Tutor UX Leapfrog

**Date:** 2026-03-05
**App:** `sg-tutor`
**Status:** COMPLETE ✅

## Summary of Changes

### 1. Accordion Sidebar (`app/dashboard/layout.tsx`)
- Replaced the flat "Levels" and "Subjects" sections with a collapsible accordion navigator.
- Lists all levels from **Primary 1** through **Secondary 4**.
- Each level expands to reveal **Mathematics**, **Science**, **English**, and **Mother Tongue** subject links.
- **Primary 6 PSLE** is expanded by default via `useState<Set<string>>(new Set(["p6"]))`.
- Clicking a subject navigates to `/dashboard?level=p6&subject=MATH` etc.
- Uses `lucide-react` `ChevronDown` / `ChevronRight` icons for expand/collapse state.
- Smooth CSS `max-height` transition for animation.

### 2. Cold-Start Topic Grid (`app/dashboard/chat/page.tsx`)
- When the chat `messages` array is empty, a "Jump straight into popular topics 📌" section renders.
- 4 gradient-styled cards: **Percentage**, **Geometry**, **Algebra**, **Speed & Distance**.
- Each card fires `sendMessage({ text: "Help me understand [Topic] with a Primary 6 PSLE example." })`.
- Responsive grid: `grid-cols-2 md:grid-cols-4`.

### 3. Socratic Momentum Pills

**Backend (`app/api/chat/route.ts`):**
- Appended a `<follow_up_rule>` block to `SYSTEM_PROMPT` that instructs Qwen-VL-Max to output exactly 3 follow-up questions at the end of every response in a strict `###SUGGESTIONS###` format.

**Frontend (`app/dashboard/chat/page.tsx`):**
- `parseSuggestions(text)` utility splits assistant messages at the `###SUGGESTIONS###` marker.
- Main teaching content renders normally in the chat bubble.
- Parsed follow-up questions render as **blue pill-shaped buttons** below the AI bubble.
- Clicking a pill fires `sendMessage({ text: question })`, instantly continuing the Socratic conversation.
- Pills are hidden while the AI is still streaming to prevent premature clicks.

## Build Verification
- `npm run build -w sg-tutor` exited with **code 0**.
- Zero TypeScript errors.
- Warnings about `useSearchParams()` deopting pages to CSR are expected (pre-existing, non-blocking).
