# Collapsible Widget UI

**Date:** 2026-03-07
**Commit:** see below

## Summary

Refactored the full-screen chat UI into a collapsible "Takeover Overlay" widget positioned over a simulated Jean Yip salon background. Proves the MVP UX for client-side integration.

## Architecture

| State | Renders |
|-------|---------|
| `isExpanded = false` | FAB launcher (bottom-right, amber/orange gradient, "JY" logo) |
| `isExpanded = true` | Fixed overlay (`85vh × 400px max`, rounded, shadowed) with close "↓" button |

## Background Simulation

- Rich CSS gradient (`stone-100 → amber-50 → stone-200`) with decorative blur blobs
- Placeholder site content: brand name, tagline, feature pills (Scalp Detox / Botanicals / Outlets)

## Preserved Logic

- `INITIAL_MESSAGES`, `offerVariations`, `questionVariations`, `detailsVariations`
- `pickRandom`, `useMemo`-locked quick replies
- `renderBoldMarkdown`, `showQuickReplies`, `handleFormSubmit`
- `useChat`, `TypingIndicator`, streaming state

## Verification

- `npx turbo run build --filter=hairspa-bot` — zero TS errors ✅
