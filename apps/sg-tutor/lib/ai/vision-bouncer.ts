// Purpose: Vision Bouncer — lightweight pre-flight image validation pipeline.
// Runs BEFORE the main LLM to reject non-educational, privacy-violating,
// Chinese-text, or blurry/low-confidence images. Updates Firestore status
// to 'rejected' with a reason code.

import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { BouncerResult, BouncerReasonCode } from './vision-bouncer-types';

// Purpose: Lazy-initialize Firestore for the bouncer's status updates.
const db = getFirestore(app);

// Purpose: Rejection message map — maps each reason code to a user-friendly
// explanation displayed in the "Rejected Uploads" section of the dashboard.
const REJECTION_MESSAGES: Record<BouncerReasonCode, string> = {
    FACE_DETECTED:
        '🔒 We detected a face in your upload. For privacy, please crop or retake the photo without any faces.',
    NON_EDUCATIONAL:
        "📚 This doesn't look like a homework question. Please upload a photo of your worksheet or textbook.",
    CHINESE_TEXT:
        '✏️ For Chinese questions, please type them directly into the chat instead of uploading a photo.',
    // Purpose: Sprint 6 — Vision Confidence Check for blurry/unreadable images.
    BLURRY_DIAGRAM:
        '📸 Whoops! The camera might have moved. The text is a bit too blurry for me to read clearly. Could you ask your parent to snap a closer, brighter photo of just the diagram?',
};

// Purpose: Heuristic keyword lists for lightweight classification.
// In production, these would be replaced with a vision model API call.

// Purpose: Detect primarily Chinese characters using Unicode range analysis.
function containsPrimarilyChinese(extractedText: string): boolean {
    if (!extractedText) return false;
    const chineseChars = extractedText.match(/[\u4e00-\u9fff]/g) || [];
    const totalChars = extractedText.replace(/\s/g, '').length;
    // Purpose: If more than 60% of characters are Chinese, flag it.
    return totalChars > 0 && chineseChars.length / totalChars > 0.6;
}

// Purpose: Main bouncer entry point. Evaluates an image against rejection
// triggers and updates Firestore if rejected. Returns a BouncerResult
// indicating whether the image passed or was rejected.
//
// NOTE: In the current implementation, vision analysis is simulated via
// metadata flags. In production, this calls a lightweight vision model
// (e.g., Gemini Flash) for actual face detection and content classification.
export async function runVisionBouncer(
    analysisResult: {
        containsFace: boolean;
        isEducational: boolean;
        extractedText: string;
        // Purpose: Sprint 6 — vision confidence score (0–1) from the lightweight
        // vision model. A score below 0.5 triggers the BLURRY_DIAGRAM rejection.
        visionConfidence?: number;
    },
    docRef: { uid: string; docId: string }
): Promise<BouncerResult> {
    // Purpose: Priority-ordered rejection checks. First match wins.

    // Purpose: Check 1 — Face detected (privacy protection).
    if (analysisResult.containsFace) {
        return await rejectUpload('FACE_DETECTED', docRef);
    }

    // Purpose: Check 2 — Non-educational / troll image.
    if (!analysisResult.isEducational) {
        return await rejectUpload('NON_EDUCATIONAL', docRef);
    }

    // Purpose: Check 3 (Sprint 6) — Vision Confidence Check for blurry/unreadable images.
    // If the vision model reports low confidence, reject with a friendly re-upload message.
    if (
        analysisResult.visionConfidence !== undefined &&
        analysisResult.visionConfidence < 0.5
    ) {
        return await rejectUpload('BLURRY_DIAGRAM', docRef);
    }

    // Purpose: Check 4 — Primarily Chinese characters detected.
    if (containsPrimarilyChinese(analysisResult.extractedText)) {
        return await rejectUpload('CHINESE_TEXT', docRef);
    }

    // Purpose: All checks passed — image is cleared for the main LLM pipeline.
    return { passed: true, reasonCode: null, message: null };
}

// Purpose: Helper — update Firestore doc to 'rejected' status and return
// a BouncerResult with the appropriate reason code and message.
async function rejectUpload(
    reasonCode: BouncerReasonCode,
    docRef: { uid: string; docId: string }
): Promise<BouncerResult> {
    const message = REJECTION_MESSAGES[reasonCode];

    // Purpose: Mutate the Firestore queue item to rejected status.
    const firestoreRef = doc(
        db,
        `users/${docRef.uid}/questionQueue/${docRef.docId}`
    );
    await updateDoc(firestoreRef, {
        status: 'rejected',
        reasonCode,
        message,
        rejectedAt: Date.now(),
    });

    return { passed: false, reasonCode, message };
}
