import React from 'react';

// Purpose: Defines the properties for the ResultCard component.
export interface ResultCardProps {
    title: string;
    details?: React.ReactNode;
    encryptedPayload?: string;
    description?: string;
    confidenceScore?: number;
    disclaimer?: string;
    confidenceWarning?: boolean;
}

// Purpose: A display component used to render computed legal outcomes, confidence scores, and encrypted payload warnings.
export const ResultCard: React.FC<ResultCardProps> = ({ title, details, encryptedPayload, description, confidenceScore, disclaimer, confidenceWarning }) => {
    return (
        <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
            {confidenceWarning && disclaimer && (
                <div className="bg-amber-100 border-b border-amber-500 text-amber-800 px-4 py-2 text-sm font-medium">
                    ⚠️ {disclaimer}
                </div>
            )}
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                {confidenceScore !== undefined && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${confidenceWarning ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                        Confidence: {(confidenceScore * 100).toFixed(0)}%
                    </span>
                )}
            </div>
            <div className="p-4 text-gray-700 space-y-2">
                {encryptedPayload && (
                    <div className="font-mono text-xs bg-slate-100 p-2 rounded text-slate-600 break-all">
                        {encryptedPayload}
                    </div>
                )}
                {description && <p className="text-sm text-gray-600">{description}</p>}
                {details}
            </div>
        </div>
    );
};
