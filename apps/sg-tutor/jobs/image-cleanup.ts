// Purpose: Image TTL Worker — background job triggered by the `question.mastered`
// event. Deletes the physical image file from Firebase Storage while retaining
// the extracted text and OCR data in the Firestore document. This reduces storage
// costs and enforces data minimization (no raw PII images kept after mastery).

// Purpose: Type definition for the question.mastered event payload.
interface QuestionMasteredEvent {
    /** Purpose: The user's Firebase UID. */
    uid: string;
    /** Purpose: The question queue document ID. */
    docId: string;
    /** Purpose: The Firebase Storage path of the original uploaded image. */
    storagePath: string;
}

// Purpose: Type definition for the cleanup result — returned to the job runner
// for logging and retry decisions.
interface CleanupResult {
    success: boolean;
    deletedPath: string | null;
    error: string | null;
    retainedFields: string[];
}

// Purpose: Main worker function — processes a single question.mastered event.
// Deletes the image from Firebase Storage and updates the Firestore document
// to remove the storage reference while preserving OCR text and metadata.
//
// NOTE: This function is designed to be called by a job runner (Trigger.dev,
// Inngest, or Cloud Functions). The Firebase Admin SDK initialization and
// event listener wiring is handled by the runner's entry point.
export async function handleQuestionMastered(
    event: QuestionMasteredEvent
): Promise<CleanupResult> {
    // Purpose: Validate the event payload before proceeding.
    if (!event.uid || !event.docId || !event.storagePath) {
        return {
            success: false,
            deletedPath: null,
            error: 'Invalid event payload: missing uid, docId, or storagePath.',
            retainedFields: [],
        };
    }

    try {
        // Purpose: Dynamic import — the admin SDK is only available server-side.
        // This pattern allows the type contract to compile in the main Next.js build.
        const { getStorage } = await import('firebase-admin/storage');
        const { getFirestore } = await import('firebase-admin/firestore');

        const storage = getStorage();
        const db = getFirestore();

        // Purpose: Step 1 — Delete the physical image from Firebase Storage.
        const bucket = storage.bucket();
        const file = bucket.file(event.storagePath);

        // Purpose: Check if the file exists before attempting deletion.
        const [exists] = await file.exists();
        if (exists) {
            await file.delete();
        }

        // Purpose: Step 2 — Update the Firestore document to mark image as cleaned.
        // Retain the OCR text.  Remove storagePath and thumbnailUrl references.
        const docRef = db
            .collection('users')
            .doc(event.uid)
            .collection('questionQueue')
            .doc(event.docId);

        // Purpose: Use FieldValue.delete() to remove the storage-specific fields.
        const { FieldValue } = await import('firebase-admin/firestore');
        await docRef.update({
            storagePath: FieldValue.delete(),
            thumbnailUrl: FieldValue.delete(),
            imageCleaned: true,
            imageCleanedAt: Date.now(),
        });

        return {
            success: true,
            deletedPath: event.storagePath,
            error: null,
            retainedFields: ['extractedText', 'ocrData', 'status', 'subject', 'topic'],
        };
    } catch (error) {
        // Purpose: Catch-all — log the error and return a failure result.
        // The job runner can use this to decide whether to retry.
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown error during cleanup.';

        return {
            success: false,
            deletedPath: null,
            error: errorMessage,
            retainedFields: [],
        };
    }
}

// Purpose: Event name constant — used by the job runner to wire up the listener.
export const IMAGE_CLEANUP_EVENT = 'question.mastered' as const;
