"use client";
import { useState, useEffect } from 'react';

// Using inline types to prevent circular dependencies while testing
export interface LogicMetadata {
    warnings?: string[];
    daysToDeadline?: string;
    isPartFourCovered?: boolean;
    isProbationComplete?: boolean;
    hasPendingFWARequest?: boolean;
    fwaDaysRemaining?: number;
    [key: string]: any;
}

export function useLegalEngine(domain: string) {
    const [metadata, setMetadata] = useState<LogicMetadata>({});
    const [encryptedResult, setEncryptedResult] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Mocking the engine response for the UI testing purposes
        setTimeout(() => {
            setMetadata({
                warnings: ['TADM_EXTREME_URGENCY'],
                daysToDeadline: '14',
                isPartFourCovered: true,
                isProbationComplete: true,
                hasPendingFWARequest: true,
                fwaDaysRemaining: 12
            });
            setEncryptedResult({
                totalPayout: 'U2FsdGVkX1+v...'
            });
            setIsLoading(false);
        }, 1000);
    }, [domain]);

    return { metadata, encryptedResult, isLoading };
}
