// Purpose: Sprint 26 — Student State Hook (renamed from use-ghost-state.ts).
// Tracks the verified student's mastery progress using their authenticated
// Firebase UID and selected Child Profile. No longer relies on anonymous
// Ghost State — all users are verified from Day 1.

"use client";

import { useState, useCallback } from "react";

// Purpose: Shape of the student state tracked by this hook.
export interface StudentState {
    /** Purpose: Number of questions the student has successfully mastered. */
    questionsMastered: number;
    /** Purpose: Total XP accumulated in the current session. */
    sessionXp: number;
    /** Purpose: The active child profile UID (from the profiles page). */
    activeProfileUid: string | null;
    /** Purpose: The active child's grade level. */
    activeGradeLevel: string | null;
}

// Purpose: Return type of the useStudentState hook.
export interface UseStudentStateReturn {
    state: StudentState;
    /** Purpose: Increment the mastered questions counter and add XP. */
    incrementMastery: (xpEarned?: number) => void;
    /** Purpose: Set the active child profile (from Netflix profiles page). */
    setActiveProfile: (uid: string, gradeLevel: string) => void;
}

// Purpose: Main hook — manages verified student mastery tracking.
// Replaces the Ghost State conversion lifecycle with a simpler,
// profile-aware mastery counter.
export function useStudentState(): UseStudentStateReturn {
    const [state, setState] = useState<StudentState>({
        questionsMastered: 0,
        sessionXp: 0,
        activeProfileUid: null,
        activeGradeLevel: null,
    });

    // Purpose: Increment mastery counter and accumulate session XP.
    const incrementMastery = useCallback((xpEarned: number = 100) => {
        setState((prev) => ({
            ...prev,
            questionsMastered: prev.questionsMastered + 1,
            sessionXp: prev.sessionXp + xpEarned,
        }));
    }, []);

    // Purpose: Set the active child profile — called when a profile
    // is selected on the Netflix-style profiles page.
    const setActiveProfile = useCallback((uid: string, gradeLevel: string) => {
        setState((prev) => ({
            ...prev,
            activeProfileUid: uid,
            activeGradeLevel: gradeLevel,
        }));
    }, []);

    return { state, incrementMastery, setActiveProfile };
}
