// Purpose: Shared type definitions for the sg-tutor application.
// Consolidated in Sprint 16 to eliminate duplicate type definitions
// scattered across prompt-router.ts, rag-types.ts, chinese-text.tsx,
// and dashboard/page.tsx. All consumers should import from this file.

// Purpose: Supported grade levels matching the Singapore MOE Primary syllabus.
// P1-P6 corresponds to Primary 1 through Primary 6 (ages 7-12).
export type GradeLevel = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6';

// Purpose: Ordered list of all grade levels for UI selectors and iteration.
export const GRADE_LEVELS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'] as const;

// Purpose: Grade subsets for conditional UI logic.
export const LOWER_PRIMARY: readonly GradeLevel[] = ['P1', 'P2', 'P3'];
export const UPPER_PRIMARY: readonly GradeLevel[] = ['P4', 'P5', 'P6'];
export const NO_SCIENCE_GRADES: readonly GradeLevel[] = ['P1', 'P2'];
