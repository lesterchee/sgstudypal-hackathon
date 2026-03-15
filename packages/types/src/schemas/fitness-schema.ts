// Purpose: Defines the centralized Type definitions and Document schemas used across the system, ensuring strict TypeScript validation for entities and Ghost Data encryption envelopes.
export interface EncryptedPayload {
    iv: string;
    authTag: string;
    ciphertext: string;
    version: number;
    expiresAt: string;
    userId: string;
}

export type WorkflowState = 'IDLE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface Trainer {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface Client {
    id: string;
    trainerId: string;
    name: string;
    email: string;
    joinedAt: string;
}

export interface SessionPackage {
    id: string;
    clientId: string;
    trainerId: string;
    totalSessions: number;
    remainingSessions: number;
    purchasedAt: string;
}

export interface FitnessLog {
    id: string;
    clientId: string;
    trainerId: string;
    date: string;
    logData: EncryptedPayload;
    state: WorkflowState;
}
