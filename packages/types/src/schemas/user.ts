// Purpose: Define stateful Gamification metrics to track student progress and mastery.
export interface GamificationMetrics {
    totalProblemsSolved: number;
    currentStreak: number;
    masteryLevel: string; // e.g., 'Novice', 'Scholar', 'Apex'
    totalXP: number;
}

// Purpose: Define the core User entity, supporting Ghost/Verified auth states and chronological grade-level routing for syllabus constraints.
export interface UserProfile {
    uid: string;
    isAnonymous: boolean; // True until they convert their Ghost State
    email: string | null;
    displayName: string | null;
    gradeLevel: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'Unassigned';
    metrics: GamificationMetrics;
    createdAt: number;
    lastActive: number;
}
