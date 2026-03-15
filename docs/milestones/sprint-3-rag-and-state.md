# Sprint 3: RAG Metadata & Chronological State

**Completed:** 2026-03-06T12:50:00+08:00

## Deliverables

| File | Status | Description |
|------|--------|-------------|
| `lib/firebase/rag-types.ts` | ✅ NEW | `RAGQueryParams`, `RAGResult`, `ZeroShotSignal`, `RAGQueryResponse` |
| `lib/firebase/rag-query.ts` | ✅ NEW | `queryRAG()` — Zero-Shot bypass (P1-P3), metadata filtering, Highest Grade Floor |
| `functions/package.json` | ✅ NEW | Isolated Firebase Functions package |
| `functions/tsconfig.json` | ✅ NEW | Standalone TS config targeting Node 18 |
| `functions/src/index.ts` | ✅ NEW | `annualGradePromotion` cron (Jan 1st) — batch-flags users for promotion |
| `app/dashboard/layout.tsx` | ✅ MODIFIED | Grade promotion modal ("Happy New Year!") with Confirm/Stay buttons |
| `tsconfig.json` | ✅ MODIFIED | Excluded `functions/` from main build (self-heal) |

## Incident Log

| Severity | Incident | Resolution |
|----------|----------|------------|
| Medium | `functions/src/index.ts` included in main `tsc` via `**/*.ts` glob — TS2307 for `firebase-functions/v2/scheduler` | Self-healed: added `"functions"` to `tsconfig.json` `exclude` array |

## DoD

- `npx tsc --noEmit` → **0 errors** (after self-heal)
