// Purpose: Sentiment Analysis Trigger — evaluates student text for signs of
// severe frustration or distress. If triggered, halts academic logic, shifts
// to an empathetic protocol, suggests a break, and flags the Parent Dashboard.

// Purpose: Type definitions for the sentiment analysis pipeline.

// Purpose: Severity levels for detected frustration.
export type SentimentSeverity = 'none' | 'mild' | 'severe';

// Purpose: Result returned by the sentiment evaluator.
export interface SentimentResult {
    severity: SentimentSeverity;
    triggered: boolean;
    /** Purpose: The matched keyword/phrase that triggered the alert, if any. */
    matchedPhrase: string | null;
    /** Purpose: Empathetic response to send instead of academic content. */
    empatheticResponse: string | null;
    /** Purpose: Whether to flag the Parent Dashboard with an alert. */
    flagParentDashboard: boolean;
}

// Purpose: Alert shape written to the Parent Dashboard.
export interface SentimentAlert {
    studentUid: string;
    matchedPhrase: string;
    timestamp: number;
    acknowledged: boolean;
}
