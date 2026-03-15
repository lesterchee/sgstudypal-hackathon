// Purpose: Chinese Text Component — wraps Chinese AI output with grade-aware
// Pinyin rendering and Web Speech API audio playback. For P1-P3, always shows
// ruby annotations. For P4-P6, renders Hanzi only with click-to-reveal tooltip.

"use client";

import { useState, useCallback } from "react";
import { Volume2 } from "lucide-react";

const Volume2Icon = Volume2 as any;

// Purpose: Grade levels where Pinyin is always visible via <ruby> tags.
const ALWAYS_PINYIN_GRADES = ['P1', 'P2', 'P3'];

// Purpose: Sprint 16 — GradeLevel consolidated into lib/types.ts.
import type { GradeLevel } from '@/lib/types';

// Purpose: Props for the ChineseText component.
interface ChineseTextProps {
    /** Purpose: The Chinese text content to render. */
    text: string;
    /** Purpose: Array of Pinyin strings, one per character in `text`.
     *  Must be the same length as the number of Chinese characters. */
    pinyin: string[];
    /** Purpose: Student's grade level — determines Pinyin display mode. */
    gradeLevel: GradeLevel;
}

// Purpose: Main component — renders Chinese text with grade-appropriate
// Pinyin support and a "Play Audio" button for TTS.
export default function ChineseText({ text, pinyin, gradeLevel }: ChineseTextProps) {
    // Purpose: Track which character index has its tooltip revealed (P4-P6 only).
    const [revealedIndex, setRevealedIndex] = useState<number | null>(null);
    // Purpose: Track whether TTS is currently playing for visual feedback.
    const [isPlaying, setIsPlaying] = useState(false);

    const alwaysShowPinyin = ALWAYS_PINYIN_GRADES.includes(gradeLevel);

    // Purpose: Extract Chinese characters for per-character rendering.
    // Non-Chinese characters (punctuation, spaces) pass through unchanged.
    const characters = text.split('');

    // Purpose: Web Speech API TTS handler — speaks the Chinese text aloud
    // using the zh-CN voice with appropriate rate for the grade level.
    const handlePlayAudio = useCallback(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        // Purpose: Cancel any ongoing speech before starting a new one.
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        // Purpose: Slow down speech rate for younger students (P1-P3).
        utterance.rate = alwaysShowPinyin ? 0.7 : 0.9;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        window.speechSynthesis.speak(utterance);
    }, [text, alwaysShowPinyin]);

    // Purpose: Check if a character is a Chinese character (CJK Unified Ideographs range).
    const isChinese = (char: string) => /[\u4e00-\u9fff]/.test(char);

    // Purpose: Track which pinyin index we're at (only increment for Chinese chars).
    let pinyinIdx = 0;

    return (
        <div className="inline-flex flex-col gap-2">
            {/* Purpose: Text rendering area — ruby tags for P1-P3, tooltips for P4-P6. */}
            <div className="text-lg leading-loose tracking-wide">
                {characters.map((char, i) => {
                    if (!isChinese(char)) {
                        // Purpose: Non-Chinese characters render as-is (punctuation, spaces).
                        return <span key={i}>{char}</span>;
                    }

                    const currentPinyinIdx = pinyinIdx;
                    const charPinyin = pinyin[currentPinyinIdx] || '';
                    pinyinIdx++;

                    if (alwaysShowPinyin) {
                        // Purpose: P1-P3 — always render <ruby> annotation tags.
                        return (
                            <ruby key={i} className="text-slate-900">
                                {char}
                                <rp>(</rp>
                                <rt className="text-xs text-violet-500 font-medium">{charPinyin}</rt>
                                <rp>)</rp>
                            </ruby>
                        );
                    }

                    // Purpose: P4-P6 — Hanzi only, with click-to-reveal Pinyin tooltip.
                    return (
                        <span
                            key={i}
                            className="relative cursor-pointer hover:text-violet-600 transition-colors"
                            onClick={() =>
                                setRevealedIndex(revealedIndex === currentPinyinIdx ? null : currentPinyinIdx)
                            }
                        >
                            {char}
                            {revealedIndex === currentPinyinIdx && (
                                <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-violet-600 text-white text-xs font-medium whitespace-nowrap shadow-lg z-10">
                                    {charPinyin}
                                </span>
                            )}
                        </span>
                    );
                })}
            </div>

            {/* Purpose: Play Audio button — wired to Web Speech API for zh-CN TTS. */}
            <button
                onClick={handlePlayAudio}
                className={`inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${isPlaying
                    ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600'
                    }`}
            >
                <Volume2Icon size={14} />
                {isPlaying ? 'Playing...' : 'Play Audio 🔊'}
            </button>
        </div>
    );
}
