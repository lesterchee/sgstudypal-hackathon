import React from 'react';

// Purpose: Defines the properties for the DeadlineTracker component.
export interface DeadlineTrackerProps {
    daysRemaining: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    label: string;
}

// Purpose: A visual component used to track impending legal deadlines, emphasizing severity based on days remaining.
export const DeadlineTracker: React.FC<DeadlineTrackerProps> = ({ daysRemaining, severity, label }) => {
    const getSeverityStyle = () => {
        if (severity === 'CRITICAL') return 'text-red-600 bg-red-100 border-red-300';
        if (severity === 'WARNING') return 'text-orange-600 bg-orange-100 border-orange-300';
        return 'text-blue-600 bg-blue-100 border-blue-300';
    };

    return (
        <div className={`p-4 border rounded-lg ${getSeverityStyle()} flex justify-between items-center`}>
            <div>
                <h4 className="font-bold">{label}</h4>
                <p className="text-sm opacity-90">Action required immediately</p>
            </div>
            <div className="text-right">
                <span className="text-3xl font-black">{daysRemaining}</span>
                <span className="block text-xs uppercase tracking-wider font-semibold">Days Left</span>
            </div>
        </div>
    );
};
