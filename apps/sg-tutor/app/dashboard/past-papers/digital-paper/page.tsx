// Purpose: Digital Paper — Interactive quiz with MCQ + Short Answer questions
// and a mock grading engine that scores answers after submission.
// Sprint 53: Stateful quiz execution environment (idle → in-progress → graded).

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Award, ChevronRight } from "lucide-react";

const ArrowLeftIcon = ArrowLeft as any;
const CheckCircle2Icon = CheckCircle2 as any;
const XCircleIcon = XCircle as any;
const ClockIcon = Clock as any;
const AwardIcon = Award as any;
const ChevronRightIcon = ChevronRight as any;

// Purpose: Quiz state machine type.
type QuizState = "idle" | "in-progress" | "graded";

// Purpose: Question types supported by the grading engine.
interface MCQQuestion {
    id: string;
    type: "mcq";
    question: string;
    options: string[];
    correctAnswer: number; // index into options
    topic: string;
}

interface ShortAnswerQuestion {
    id: string;
    type: "short-answer";
    question: string;
    correctAnswer: string;
    acceptableAnswers: string[]; // case-insensitive alternatives
    topic: string;
}

type QuizQuestion = MCQQuestion | ShortAnswerQuestion;

// Purpose: Mock quiz data — P6 Math mini-assessment (3 MCQ + 2 Short Answer).
const QUIZ_DATA: {
    title: string;
    subject: string;
    timeLimit: string;
    questions: QuizQuestion[];
} = {
    title: "P6 Mathematics — Mini Assessment",
    subject: "Mathematics",
    timeLimit: "15 minutes",
    questions: [
        {
            id: "q1",
            type: "mcq",
            question: "A shirt originally costs $80. It is sold at a 25% discount. What is the selling price?",
            options: ["$55", "$60", "$65", "$20"],
            correctAnswer: 1,
            topic: "Percentage",
        },
        {
            id: "q2",
            type: "mcq",
            question: "The ratio of boys to girls in a class is 3 : 5. If there are 24 boys, how many girls are there?",
            options: ["30", "35", "40", "45"],
            correctAnswer: 2,
            topic: "Ratio",
        },
        {
            id: "q3",
            type: "mcq",
            question: "A car travels at 60 km/h for 2.5 hours. What is the total distance travelled?",
            options: ["120 km", "140 km", "150 km", "160 km"],
            correctAnswer: 2,
            topic: "Speed",
        },
        {
            id: "q4",
            type: "short-answer",
            question: "Simplify the expression: 3x + 7 − x + 2",
            correctAnswer: "2x + 9",
            acceptableAnswers: ["2x + 9", "2x+9", "9 + 2x", "9+2x"],
            topic: "Algebra",
        },
        {
            id: "q5",
            type: "short-answer",
            question: "What is ¾ of 120?",
            correctAnswer: "90",
            acceptableAnswers: ["90"],
            topic: "Fractions",
        },
    ],
};

