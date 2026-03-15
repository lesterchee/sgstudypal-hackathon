// Purpose: Ghost State Hook — tracks the anonymous user's mastery progress
// and triggers conversion events. The counter increments when a session
// successfully concludes (question mastered). At questionsMastered === 1,
// the auth-upgrade modal should fire.

"use client";

import { useState, useCallback } from "react";

// Purpose: Shape of the ghost state tracked by this hook.
export interface GhostState {
    /** Purpose: Number of questions the user has successfully mastered. */
    questionsMastered: number;
    /** Purpose: Whether the auth-upgrade modal should be shown. */
    shouldShowAuthModal: boolean;
    /** Purpose: Whether the user has dismissed the auth-upgrade modal. */
    authModalDismissed: boolean;
    /** Purpose: Whether the user has successfully upgraded to a verified account. */
    isUpgraded: boolean;
}

// Purpose: Return type of the useGhostState hook.
export interface UseGhostStateReturn {
    state: GhostState;
    /** Purpose: Increment the mastered questions counter. Triggers the auth modal
     *  when the counter hits 1 for the first time. */
    incrementMastery: () => void;
    /** Purpose: Dismiss the auth-upgrade modal. Sets a warning flag that data
     *  may be lost if the user clears their cache. */
    dismissAuthModal: () => void;
    /** Purpose: Mark the user as successfully upgraded to a verified account. */
    markUpgraded: () => void;
}

// Purpose: Main hook — manages the ghost-to-verified conversion lifecycle.
// Tracks mastery progress, triggers the auth modal at the "Aha!" moment
// (first question mastered), and handles dismissal edge cases.
export function useGhostState(): UseGhostStateReturn {
    const [state, setState] = useState<GhostState>({
        questionsMastered: 0,
        shouldShowAuthModal: false,
        authModalDismissed: false,
        isUpgraded: false,
    });

    // Purpose: Increment mastery counter. On first mastery (0 → 1),
    // trigger the auth-upgrade modal unless already upgraded or dismissed.
    const incrementMastery = useCallback(() => {
        setState((prev) => {
            const newCount = prev.questionsMastered + 1;
            const shouldShow =
                newCount === 1 && !prev.isUpgraded && !prev.authModalDismissed;

            return {
                ...prev,
                questionsMastered: newCount,
                shouldShowAuthModal: shouldShow,
            };
        });
    }, []);

    // Purpose: Dismiss the auth modal. The user may lose their anonymous data
    // if they clear their cache — this is an accepted risk with a visible warning.
    const dismissAuthModal = useCallback(() => {
        setState((prev) => ({
            ...prev,
            shouldShowAuthModal: false,
            authModalDismissed: true,
        }));
    }, []);

    // Purpose: Mark the user as upgraded — hides the modal permanently and
    // enables verified-only features like the Junior Vault.
    const markUpgraded = useCallback(() => {
        setState((prev) => ({
            ...prev,
            shouldShowAuthModal: false,
            isUpgraded: true,
        }));
    }, []);

    return { state, incrementMastery, dismissAuthModal, markUpgraded };
}
