# Milestone: SG Tutor Syllabus Architecture

**Date:** 2026-03-05
**App:** `sg-tutor`
**Status:** COMPLETE ✅

## Summary
Centralized all curriculum data into a strongly-typed syllabus module and refactored the PopularTopicsGrid to dynamically render topics based on URL state.

## TypeScript Interfaces

| Interface | Location | Purpose |
|-----------|----------|---------|
| `Topic` | `lib/constants/syllabus.ts` | Single topic: `id`, `title`, `description`, `iconName`, `prompt` |
| `SubjectData` | `lib/constants/syllabus.ts` | Subject container: `math`, `science`, `english`, `mother_tongue` arrays |
| `SyllabusData` | `lib/constants/syllabus.ts` | Top-level: `Record<string, SubjectData>` keyed by level (p1–p6) |

## Files Created/Modified

| File | Action | Detail |
|------|--------|--------|
| `lib/constants/syllabus.ts` | **NEW** | Master syllabus data. P6 Math (8 topics), P6 Science (6 topics). P1–P5 stubbed with `emptySubject()`. |
| `app/dashboard/chat/components/PopularTopicsGrid.tsx` | **NEW** | Reusable grid with `level`/`subject` props, switch/case `IconMapper`, empty-state fallback. |
| `app/dashboard/chat/page.tsx` | **MODIFIED** | Reads `?level=` and `?subject=` from URL via `useSearchParams`. Passes to `<PopularTopicsGrid />`. Removed hardcoded `POPULAR_TOPICS`. |

## Data Entry Guide
To add topics for a new level (e.g. P5), edit `lib/constants/syllabus.ts`:
```ts
p5: {
    math: [
        { id: "...", title: "...", description: "...", iconName: "Calculator", prompt: "..." },
    ],
    science: [...],
    english: [...],
    mother_tongue: [...],
},
```

To add a new icon, add the import in `PopularTopicsGrid.tsx` and add a `case` to the `IconMapper` switch.

## Build Verification
- `npm run build -w sg-tutor` — **Exit code 0**, zero TS errors.
