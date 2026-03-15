// Purpose: Implements a fail-safe circuit breaker pattern to prevent cascading failures when external AI services experience sustained outages.
export class CircuitBreaker {
    private failureCount = 0;
    private lastFailureTime = 0;
    private readonly threshold = 3;
    private readonly resetTimeoutMs = 60000;

    isTripped(): boolean {
        if (this.failureCount >= this.threshold) {
            if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
                // Reset the breaker after timeout
                this.failureCount = 0;
                return false;
            }
            return true;
        }
        return false;
    }

    recordFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();
    }

    recordSuccess(): void {
        this.failureCount = 0;
    }
}

export const globalCircuitBreaker = new CircuitBreaker();
