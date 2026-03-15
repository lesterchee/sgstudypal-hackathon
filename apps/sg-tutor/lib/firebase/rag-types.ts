// Purpose: Type definitions for the RAG (Retrieval-Augmented Generation)
// metadata routing layer. Defines query parameters and result shapes
// consumed by the AI Tutor pipeline.

// Purpose: Sprint 16 — GradeLevel consolidated into lib/types.ts.
import type { GradeLevel } from '@/lib/types';

// Purpose: Parameters passed to the RAG query layer. The vector DB
// MUST filter results using these metadata fields to prevent
// cross-grade content leakage.
// Sprint 12: Added questionId for granular per-question chunk retrieval.
export interface RAGQueryParams {
    gradeLevel: GradeLevel;
    subject: string;
    topic?: string;
    /** Purpose: Maximum number of results to return from the vector DB. */
    topK?: number;
    /** Purpose: Sprint 12 — specific question identifier for granular RAG.
     *  When provided, fetches ONLY the 50-token chunk for this question,
     *  blocking the full PDF from entering the LLM context window. */
    questionId?: string;
}

// Purpose: A single result from the RAG vector DB search.
// Includes the source document metadata and relevance score.
export interface RAGResult {
    /** Purpose: Unique identifier of the source document chunk. */
    chunkId: string;
    /** Purpose: The retrieved text content from the vector DB. */
    content: string;
    /** Purpose: Metadata attached to the vector — used for filtering. */
    metadata: {
        level: GradeLevel;
        subject: string;
        topic: string;
        source: string;
    };
    /** Purpose: Cosine similarity score from the vector search (0–1). */
    score: number;
}

// Purpose: Signal returned when RAG is bypassed for P1-P3 students.
// The AI pipeline should fall back to Zero-Shot Generation Mode.
export interface ZeroShotSignal {
    mode: 'zero-shot';
    reason: string;
}

// Purpose: Union type for the RAG query response — either real results
// or a zero-shot bypass signal for lower-primary grades.
export type RAGQueryResponse =
    | { mode: 'rag'; results: RAGResult[] }
    | ZeroShotSignal;
