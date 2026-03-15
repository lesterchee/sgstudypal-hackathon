// Purpose: OCR Verifier Component — handles English handwriting image uploads.
// Simulates OCR extraction into a textarea for student verification.
// Requires explicit user confirmation ("Is this exactly what you wrote?")
// before appending the text to the question queue, ensuring OCR accuracy.

"use client";

import { useState, useCallback } from "react";
import { Upload, CheckCircle2, RotateCcw, FileText, AlertCircle } from "lucide-react";

const UploadIcon = Upload as any;
const CheckCircle2Icon = CheckCircle2 as any;
const RotateCcwIcon = RotateCcw as any;
const FileTextIcon = FileText as any;
const AlertCircleIcon = AlertCircle as any;

// Purpose: OCR processing stages for the state machine.
type OcrStage = 'idle' | 'processing' | 'review' | 'confirmed';

// Purpose: Props for the OcrVerifier component.
interface OcrVerifierProps {
    /** Purpose: Callback fired when the user confirms the OCR text is accurate.
     *  The parent component should append this to the question queue. */
    onConfirm: (confirmedText: string, originalFileName: string) => void;
}

// Purpose: Simulated OCR extraction — in production, this calls a Vision API
// (e.g., Google Cloud Vision or Gemini Flash) to extract handwritten text.
function simulateOcrExtraction(fileName: string): string {
    // Purpose: Return a realistic placeholder to demonstrate the verification flow.
    return `The boy was walking along the corridor when he spotted a wallet on the floor. He picked it up and looked around nervously. "Should I keep it?" he whispered to himself. After thinking for a moment, he decided to bring it to the general office.`;
}

// Purpose: Main component — manages the OCR upload → review → confirm pipeline.
export default function OcrVerifier({ onConfirm }: OcrVerifierProps) {
    const [stage, setStage] = useState<OcrStage>('idle');
    const [extractedText, setExtractedText] = useState('');
    const [fileName, setFileName] = useState('');
    // Purpose: Track if the user has edited the OCR text (shows a warning).
    const [isEdited, setIsEdited] = useState(false);

    // Purpose: Handle file upload — triggers the simulated OCR extraction.
    const handleFileUpload = useCallback((file: File) => {
        setFileName(file.name);
        setStage('processing');

        // Purpose: Simulate processing delay (500ms) to mimic real OCR latency.
        setTimeout(() => {
            const text = simulateOcrExtraction(file.name);
            setExtractedText(text);
            setIsEdited(false);
            setStage('review');
        }, 500);
    }, []);

    // Purpose: Handle drag-and-drop file input.
    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                handleFileUpload(file);
            }
        },
        [handleFileUpload]
    );

    // Purpose: Handle click-based file selection.
    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                handleFileUpload(file);
            }
        },
        [handleFileUpload]
    );

    // Purpose: Reset the entire flow back to idle for re-upload.
    const handleReset = useCallback(() => {
        setStage('idle');
        setExtractedText('');
        setFileName('');
        setIsEdited(false);
    }, []);

    // Purpose: User confirms the OCR text is accurate — fire the callback.
    const handleConfirm = useCallback(() => {
        setStage('confirmed');
        onConfirm(extractedText, fileName);
    }, [extractedText, fileName, onConfirm]);

    // Purpose: Render the appropriate stage of the OCR pipeline.
    return (
        <div className="w-full max-w-lg">
            {/* Purpose: Stage 1 — Idle: Upload drop zone for English handwriting images. */}
            {stage === 'idle' && (
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/30 hover:bg-violet-50/60 transition-all duration-200 cursor-pointer"
                >
                    <label className="flex flex-col items-center cursor-pointer">
                        <UploadIcon size={32} className="text-violet-400 mb-2" />
                        <p className="text-sm font-medium text-violet-600 mb-1">
                            Upload your English composition or worksheet
                        </p>
                        <p className="text-xs text-violet-400">
                            We&apos;ll extract the text for you to verify
                        </p>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleInputChange}
                            className="hidden"
                        />
                    </label>
                </div>
            )}

            {/* Purpose: Stage 2 — Processing: Show a loading spinner during OCR extraction. */}
            {stage === 'processing' && (
                <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-violet-200 bg-violet-50/50">
                    <div className="w-8 h-8 border-3 border-violet-300 border-t-violet-600 rounded-full animate-spin mb-3" />
                    <p className="text-sm font-medium text-violet-600">
                        Extracting text from {fileName}...
                    </p>
                </div>
            )}

            {/* Purpose: Stage 3 — Review: Display extracted text in an editable textarea.
                Requires explicit user confirmation before proceeding. */}
            {stage === 'review' && (
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/30 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <FileTextIcon size={18} className="text-amber-600" />
                        <h3 className="text-sm font-bold text-amber-800">
                            OCR Result from {fileName}
                        </h3>
                    </div>

                    {/* Purpose: Editable textarea — student can correct OCR mistakes. */}
                    <textarea
                        value={extractedText}
                        onChange={(e) => {
                            setExtractedText(e.target.value);
                            setIsEdited(true);
                        }}
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-white text-sm text-slate-900 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
                    />

                    {/* Purpose: Warning if the user has modified the extracted text. */}
                    {isEdited && (
                        <div className="flex items-center gap-2 text-xs text-amber-600">
                            <AlertCircleIcon size={14} />
                            <span>You&apos;ve edited the text. Make sure it matches your original writing.</span>
                        </div>
                    )}

                    {/* Purpose: Confirmation prompt — the critical gate. */}
                    <div className="bg-amber-100/60 rounded-xl p-3 border border-amber-200">
                        <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                            ⚠️ Is this <span className="underline">exactly</span> what you wrote?
                            Every comma counts! The AI Tutor will mark your work based on this text.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleConfirm}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                        >
                            <CheckCircle2Icon size={16} />
                            Yes, this is correct!
                        </button>
                        <button
                            onClick={handleReset}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-all cursor-pointer"
                        >
                            <RotateCcwIcon size={14} />
                            Re-upload
                        </button>
                    </div>
                </div>
            )}

            {/* Purpose: Stage 4 — Confirmed: Success state. */}
            {stage === 'confirmed' && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <CheckCircle2Icon size={20} className="text-emerald-500 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-emerald-700">
                            Text confirmed and added to queue!
                        </p>
                        <p className="text-xs text-emerald-500 mt-0.5">
                            The AI Tutor will review your writing shortly.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
