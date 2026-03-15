import React from 'react';

// Purpose: Defines the configuration for the PayoutCard component.
export interface PayoutCardProps {
    label: string;
    encryptedValue: string;
    breakdown: string[];
}

// Purpose: A secure UI component used to display sensitive financial figures with data masking applied.
export const PayoutCard: React.FC<PayoutCardProps> = ({ label, encryptedValue, breakdown }) => {
    return (
        <div className="p-4 border rounded-lg bg-white shadow-sm">
            <h4 className="font-bold text-lg mb-2">{label}</h4>
            <p className="text-2xl font-mono mb-4">*** HIDDEN ({String(encryptedValue || '').substring(0, 8)}...) ***</p>
            <div className="text-sm text-gray-500">
                <p className="font-semibold mb-1">Includes:</p>
                <ul className="list-disc pl-5">
                    {breakdown.map((item, idx) => (
                        <li key={idx}>{item}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
