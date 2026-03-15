# Milestone: MOE Pedagogy Dictionary Engine

**Date:** 2026-03-06
**App:** `sg-tutor`
**Status:** COMPLETE ✅

## Summary
Established the MOE Dictionary — a declarative JSON rule engine mapping pedagogical constraints, mandatory keywords, and forbidden concepts across the P1–P6 Singapore syllabus — with a type-safe TypeScript accessor.

## Files Created

| File | Detail |
|------|--------|
| `config/moe-dictionary.json` | 8 topic rules covering Science (P4–P5), Math (P1, P4, P6), English (Upper Primary), and Chinese (Upper Primary). Each entry has `mandatory_keywords`, `forbidden_words`, and `core_concept`. |
| `lib/moe/dictionary.ts` | Type-safe accessor: `getMoeRules(topicId)` returns a `MoeRule` or safe fallback. Also exports `getAllTopicIds()` for enumeration. |

## Topic Rules

| Topic ID | Subject | Level |
|----------|---------|-------|
| `science_p5_water_cycle` | Science | P5 |
| `science_p5_plant_transport` | Science | P5 |
| `science_p4_light_shadows` | Science | P4 |
| `math_p1_number_bonds` | Math | P1 |
| `math_p4_whole_numbers` | Math | P4 |
| `math_p6_ratio` | Math | P6 |
| `english_upper_synthesis_reported` | English | Upper |
| `chinese_upper_composition` | Chinese | Upper |

## Usage
```ts
import { getMoeRules } from "@/lib/moe/dictionary";

const rules = getMoeRules("math_p6_ratio");
// rules.mandatory_keywords → ["equivalent ratios", "unchanged total", ...]
// rules.forbidden_words    → ["cross-multiply", "algebraic substitution", ...]
// rules.core_concept       → "Compare quantities using units..."
```

## Build Verification
- `npm run build -w sg-tutor` — **Exit code 0**, zero TS errors.
