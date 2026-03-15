# Dual-Path Funnel

**Date:** 2026-03-08
**Commit:** see below

## Summary

Rewrote Rules 7 and the critical directive to implement a dual-path routing system based on user intent.

## Path Architecture

| Path | Trigger | Behaviour |
|------|---------|-----------|
| **A** (High Intent) | User wants $10 offer | Immediately provide `[INSERT_COMMITPAYAPP_URL]` — no name, no questions |
| **B** (Low Intent) | User wants to leave details ($28) | 5-step sequential extraction: Name → Email & Phone → Outlet → Time Slot → Confirm + $10 upsell |
| **C** (Questions) | User has a question | Answer briefly, then trigger FOMO Loop (Rule 8) |

## Changes

- **`<objective>`** — Updated for dual-path routing
- **Rule 7** — Completely replaced with Path A / B / C logic
- **`<critical_directive>`** — Path B failsafe: stop questions once all 5 fields (Name, Email, Phone, Outlet, Time Slot) are collected

## Edge Case Analysis

- Path A cannot trigger Path B's sequential questions — the bot is instructed to provide the link and stop immediately
- Path B's FOMO upsell at Step 5 offers a final $10 conversion opportunity even on the low-intent path

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