export default function DigitalPaperPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    // Purpose: Sprint 120 — Read paperId from URL for ghost score tracking.
    const paperId = searchParams.get("paperId") || "unknown";
    const [quizState, setQuizState] = useState<QuizState>("idle");
    // Purpose: Track selected MCQ answers (question id → option index).
    const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
    // Purpose: Track typed short-answer responses (question id → text).
    const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
    // Purpose: Grading results (question id → correct boolean).
    const [results, setResults] = useState<Record<string, boolean>>({});
    const [score, setScore] = useState(0);

    const totalQuestions = QUIZ_DATA.questions.length;

    // Purpose: Start the quiz — transition from idle to in-progress.
    const handleStart = () => {
        setQuizState("in-progress");
        setMcqAnswers({});
        setShortAnswers({});
        setResults({});
        setScore(0);
    };

    // Purpose: Handle MCQ option selection.
    const handleMcqSelect = (questionId: string, optionIndex: number) => {
        setMcqAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    };

    // Purpose: Handle short-answer text input.
    const handleShortAnswerChange = (questionId: string, value: string) => {
        setShortAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    // Purpose: Sprint 120 — Grade the quiz and save high score to localStorage for 'Beat Your Ghost'.
    const handleSubmit = () => {
        const gradeResults: Record<string, boolean> = {};
        let correctCount = 0;

        for (const question of QUIZ_DATA.questions) {
            if (question.type === "mcq") {
                const selected = mcqAnswers[question.id];
                const isCorrect = selected === question.correctAnswer;
                gradeResults[question.id] = isCorrect;
                if (isCorrect) correctCount++;
            } else {
                const answer = (shortAnswers[question.id] || "").trim().toLowerCase();
                const isCorrect = question.acceptableAnswers.some(
                    (a) => a.toLowerCase() === answer
                );
                gradeResults[question.id] = isCorrect;
                if (isCorrect) correctCount++;
            }
        }

        // Purpose: Sprint 120 — Persist high score to localStorage.
        const existingRecord = parseInt(localStorage.getItem(`ghost_${paperId}`) || "0", 10);
        if (correctCount > existingRecord) {
            localStorage.setItem(`ghost_${paperId}`, correctCount.toString());
        }

        setResults(gradeResults);
        setScore(correctCount);
        setQuizState("graded");
    };

    // Purpose: Check if all questions have been answered.
    const allAnswered = QUIZ_DATA.questions.every((q) => {
        if (q.type === "mcq") return mcqAnswers[q.id] !== undefined;
        return (shortAnswers[q.id] || "").trim().length > 0;
    });

    const percentage = Math.round((score / totalQuestions) * 100);

    return (
        <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 overflow-y-auto">
            {/* Purpose: Header with back navigation. */}
            <header className="px-8 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/dashboard/past-papers")}
                        className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                        <ArrowLeftIcon size={16} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">{QUIZ_DATA.title}</h1>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <ClockIcon size={11} /> {QUIZ_DATA.timeLimit}
                            </span>
                            <span className="text-xs text-slate-500">
                                {totalQuestions} questions
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Purpose: Idle state — pre-quiz landing screen. */}
            {quizState === "idle" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-5xl mb-6 shadow-xl shadow-emerald-200">
                        ✍️
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{QUIZ_DATA.title}</h2>
                    <p className="text-sm text-slate-500 max-w-md mb-2">
                        This assessment contains {totalQuestions} questions — {QUIZ_DATA.questions.filter((q) => q.type === "mcq").length} multiple choice and {QUIZ_DATA.questions.filter((q) => q.type === "short-answer").length} short answer.
                    </p>
                    <p className="text-xs text-slate-400 mb-8">Time limit: {QUIZ_DATA.timeLimit}</p>
                    <button
                        onClick={handleStart}
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-lg font-bold shadow-xl shadow-emerald-200 hover:shadow-2xl hover:scale-[1.03] transition-all duration-200 cursor-pointer"
                    >
                        Begin Assessment
                        <ChevronRightIcon size={20} />
                    </button>
                </div>
            )}

            {/* Purpose: In-progress state — interactive quiz questions. */}
            {quizState === "in-progress" && (
                <div className="flex-1 px-8 py-6 space-y-6">
                    {QUIZ_DATA.questions.map((question, idx) => (
                        <div key={question.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-start gap-3 mb-4">
                                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-xs font-bold text-slate-600 shrink-0">
                                    {idx + 1}
                                </span>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900 leading-relaxed">{question.question}</p>
                                    <span className="inline-block mt-1 text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                                        {question.topic}
                                    </span>
                                </div>
                            </div>

                            {question.type === "mcq" ? (
                                <div className="space-y-2 ml-10">
                                    {question.options.map((option, optIdx) => {
                                        const isSelected = mcqAnswers[question.id] === optIdx;
                                        return (
                                            <button
                                                key={optIdx}
                                                onClick={() => handleMcqSelect(question.id, optIdx)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all duration-150 cursor-pointer ${isSelected
                                                    ? "border-violet-400 bg-violet-50 text-violet-900 font-medium shadow-sm"
                                                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-violet-500 bg-violet-500" : "border-slate-300"
                                                    }`}>
                                                    {isSelected && (
                                                        <span className="w-2 h-2 rounded-full bg-white" />
                                                    )}
                                                </span>
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="ml-10">
                                    <input
                                        type="text"
                                        value={shortAnswers[question.id] || ""}
                                        onChange={(e) => handleShortAnswerChange(question.id, e.target.value)}
                                        placeholder="Type your answer..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Purpose: Submit button — enabled only when all questions answered. */}
                    <div className="pb-8">
                        <button
                            onClick={handleSubmit}
                            disabled={!allAnswered}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-xl shadow-emerald-200 hover:shadow-2xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <CheckCircle2Icon size={18} />
                            Submit Assessment
                        </button>
                    </div>
                </div>
            )}

            {/* Purpose: Graded state — shows results with correct/incorrect badges. */}
            {quizState === "graded" && (
                <div className="flex-1 px-8 py-6 space-y-6">
                    {/* Purpose: Score summary card. */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
                        <div className={`w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg ${percentage >= 80
                            ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-200"
                            : percentage >= 50
                                ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200"
                                : "bg-gradient-to-br from-red-400 to-rose-500 shadow-red-200"
                            }`}>
                            <AwardIcon size={36} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">
                            {score} / {totalQuestions}
                        </h2>
                        <p className={`text-lg font-bold ${percentage >= 80 ? "text-emerald-600" : percentage >= 50 ? "text-amber-600" : "text-red-600"
                            }`}>
                            {percentage}%
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                            {percentage >= 80 ? "Excellent work! 🎉" : percentage >= 50 ? "Good effort! Keep practicing 💪" : "Don't worry, review the topics and try again 📚"}
                        </p>
                    </div>

                    {/* Purpose: Per-question results breakdown. */}
                    {QUIZ_DATA.questions.map((question, idx) => {
                        const isCorrect = results[question.id];
                        return (
                            <div
                                key={question.id}
                                className={`bg-white rounded-2xl border p-6 shadow-sm ${isCorrect ? "border-emerald-200" : "border-red-200"
                                    }`}
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <span className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${isCorrect ? "bg-emerald-100" : "bg-red-100"
                                        }`}>
                                        {isCorrect
                                            ? <CheckCircle2Icon size={16} className="text-emerald-600" />
                                            : <XCircleIcon size={16} className="text-red-600" />
                                        }
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900 leading-relaxed">
                                            Q{idx + 1}. {question.question}
                                        </p>
                                        <span className="inline-block mt-1 text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                                            {question.topic}
                                        </span>
                                    </div>
                                </div>

                                <div className="ml-10 space-y-1">
                                    {question.type === "mcq" ? (
                                        <>
                                            <p className="text-xs text-slate-500">
                                                Your answer: <span className={`font-semibold ${isCorrect ? "text-emerald-600" : "text-red-600"}`}>
                                                    {question.options[mcqAnswers[question.id]] || "—"}
                                                </span>
                                            </p>
                                            {!isCorrect && (
                                                <p className="text-xs text-emerald-600">
                                                    Correct answer: <span className="font-semibold">{question.options[question.correctAnswer]}</span>
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-xs text-slate-500">
                                                Your answer: <span className={`font-semibold ${isCorrect ? "text-emerald-600" : "text-red-600"}`}>
                                                    {shortAnswers[question.id] || "—"}
                                                </span>
                                            </p>
                                            {!isCorrect && (
                                                <p className="text-xs text-emerald-600">
                                                    Correct answer: <span className="font-semibold">{question.correctAnswer}</span>
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Purpose: Retry + back buttons. */}
                    <div className="flex gap-4 pb-8">
                        <button
                            onClick={handleStart}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-violet-200 hover:shadow-xl transition-all duration-200 cursor-pointer"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => router.push("/dashboard/past-papers")}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-all duration-200 cursor-pointer"
                        >
                            Back to Past Papers
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
