# Null-Safety Fixes — `.length` on Undefined

**Date**: 2026-03-13
**Timestamp**: 07:12:00+08:00
**Milestone**: null-safety-fixes

## Summary

Audited all React UI components in `apps/hairspa-bot` for unsafe `.length` checks on dynamic Firestore data. Applied optional chaining / nullish coalescing fixes to prevent runtime `TypeError: Cannot read properties of undefined (reading 'length')` crashes when rendering legacy Firestore documents with missing schema fields.

## Root Cause

The `loadConfig` function in `portal/[botId]/page.tsx` used a **shallow spread merge**:
```ts
setConfig((prev) => ({ ...prev, ...data.config }));
```
When a legacy Firestore doc had a partial `guidedFunnel` object (e.g., missing `secureOfferVariations`), the shallow spread would **clobber** the entire default `guidedFunnel` with the incomplete one, causing downstream `.length` and `.map()` calls to crash on `undefined`.

## Component Crash Report

| Component | File | Risk | Status |
|---|---|---|---|
| `portal/[botId]/page.tsx` | `loadConfig` shallow merge | 🔴 **ROOT CAUSE** | Fixed — deep merge |
| `portal/[botId]/page.tsx` | `secureOfferVariations.length` (L590) | 🔴 Crash | Fixed — `?.length ?? 0` |
| `portal/[botId]/page.tsx` | `questionVariations.length` (L647) | 🔴 Crash | Fixed — `?.length ?? 0` |
| `portal/[botId]/page.tsx` | `bookLaterVariations.length` (L690) | 🔴 Crash | Fixed — `?.length ?? 0` |
| `portal/[botId]/page.tsx` | `youtubeAssets.map()` (L859) | 🔴 Crash | Fixed — `?? []` |
| `portal/[botId]/page.tsx` | `youtubeAssets.length` (L875) | 🔴 Crash | Fixed — `?.length ?? 0` |
| `portal/[botId]/page.tsx` | `businessFacts` textarea value (L850) | 🟡 Renders "undefined" | Fixed — `\|\| ""` |
| `dashboard/page.tsx` | `bots.length` (L198) | ✅ Safe | Guarded by `isLoading` ternary |
| `page.tsx` (chat widget) | `activeQuickReplies.length` (L120) | ✅ Safe | Locally initialized array |
| `analytics/[botId]/page.tsx` | `leads.length` (L63) | ✅ Safe | Guarded by `isLoading` + `Array.isArray` |
| `crm/[botId]/page.tsx` | `filteredLeads.length` (L310) | ✅ Safe | Guarded by `isLoading` ternary |
| `crm/[botId]/page.tsx` | `activityHistory.length` (L431) | ✅ Safe | Already uses `&&` guard |

## Fixes Applied

### 1. Deep-Merge in `loadConfig` (Root Fix)
Replaced shallow `{ ...prev, ...data.config }` with deep merge that preserves nested defaults for `guidedFunnel`, `knowledgeBase`, and `brandSettings`.

### 2. Optional Chaining at Render Sites (Defense-in-Depth)
Applied `?.length ?? 0` and `?? []` at all 13 dynamic array/string access points.

## Verification

- `npx turbo run build --filter=hairspa-bot` — **0 TS errors** ✅
- All 14 routes compiled successfully ✅
