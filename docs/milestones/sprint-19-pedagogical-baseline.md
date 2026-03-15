# Sprint 19: Pedagogical Baseline (Sprints 17-19)

**Completed:** 2026-03-06T15:12:00+08:00

## Deliverables

| Sprint | File | Status | Description |
|--------|------|--------|-------------|
| 17 | `lib/constants/syllabus.ts` | ✅ MODIFIED | +158 lines: MATH_SCOPE, SCIENCE_SCOPE, CHINESE_VOCAB |
| 18 | `config/moe-dictionary.json` | ✅ MODIFIED | +7 entries: 3 Science traps + 4 Math heuristics (16 total) |
| 19 | `lib/ai/prompt-router.ts` | ✅ MODIFIED | `buildScopeBoundary()` + scope injection in `applyRuntimeModifiers` |

## Sprint 17: Scope & Sequence Constants
- `MATH_SCOPE`: P1-P6 topic boundaries (number bonds → algebra)
- `SCIENCE_SCOPE`: P3-P6 themes (P1-P2 empty arrays)
- `CHINESE_VOCAB`: P1-P6 tiers (Foundational → Advanced) with categories and notes

## Sprint 18: MOE Dictionary Expansion
- Science traps: `heat` (gained heat from), `states_of_matter` (reached its boiling point), `magnets` (magnetic material)
- Math heuristics: P1-P2 algebra ban, P3-P4 bar models, P5 assumption method, P6 basic substitution

## Sprint 19: Prompt Router Binding
- `buildScopeBoundary()`: Generates dynamic restriction clause using MATH_SCOPE/SCIENCE_SCOPE/CHINESE_VOCAB
- Injected into `applyRuntimeModifiers()` as the first modifier layer
- Math heuristics automatically pulled from `getMoeRules()` based on grade range

## DoD

| Sprint | `npx tsc --noEmit` | Status |
|--------|---------------------|--------|
| 17 | 0 errors | ✅ |
| 18 | 0 errors | ✅ |
| 19 | 0 errors | ✅ |
