// Purpose: RAG Query Wrappers — metadata-filtered vector DB search layer.
// Enforces strict grade-level and subject filtering to prevent cross-grade
// content leakage. Implements "Highest Grade Floor" for spiral curriculum
// topics and "Zero-Shot Bypass" for P1-P3 students.

import type { RAGQueryParams, RAGQueryResponse, RAGResult } from './rag-types';

// Purpose: Grade levels that bypass RAG entirely and route to Zero-Shot
// Generation Mode. These young students benefit from generated content
// rather than retrieved document chunks.
const ZERO_SHOT_GRADES = ['P1', 'P2', 'P3'];

// Purpose: Numeric mapping for grade comparison — used by the "Highest
// Grade Floor" logic to clamp spiral curriculum results.
const GRADE_RANK: Record<string, number> = {
    P1: 1, P2: 2, P3: 3, P4: 4, P5: 5, P6: 6,
};

// Purpose: Topics that appear across multiple grade levels in the MOE
// spiral curriculum. When querying, results are clamped to the student's
// grade or lower to avoid exposing higher-level treatments of the same topic.
const SPIRAL_TOPICS = [
    'percentage', 'ratio', 'fractions', 'decimals',
    'area', 'perimeter', 'volume', 'mass',
    'forces', 'energy', 'water cycle',
];

// Purpose: Main entry point — routes to Zero-Shot or RAG mode based on
// the student's grade level. For RAG mode, applies metadata filters and
// the Highest Grade Floor constraint.
export async function queryRAG(params: RAGQueryParams): Promise<RAGQueryResponse> {
    // Purpose: P1-P3 bypass — skip RAG entirely and signal Zero-Shot mode.
    if (ZERO_SHOT_GRADES.includes(params.gradeLevel)) {
        return {
            mode: 'zero-shot',
            reason: `Grade ${params.gradeLevel} is below the RAG threshold. Routing to Zero-Shot Generation Mode.`,
        };
    }

    // Purpose: Build the metadata filter payload for the vector DB query.
    const metadataFilter = buildMetadataFilter(params);

    // Purpose: Execute the vector DB search with metadata filtering.
    // NOTE: In production, this calls Firestore Vector Search or Pinecone.
    // Currently returns a structured placeholder to satisfy the type contract.
    const rawResults = await executeVectorSearch(metadataFilter, params.topK ?? 5);

    // Purpose: Apply "Highest Grade Floor" post-filter for spiral curriculum topics.
    const filteredResults = applyGradeFloor(rawResults, params.gradeLevel);

    return { mode: 'rag', results: filteredResults };
}

// Purpose: Construct the metadata filter object sent to the vector DB.
// Strictly requires both level and subject to prevent cross-grade leakage.
// Sprint 12: Also includes questionId when provided for granular retrieval.
function buildMetadataFilter(params: RAGQueryParams): Record<string, string> {
    const filter: Record<string, string> = {
        level: params.gradeLevel,
        subject: params.subject,
    };

    // Purpose: If a specific topic is provided, narrow the search further.
    if (params.topic) {
        filter['topic'] = params.topic;
    }

    // Purpose: Sprint 12 — granular question-level filter.
    if (params.questionId) {
        filter['questionId'] = params.questionId;
    }

    return filter;
}

// Purpose: Apply the "Highest Grade Floor" constraint — for spiral curriculum
// topics (e.g., Percentage appears in P5 and P6), clamp results to the
// student's grade or lower. Prevents a P5 student seeing P6-level analysis.
function applyGradeFloor(results: RAGResult[], studentGrade: string): RAGResult[] {
    const studentRank = GRADE_RANK[studentGrade] ?? 6;

    return results.filter((result) => {
        const resultRank = GRADE_RANK[result.metadata.level] ?? 6;

        // Purpose: For spiral curriculum topics, enforce the grade ceiling.
        if (SPIRAL_TOPICS.includes(result.metadata.topic.toLowerCase())) {
            return resultRank <= studentRank;
        }

        // Purpose: Non-spiral topics pass through — they're grade-specific by definition.
        return true;
    });
}

// Purpose: Placeholder for the actual vector DB search call.
// In production, this integrates with Firestore Vector Search, Pinecone,
// or another vector database. Returns empty results for now.
async function executeVectorSearch(
    _metadataFilter: Record<string, string>,
    _topK: number
): Promise<RAGResult[]> {
    // Purpose: Stub — returns empty array until vector DB is provisioned.
    // The type contract is honoured so downstream consumers compile correctly.
    return [];
}

// Purpose: Sprint 12 — Granular per-question chunk retrieval.
// Fetches ONLY the 50-token chunk associated with a specific questionId.
// This prevents the full PDF from entering the LLM's context window.
// The function enforces that a questionId is provided — callers without
// a questionId should use the main queryRAG function instead.
export async function queryQuestionChunk(
    params: RAGQueryParams & { questionId: string }
): Promise<RAGQueryResponse> {
    // Purpose: Validate that questionId is present and non-empty.
    if (!params.questionId || params.questionId.trim().length === 0) {
        return {
            mode: 'zero-shot',
            reason: 'queryQuestionChunk requires a valid questionId. Full-document RAG is blocked in granular mode.',
        };
    }

    // Purpose: Build metadata filter with the mandatory questionId.
    const metadataFilter = buildMetadataFilter(params);

    // Purpose: Fetch exactly 1 result — the 50-token chunk for this question.
    // topK is capped at 1 to enforce context window protection.
    const rawResults = await executeVectorSearch(metadataFilter, 1);

    // Purpose: Apply grade floor even for single-question retrieval to
    // maintain consistency with the main RAG pipeline.
    const filteredResults = applyGradeFloor(rawResults, params.gradeLevel);

    // Purpose: If no results found, signal that the question chunk is missing.
    if (filteredResults.length === 0) {
        return {
            mode: 'zero-shot',
            reason: `No indexed chunk found for questionId "${params.questionId}". The student should describe the question in text.`,
        };
    }

    return { mode: 'rag', results: filteredResults };
}

