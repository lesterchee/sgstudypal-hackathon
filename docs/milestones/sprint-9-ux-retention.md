# Sprint 9: UX & Retention Pipeline

**Completed:** 2026-03-06T14:42:00+08:00

## Deliverables

| File | Status | Description |
|------|--------|-------------|
| `components/ui/socratic-loader.tsx` | ✅ NEW | Cycling skeleton loader (4 messages × 3s interval), safe cleanup on unmount/early return |
| `jobs/weekly-report.ts` | ✅ NEW | Friday 5PM cron, topic mastery aggregation (Struggled <50% / Mastered ≥80%), XP summary |
| `lib/ai/prompt-router.ts` | ✅ MODIFIED | `TutorMode` type, `failedAttempts` param, `applyRuntimeModifiers()` suffix layer |
| `app/dashboard/page.tsx` | ✅ MODIFIED | Vault/Helper segmented control with BookLock/Wand icons |

## DoD

- `npx tsc --noEmit` → **0 errors**
