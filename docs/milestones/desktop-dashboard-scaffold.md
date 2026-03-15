# Milestone: Desktop Dashboard Scaffold

**Date:** 2026-03-06
**App:** `sg-tutor`
**Status:** COMPLETE ✅

## Summary
Scaffolded the desktop dashboard UI: standalone Sidebar component with gamification routing and a central "My Question Queue" command center page.

## Files Created/Modified

| File | Action | Detail |
|------|--------|--------|
| `components/layout/Sidebar.tsx` | **NEW** | Standalone sidebar with 6 nav items (Dashboard, AI Tutor, My Questions + "3 Pending" badge, My Badges, My Accomplishments, Settings). Each item has a unique active gradient. Includes ghost user footer. |
| `app/dashboard/page.tsx` | **OVERWRITTEN** | Command center with: ghost user header (streak badge, XP progress bar, mastery level), 3 pending question cards, drag-drop zone, QR Scanner button, recently solved papers list (4 entries with scores), AI Tutor CTA card. |
| `scripts/harvester.ts` | **MODIFIED** | Fixed pre-existing TS error: cast `sniffedUrl` to `string \| null` to resolve `Property 'split' does not exist on type 'never'`. |

## UI Panels

### Top Header
- Ghost avatar with "Welcome back, Scholar!" greeting
- 🔥 3 Day Streak badge (orange)
- ⭐ Novice Scholar mastery badge (violet)
- XP progress bar: 68% (320/500 to Level 4)

### Central Queue
- 3 pending question cards with emoji thumbnails, subject/topic labels, and timestamps
- Image drop zone (PNG, JPEG, WebP)
- "Generate QR Scanner" button

### Recently Solved
- 4 completed paper entries with scores (e.g. "2024 Nanyang Prelim (Math) — 38/40")

### AI Tutor CTA
- Gradient card linking to `/dashboard/chat`

## Build Verification
- `npm run build -w sg-tutor` — **Exit code 0**, zero TS errors.

---

## Update: Grade Level Type Mutation & MVP Banner (2026-03-06)

### Type Mutation (`packages/types/src/schemas/user.ts`)
- Added `gradeLevel: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'Unassigned'` to `UserProfile`.
- Updated Purpose comment to mention chronological grade-level routing for syllabus constraints.

### MVP Banner (`app/dashboard/page.tsx`)
- Added grade level selector dropdown (P1–P6) in the header.
- Conditional amber warning banner for P1/P2/P3: "From our experience, students from Primary 1–3 have difficulty typing. We recommend using this AI Tutor with parent supervision."
- Banner bypasses complex Voice-UI engineering for the MVP phase.

### Build Verification
- `npm run build -w sg-tutor` — **Exit code 0**, zero TS errors.
