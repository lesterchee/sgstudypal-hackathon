# Milestone: Ghost Data Protocol

**Date:** 2026-03-06
**Status:** ✅ Complete

## Summary

Established the Ghost Data Protocol by injecting gamification schemas into the shared `@repo/types` package and extending Firestore Security Rules to secure stateful execution for the `/users` collection.

## Changes

| File | Action | Description |
|---|---|---|
| `packages/types/src/schemas/user.ts` | **Created** | `GamificationMetrics` and `UserProfile` interfaces |
| `packages/types/src/index.ts` | **Modified** | Barrel re-export for new user schema |
| `packages/core-engine/src/security/firestore.rules` | **Modified** | `/users/{userId}` read/write rule (auth-gated) |

## Verification

- **TypeScript compilation:** Zero new errors. Pre-existing `harvester.ts:218` error is unrelated.
- **Firestore rule logic:** Authenticated users can read/write only their own `/users/{userId}` document. Default-deny remains enforced for all other paths.

## Ghost State Schemas

- `GamificationMetrics` — tracks `totalProblemsSolved`, `currentStreak`, `masteryLevel`, `totalXP`
- `UserProfile` — supports Anonymous (Ghost) and Verified auth states, links to `GamificationMetrics`
