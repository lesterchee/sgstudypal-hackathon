# Sprint 20: Prompt Hardening & OCR LaTeX
**Completed:** 2026-03-06T15:22:00+08:00

## Changes
| File | Change |
|------|--------|
| `ocr-pipeline.ts` | LaTeX mandate: `\\frac{3}{4}` format for all math in extraction |
| `prompt-router.ts` | 4 defense clauses in BASE_IDENTITY |

## Defense Clauses
1. **Jailbreak Guard**: Refuses off-topic engagement
2. **Step Validation**: Traces working, validates correct steps, pinpoints error line
3. **Theorem Trap**: Redirects secondary math to MOE primary methods
4. **Tone Mirroring**: Matches Singlish/informal SG phrasing

## DoD: `npx tsc --noEmit` → 0 errors ✅
