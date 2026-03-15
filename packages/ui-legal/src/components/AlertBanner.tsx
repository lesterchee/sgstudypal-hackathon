import React from 'react';

// Purpose: Defines the properties for the AlertBanner, mapping the status to specific feedback colors.
export interface AlertBannerProps {
    status: 'SUCCESS' | 'INFO' | 'WARNING' | 'CRITICAL' | 'ERROR';
    title: string;
    description: string;
}

// Purpose: A reusable UI component for displaying system-level alerts and notifications.
export const AlertBanner: React.FC<AlertBannerProps> = ({ status, title, description }) => {
    // Purpose: Maps the provided status to appropriate Tailwind CSS color utility classes.
    const getBackgroundColor = () => {
        switch (status) {
            case 'SUCCESS': return 'bg-green-50 border-green-200';
            case 'WARNING': return 'bg-yellow-50 border-yellow-200';
            case 'CRITICAL':
            case 'ERROR': return 'bg-red-50 border-red-200';
            case 'INFO':
            default: return 'bg-blue-50 border-blue-200';
        }
    };

    return (
        <div className={`p-4 border rounded-lg ${getBackgroundColor()}`}>
            <h4 className="font-bold">{title}</h4>
            <p>{description}</p>
        </div>
    );
};
