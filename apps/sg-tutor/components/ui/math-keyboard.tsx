// Purpose: Sprint 22 — Custom Math Keyboard component that renders quick-insert
// buttons for common mathematical symbols (fractions, pi, degrees, units).
// Conditionally rendered above the chat input ONLY when activeSubject === 'Math'.
// Inserts the selected symbol at the cursor position in the parent input.

"use client";

import React, { useCallback } from "react";

// Purpose: Shape of a single keyboard button.
interface MathKey {
    /** Purpose: Label displayed on the button. */
    label: string;
    /** Purpose: The text/LaTeX inserted into the input when clicked. */
    value: string;
    /** Purpose: Tooltip description shown on hover. */
    tooltip: string;
}

// Purpose: The math keyboard key layout — organised by category.
// These symbols are specific to the Singapore MOE P1-P6 syllabus.
const MATH_KEYS: MathKey[] = [
    // Purpose: Fraction and division
    { label: '½', value: '\\frac{}{} ', tooltip: 'Fraction' },
    { label: '¼', value: '\\frac{1}{4} ', tooltip: 'One quarter' },
    { label: '¾', value: '\\frac{3}{4} ', tooltip: 'Three quarters' },
    { label: '÷', value: '÷ ', tooltip: 'Divide' },

    // Purpose: Geometry and measurement
    { label: 'π', value: 'π ', tooltip: 'Pi (3.14...)' },
    { label: '°', value: '° ', tooltip: 'Degrees' },
    { label: 'cm', value: 'cm ', tooltip: 'Centimetres' },
    { label: 'cm²', value: 'cm² ', tooltip: 'Square centimetres' },
    { label: 'cm³', value: 'cm³ ', tooltip: 'Cubic centimetres' },
    { label: 'm', value: 'm ', tooltip: 'Metres' },

    // Purpose: Mass and volume
    { label: 'kg', value: 'kg ', tooltip: 'Kilograms' },
    { label: 'g', value: 'g ', tooltip: 'Grams' },
    { label: 'ml', value: 'ml ', tooltip: 'Millilitres' },
    { label: 'ℓ', value: 'ℓ ', tooltip: 'Litres' },

    // Purpose: Operators and symbols
    { label: '×', value: '× ', tooltip: 'Multiply' },
    { label: '≈', value: '≈ ', tooltip: 'Approximately equal' },
    { label: '%', value: '% ', tooltip: 'Percent' },
    { label: ':', value: ':', tooltip: 'Ratio' },
];

// Purpose: Props for the MathKeyboard component.
interface MathKeyboardProps {
    /** Purpose: Whether the keyboard is visible (only when subject is Math). */
    isVisible: boolean;
    /** Purpose: Callback fired when a key is pressed — inserts the value
     *  into the parent chat input field. */
    onInsert: (value: string) => void;
}

// Purpose: Main component — renders the math keyboard overlay above the chat input.
export default function MathKeyboard({ isVisible, onInsert }: MathKeyboardProps) {
    if (!isVisible) return null;

    // Purpose: Handle key press — fire the insert callback.
    const handleKeyPress = useCallback(
        (key: MathKey) => {
            onInsert(key.value);
        },
        [onInsert]
    );

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mb-2">
            {/* Purpose: Header label */}
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
                Math Symbols
            </div>

            {/* Purpose: Grid of math keys */}
            <div className="flex flex-wrap gap-1.5">
                {MATH_KEYS.map((key) => (
                    <button
                        key={key.label}
                        type="button"
                        onClick={() => handleKeyPress(key)}
                        title={key.tooltip}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 transition-all duration-150 cursor-pointer shadow-sm"
                    >
                        {key.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
