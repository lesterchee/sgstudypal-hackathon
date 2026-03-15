// Purpose: Evaluates generation confidence scores and attaches necessary disclaimers or warnings if results fall below deterministic thresholds.
export class ConfidenceMonitor {
    static readonly DETERMINISTIC_DISCLAIMER = "Note: The confidence score for this analysis is below the deterministic threshold. Proceed with caution and refer to a human lawyer for validation.";
    static readonly TADM_TIME_LIMIT_WARNING = "Time Bar Rule: Wrongful dismissal claims generally must be filed at TADM within 1 month of the last day of employment. Proceed with caution if the elapsed time exceeds this limit.";
    static readonly THRESHOLD = 0.8;

    static evaluateAndFormat(result: any, confidenceScore: number, context?: { isWrongfulDismissal?: boolean }): any {
        const enhancedResult = { ...result };

        if (confidenceScore < this.THRESHOLD) {
            enhancedResult.disclaimer = this.DETERMINISTIC_DISCLAIMER;
            enhancedResult.confidenceWarning = true;
        } else {
            enhancedResult.confidenceWarning = false;
        }

        if (context?.isWrongfulDismissal) {
            enhancedResult.tadmWarning = this.TADM_TIME_LIMIT_WARNING;
        }

        return enhancedResult;
    }
}
