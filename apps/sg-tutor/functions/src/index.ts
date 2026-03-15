// Purpose: Scheduled Firebase Cloud Function — Chronological Grade Promotion.
// Executes on January 1st each year via Cloud Scheduler cron.
// Flags all user documents with `needsGradePromotion: true` so the
// frontend can intercept on next login and render a grade promotion modal.

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Purpose: Initialize Firebase Admin SDK singleton.
if (getApps().length === 0) {
    initializeApp();
}

const db = getFirestore();

// Purpose: Cron schedule — runs at midnight on January 1st (UTC).
// Format: minute hour dayOfMonth month dayOfWeek
export const annualGradePromotion = onSchedule(
    {
        schedule: '0 0 1 1 *',
        timeZone: 'Asia/Singapore',
        retryCount: 3,
    },
    async () => {
        // Purpose: Query all user documents in the 'users' collection.
        const usersSnapshot = await db.collection('users').get();

        // Purpose: Batch write to flag all users for grade promotion.
        // Uses Firestore batch writes for atomicity (max 500 per batch).
        const BATCH_LIMIT = 500;
        let batch = db.batch();
        let operationCount = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();

            // Purpose: Skip users who are already at P6 (cannot promote further)
            // or who have an 'Unassigned' grade level.
            if (userData.gradeLevel === 'P6' || userData.gradeLevel === 'Unassigned') {
                continue;
            }

            // Purpose: Flag the user for frontend-side grade promotion confirmation.
            batch.update(userDoc.ref, {
                needsGradePromotion: true,
                promotionFlaggedAt: Date.now(),
            });

            operationCount++;

            // Purpose: Commit batch and start a new one at the 500-document limit.
            if (operationCount >= BATCH_LIMIT) {
                await batch.commit();
                batch = db.batch();
                operationCount = 0;
            }
        }

        // Purpose: Commit any remaining operations in the final batch.
        if (operationCount > 0) {
            await batch.commit();
        }

        console.log(
            `[GradePromotion] Flagged ${usersSnapshot.size} users for grade promotion review.`
        );
    }
);
