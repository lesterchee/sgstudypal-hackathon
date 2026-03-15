// Purpose: Sprint 132 — Strict Type definitions for the interactive AI Mock Exams to ensure flawless UI rendering.
export interface Option {
    id: string;
    text: string;
}

export interface Question {
    id: string;
    topic: string;
    marks: number;
    question: string;
    options?: Option[]; // Optional: allows for open-ended questions later
    correctAnswer: string;
    explanation: string; // The pedagogical ELI5 breakdown
}

export interface MockExam {
    id: string; // Matches the ID from the PAST_PAPERS array (e.g., "pp-math-ai-p6")
    title: string;
    subject: string;
    level: string;
    questions: Question[];
}

// Purpose: Master payload array of V1.0 interactive exams.
export const MOCK_EXAMS: MockExam[] = [];
