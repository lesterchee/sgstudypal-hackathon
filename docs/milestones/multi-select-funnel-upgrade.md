# Multi-Select Funnel Upgrade

**Date:** 2026-03-08
**Commit:** see below

## Summary

Compressed the lead capture funnel, introduced multi-select chip UI, and added Contact Preference as a final funnel step.

## Schema — `saas.ts`

- `Lead.contactPreference?: string` — added

## Backend — `route.ts` PATH B (Compressed)

| Step | Prompt |
|------|--------|
| 1 | Name + Email + Phone (single message, with validation) |
| 2 | Preferred Outlet(s) — multi-select |
| 3 | Preferred Day(s) — multi-select |
| 4 | Preferred Time Slot(s) — multi-select |
| 5 | Contact Preference (WhatsApp / Phone Call + preferred time) |
| 6 | Confirm + $10 upsell |

## Frontend — `page.tsx` Multi-Select Chip Paradigm

| Feature | Detail |
|---------|--------|
| `selectedChips` state | `useState<string[]>([])` |
| Reset effect | `useEffect` clears chips when `messages` changes |
| `toggleChip(chip)` | Adds/removes chip from selection array |
| `confirmSelection()` | Joins `selectedChips` with commas, sends as message, clears array |
| Guard | Confirm button hidden when `selectedChips.length === 0` |

### Render Modes

| Stage | Render |
|-------|--------|
| Initial / FOMO | Instant-send buttons (no checkboxes) |
| Outlet / Day / Time | Toggleable rounded chips → Confirm button |

Selected chips show gradient background with ✓ prefix. Confirm button shows count: "Confirm Selection(s) (3)".

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
