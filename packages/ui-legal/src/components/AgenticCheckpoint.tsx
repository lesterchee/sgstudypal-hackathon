"use client";

import React, { useState } from 'react';
import { LegalDomain } from '@repo/core-engine';

// Purpose: Defines the required props for the AgenticCheckpoint component.
interface AgenticCheckpointProps {
    domain: LegalDomain;
    onConfirm: () => void;
    className?: string;
}

/**
 * AgenticCheckpoint
 * 
 * A regulatory compliance gate (2026 IMDA standards) that requires explicit 
 * user confirmation against the specified legal domain before proceeding 
 * to final document generation.
 */
// Purpose: A regulatory compliance checkpoint component that requires explicit user confirmation before document generation, adhering to zero-knowledge mandates.
export const AgenticCheckpoint: React.FC<AgenticCheckpointProps> = ({
    domain,
    onConfirm,
    className = ''
}) => {
    const [isConfirmed, setIsConfirmed] = useState(false);

    const handleConfirm = () => {
        if (isConfirmed) {
            onConfirm();
        }
    };

    const domainLabels: Record<LegalDomain, string> = {
        DIVORCE: "Divorce & Matrimonial",
        WILLS: "Wills & Probate",
        FAIRWORK: "Employment & FairWork",
        PROPERTY: "Property Conveyancing"
    };

    return (
        <div className={`p-6 border-2 border-amber-500 bg-amber-50 rounded-lg shadow-sm ${className}`}>
            <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2 text-amber-900 border-b border-amber-200 pb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-lg font-bold">Regulatory Checkpoint ({domainLabels[domain]})</h3>
                </div>

                <p className="text-sm text-gray-700">
                    Before proceeding to the final document generation stage for this {domainLabels[domain]} application, please confirm that the provided information does not contain unsolicited Personally Identifiable Information (PII) beyond what is strictly required, in accordance with the 2026 IMDA Zero-Knowledge mandates.
                </p>

                <label className="flex items-start space-x-3 cursor-pointer mt-2 bg-white p-3 rounded border border-amber-200 hover:bg-amber-100 transition-colors">
                    <input
                        type="checkbox"
                        className="mt-1 h-5 w-5 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                        checked={isConfirmed}
                        onChange={(e) => setIsConfirmed(e.target.checked)}
                    />
                    <span className="text-sm font-medium text-gray-800">
                        I confirm the above details and authorize the system to generate the secure artifact using my anonymized Case ID.
                    </span>
                </label>

                <button
                    onClick={handleConfirm}
                    disabled={!isConfirmed}
                    className={`w-full py-3 px-4 rounded-md font-bold text-white transition-all ${isConfirmed
                        ? 'bg-amber-600 hover:bg-amber-700 shadow-md'
                        : 'bg-gray-300 cursor-not-allowed text-gray-500'
                        }`}
                >
                    Proceed to Document Generation
                </button>
            </div>
        </div>
    );
};
