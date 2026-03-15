import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { globalCircuitBreaker } from './circuit-breaker.js';

// Purpose: Defines custom error types for AI service unavailability to trigger fallback degraded-mode UI seamlessly.
export class GeminiServiceUnavailableError extends Error {
    public fallback: boolean = true;
    constructor(message: string) {
        super(message);
        this.name = 'GeminiServiceUnavailableError';
    }
}

// Purpose: Wraps the Vercel AI SDK text stream with circuit breaker protection and strict timeout abort controls for robust model interactions.
export async function fetchWithCircuitBreaker(options: any): Promise<any> {
    if (globalCircuitBreaker.isTripped()) {
        throw new GeminiServiceUnavailableError('Circuit breaker is open. Gemini service is unavailable.');
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 10000); // 10 seconds

    try {
        const response = await streamText({
            ...options,
            abortSignal: abortController.signal,
        });

        globalCircuitBreaker.recordSuccess();
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        globalCircuitBreaker.recordFailure();

        if (globalCircuitBreaker.isTripped()) {
            throw new GeminiServiceUnavailableError('Gemini service failed repeatedly. Circuit breaker tripped.');
        }

        throw error;
    }
}
