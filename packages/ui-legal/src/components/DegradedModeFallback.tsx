import React from 'react';

// Purpose: A fallback UI component displayed when core AI services are offline, guiding users to deterministic alternative tools.
export const DegradedModeFallback: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 text-red-900 border border-red-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-2">Degraded Mode</h2>
            <p className="text-center mb-4">
                The AI service is currently unavailable.
                However, you can still continue using the deterministic math calculators below to estimate your asset division.
            </p>
        </div>
    );
};
