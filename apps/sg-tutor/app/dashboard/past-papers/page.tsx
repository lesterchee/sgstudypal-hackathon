// Purpose: Past Year Exam Papers — 3-pane layout with collapsible sidebar.
// Sprint 116.2: Production-ready scaffold with 6 sample PDFs, iframe viewer,
// Chinese tab and AI Mock Exam removed.

"use client";

import { useState } from "react";
import {
    FileText, Download,
    Calculator, FlaskConical, BookOpen, PanelLeft
} from "lucide-react";

const FileTextIcon = FileText as any;
const DownloadIcon = Download as any;
const CalculatorIcon = Calculator as any;
const FlaskConicalIcon = FlaskConical as any;
const BookOpenIcon = BookOpen as any;
const PanelLeftIcon = PanelLeft as any;

// Purpose: Subject filter configuration — Chinese removed to prevent Gemini hallucination.
type AssessmentSubject = "Math" | "Science" | "English";

const SUBJECT_TABS: { key: AssessmentSubject; label: string; icon: any; activeColor: string }[] = [
    { key: "Math", label: "Mathematics", icon: CalculatorIcon, activeColor: "bg-blue-100 text-blue-700 border-blue-200" },
    { key: "Science", label: "Science", icon: FlaskConicalIcon, activeColor: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { key: "English", label: "English", icon: BookOpenIcon, activeColor: "bg-amber-100 text-amber-700 border-amber-200" },
];

// Purpose: Sprint 116.2 — Production-ready data map pointing to local sample PDFs.
// To be migrated to GCS in the future. File names use -sample.pdf convention
// to match the .gitignore allowlist rule.
interface ScrapedPaper {
    id: string;
    title: string;
    school: string;
    year: number;
    term: string;
    subject: AssessmentSubject;
    size: string;
    url: string;
}

// Purpose: Authentic UI data map matching the real PDFs for the demo.
const SCRAPED_PAPERS: ScrapedPaper[] = [
    // Math
    { id: "m1", title: "ACS Junior Prelim 2025", school: "ACS Junior", year: 2025, term: "Prelim", subject: "Math", size: "3.1 MB", url: "/past-papers/2025/p6/math/acs-junior-prelim-sample.pdf" },
    { id: "m2", title: "Ai Tong Prelim 2025", school: "Ai Tong School", year: 2025, term: "Prelim", subject: "Math", size: "2.8 MB", url: "/past-papers/2025/p6/math/ai-tong-prelim-sample.pdf" },
    // Science
    { id: "s1", title: "ACS Junior Prelim 2025", school: "ACS Junior", year: 2025, term: "Prelim", subject: "Science", size: "4.2 MB", url: "/past-papers/2025/p6/science/acs-junior-prelim-sample.pdf" },
    { id: "s2", title: "Ai Tong Prelim 2025", school: "Ai Tong School", year: 2025, term: "Prelim", subject: "Science", size: "3.9 MB", url: "/past-papers/2025/p6/science/ai-tong-prelim-sample.pdf" },
    // English
    { id: "e1", title: "ACS Junior Prelim 2025", school: "ACS Junior", year: 2025, term: "Prelim", subject: "English", size: "2.4 MB", url: "/past-papers/2025/p6/english/acs-junior-prelim-sample.pdf" },
    { id: "e2", title: "Ai Tong Prelim 2025", school: "Ai Tong School", year: 2025, term: "Prelim", subject: "English", size: "2.1 MB", url: "/past-papers/2025/p6/english/ai-tong-prelim-sample.pdf" },
];

export default function PastPapersPage() {
    const [activeSubject, setActiveSubject] = useState<AssessmentSubject>("Math");
    // Purpose: Sprint 98 — Collapsible sidebar toggle.
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    // Purpose: Sprint 116.2 — Selected paper ID for iframe viewer.
    const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);

    // Purpose: Filter papers by subject.
    const filteredPapers = SCRAPED_PAPERS.filter((p) => p.subject === activeSubject);
    const selectedPaper = SCRAPED_PAPERS.find((p) => p.id === selectedPaperId) ?? null;

    return (
        <div className="flex-1 flex h-full bg-gray-50 dark:bg-slate-950">
            {/* Purpose: LEFT SIDEBAR (collapsible w-72): Subject tabs + paper list. */}
            <aside className={`${isSidebarOpen ? "w-72 flex" : "hidden"} flex-col shrink-0 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 md:flex transition-all`}>
                {/* Purpose: Subject navigation tabs inside sidebar. */}
                <div className="px-3 py-3 border-b border-gray-200 dark:border-slate-800 shrink-0">
                    <div className="flex flex-wrap gap-1.5">
                        {SUBJECT_TABS.map((tab) => {
                            const isActive = activeSubject === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => { setActiveSubject(tab.key); setSelectedPaperId(null); }}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer border ${isActive
                                        ? tab.activeColor
                                        : "bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    <tab.icon size={11} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Purpose: Scrollable paper list. */}
                <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1 min-h-0">
                    {filteredPapers.length === 0 && (
                        <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-8">No papers available.</p>
                    )}
                    {filteredPapers.map((paper) => (
                        <button
                            key={paper.id}
                            onClick={() => setSelectedPaperId(paper.id)}
                            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left cursor-pointer ${selectedPaperId === paper.id
                                ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700"
                                : "hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent"
                                }`}
                        >
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                                <FileTextIcon size={14} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{paper.title}</p>
                                <p className="text-[9px] text-gray-400 dark:text-slate-500">{paper.school} • {paper.term} {paper.year} • {paper.size}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Purpose: RIGHT MAIN AREA — PDF iframe viewer or empty state. */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Purpose: Top bar with sidebar toggle. */}
                <header className="px-4 py-2 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
                    >
                        <PanelLeftIcon size={16} />
                    </button>
                    {selectedPaper ? (
                        <div className="flex-1 flex items-center justify-between">
                            <div>
                                <h1 className="text-sm font-bold text-gray-900 dark:text-white">{selectedPaper.title}</h1>
                                <p className="text-[10px] text-gray-500">{selectedPaper.school} • {selectedPaper.term} {selectedPaper.year}</p>
                            </div>
                            <a
                                href={selectedPaper.url}
                                download
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors"
                            >
                                <DownloadIcon size={12} />
                                Download PDF
                            </a>
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 dark:text-white">Past Year Exam Papers</h1>
                            <p className="text-[10px] text-gray-500">Select a paper from the menu</p>
                        </div>
                    )}
                </header>

                {/* Purpose: Sprint 116.2 — PDF iframe viewer or empty state. */}
                {selectedPaper ? (
                    <div className="flex-1 w-full h-full p-4">
                        <iframe
                            src={selectedPaper.url}
                            className="w-full h-full rounded-xl border border-gray-200 dark:border-slate-800"
                            title={`${selectedPaper.title} - Exam Paper Viewer`}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-8">
                        <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                            <FileTextIcon size={24} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-1">Select a Paper</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm">
                                Choose a past paper from the sidebar to view or download.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
