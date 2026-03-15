// Purpose: Types for the Vision Bouncer pre-flight pipeline.
// Defines rejection reason codes and the result shape returned
// after evaluating an uploaded image for educational validity.

// Purpose: Enumerated reason codes for image rejection.
// Each code maps to a specific user-facing message and Firestore status update.
// BLURRY_DIAGRAM added in Sprint 6 for the Vision Confidence Check.
export type BouncerReasonCode =
    | 'FACE_DETECTED'
    | 'NON_EDUCATIONAL'
    | 'CHINESE_TEXT'
    | 'BLURRY_DIAGRAM';

// Purpose: Result returned by the Vision Bouncer after evaluating an image.
// If `passed` is false, `reasonCode` and `message` are populated.
export interface BouncerResult {
    passed: boolean;
    reasonCode: BouncerReasonCode | null;
    message: string | null;
}

// Purpose: Shape of a rejected upload stored in Firestore for dashboard rendering.
// Includes the bouncer's reason code, user-facing message, and blurred thumbnail.
export interface RejectedUpload {
    docId: string;
    fileName: string;
    thumbnailUrl: string;
    reasonCode: BouncerReasonCode;
    message: string;
    rejectedAt: number;
}

// Purpose: Shape of a question queue item in Firestore (covers all statuses).
export type QueueItemStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface QueueItem {
    docId: string;
    fileName: string;
    storagePath: string;
    thumbnailUrl: string;
    status: QueueItemStatus;
    reasonCode?: BouncerReasonCode;
    message?: string;
    uploadedAt: number;
}
