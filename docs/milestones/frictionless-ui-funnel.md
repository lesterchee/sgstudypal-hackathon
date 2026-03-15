# Frictionless UI Funnel

**Date:** 2026-03-08
**Commit:** see below

## Summary

Implemented a multi-stage clickable QuickReply funnel for Outlet, Day, and Time selection across schema, backend prompt, and frontend state machine.

## Schema — `saas.ts`

- `BotConfig.appointmentDays: string[]` — added
- `Lead.preferredDay?: string` — added

## Backend — `route.ts` PATH B

| Step | Prompt |
|------|--------|
| 1 | Name |
| 2 | Email & Phone (with CRITICAL VALIDATION) |
| 3 | Outlet (Bedok Mall, Century Square, Parkway Parade, Westgate, Plaza Singapura) |
| **4** | **Day (Monday–Sunday)** ← NEW |
| 5 | Time Slot (10am-12pm, 12pm-4pm, 4pm-8pm) |
| 6 | Confirm + $10 upsell |

**`<critical_directive>`** updated: includes "Day" in the completion check.

## Frontend — `page.tsx` QuickReply State Machine

| State | Detection | Buttons |
|-------|-----------|---------|
| Initial | No user messages | Secure $10 / Leave details / Question |
| FOMO Intercept | Text includes "$10 offer now?" | Yes $10 / Leave details / Question |
| **Outlet** | Text includes "Bedok Mall" + "Plaza Singapura" | 5 outlet buttons |
| **Day** | Text includes "Monday" + "Sunday" | 7 day buttons |
| **Time** | Text includes "10am-12pm" + "4pm-8pm" | 3 time slot buttons |

`showQuickReplies` now gated by `activeQuickReplies.length > 0` — buttons auto-clear between stages.

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
