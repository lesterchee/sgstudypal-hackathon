'use client';

import React, { useState } from 'react';

// Purpose: Defines the properties for the ZeroKnowledgeConsentModal component.
interface ZeroKnowledgeConsentModalProps {
    caseId: string;
    onConsent: (timestamp: number) => void;
}

// Purpose: A modal that enforces strict user acknowledgment of the Zero-Knowledge retention policy, warning of permanent data loss if the Case ID is lost.
export const ZeroKnowledgeConsentModal: React.FC<ZeroKnowledgeConsentModalProps> = ({ caseId, onConsent }) => {
    const [acknowledged, setAcknowledged] = useState(false);

    const handleConsent = () => {
        setAcknowledged(true);
        onConsent(Date.now());
    };

    if (acknowledged) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Zero-Knowledge Vault Protected</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Your Case ID has been generated: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-black">{caseId}</span>
                </p>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded text-sm mb-6">
                    <p className="font-semibold mb-1">Warning: No Recovery Mechanism</p>
                    <p>
                        We do not collect emails, phone numbers, or NRICs. If you lose this Case ID,
                        your data cannot be recovered under any circumstances.
                    </p>
                </div>
                <button
                    onClick={handleConsent}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                    I acknowledge this Case ID is my only key. Loss of this ID results in permanent data loss.
                </button>
            </div>
        </div>
    );
};
