// Purpose: PDF Viewer Route — renders a Firebase Storage PDF inside an iframe
// with a clickable question sidebar. When the user selects a specific question
// number, it triggers granular RAG to fetch ONLY that question's 50-token
// chunk from the vector DB, protecting the context window.

"use client";

import { useState, useCallback } from "react";
import { FileText, ChevronRight, BookOpen, Loader2 } from "lucide-react";

const FileTextIcon = FileText as any;
const ChevronRightIcon = ChevronRight as any;
const BookOpenIcon = BookOpen as any;
const Loader2Icon = Loader2 as any;

// Purpose: Props derived from the dynamic route segment [id].
interface PaperViewerProps {
    params: { id: string };
}

// Purpose: Generate question numbers for the sidebar based on a default count.
// In production, this would be fetched from the paper's metadata in Firestore.
const DEFAULT_QUESTION_COUNT = 15;

// Purpose: Main page component — renders the PDF viewer with question sidebar.
export default function PaperViewerPage({ params }: PaperViewerProps) {
    const { id: paperId } = params;

    // Purpose: Track the currently selected question number for granular RAG.
    const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
    // Purpose: Track whether the RAG query is in-flight for loading state.
    const [isLoadingContext, setIsLoadingContext] = useState(false);
    // Purpose: Store the fetched 50-token RAG chunk for the selected question.
    const [ragChunk, setRagChunk] = useState<string | null>(null);

    // Purpose: Construct the PDF URL from Firebase Storage.
    // In production, this would be a signed URL fetched from Firestore.
    const pdfUrl = `https://firebasestorage.googleapis.com/v0/b/sg-tutor.appspot.com/o/papers%2F${paperId}.pdf?alt=media`;

    // Purpose: Handle question selection — triggers granular RAG fetch.
    const handleQuestionSelect = useCallback(
        async (questionNum: number) => {
            setSelectedQuestion(questionNum);
            setIsLoadingContext(true);
            setRagChunk(null);

            try {
                // Purpose: In production, this calls queryQuestionChunk() from rag-query.ts.
                // Simulated here with a delay to demonstrate the loading state.
                await new Promise((resolve) => setTimeout(resolve, 800));

                // Purpose: Stub — simulated 50-token RAG chunk for the selected question.
                setRagChunk(
                    `[Context for Q${questionNum}] This question tests the student's understanding of the concept. Refer to the MOE syllabus for the expected approach.`
                );
            } finally {
                setIsLoadingContext(false);
            }
        },
        []
    );

    // Purpose: Generate the question number array for the sidebar.
    const questions = Array.from(
        { length: DEFAULT_QUESTION_COUNT },
        (_, i) => i + 1
    );

    return (
        <div className="flex h-full bg-slate-50">
            {/* Purpose: Question sidebar — clickable question numbers for granular RAG. */}
            <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col">
                <div className="px-4 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <BookOpenIcon size={16} className="text-violet-500" />
                        <h2 className="text-sm font-bold text-slate-800">
                            Questions
                        </h2>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                        Click a question to load its context
                    </p>
                </div>

                <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
                    {questions.map((num) => (
                        <button
                            key={num}
                            onClick={() => handleQuestionSelect(num)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${selectedQuestion === num
                                    ? 'bg-violet-50 text-violet-700 border border-violet-200'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <FileTextIcon size={14} />
                                Question {num}
                            </span>
                            {selectedQuestion === num && (
                                <ChevronRightIcon size={14} className="text-violet-400" />
                            )}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Purpose: Main content area — PDF iframe + RAG context panel. */}
            <main className="flex-1 flex flex-col">
                {/* Purpose: PDF iframe — renders the paper from Firebase Storage. */}
                <div className="flex-1 bg-slate-100 p-4">
                    <iframe
                        src={pdfUrl}
                        className="w-full h-full rounded-xl border border-slate-200 bg-white shadow-sm"
                        title={`Paper ${paperId}`}
                    />
                </div>

                {/* Purpose: RAG context panel — shows the 50-token chunk for the selected question.
                    Only visible when a question is selected. */}
                {selectedQuestion !== null && (
                    <div className="border-t border-slate-200 bg-white px-6 py-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-violet-600 uppercase tracking-wide">
                                Q{selectedQuestion} Context
                            </span>
                            {isLoadingContext && (
                                <Loader2Icon
                                    size={12}
                                    className="text-violet-400 animate-spin"
                                />
                            )}
                        </div>

                        {ragChunk ? (
                            <p className="text-sm text-slate-700 leading-relaxed bg-violet-50 rounded-lg px-4 py-3 border border-violet-100">
                                {ragChunk}
                            </p>
                        ) : (
                            !isLoadingContext && (
                                <p className="text-xs text-slate-400 italic">
                                    No context loaded yet.
                                </p>
                            )
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
