// Purpose: Sentiment Analysis Middleware — keyword-based frustration detection
// for student text input. When severe frustration is detected, the AI pipeline
// halts academic logic, shifts to an empathetic protocol, suggests a 5-minute
// break, and flags the Parent Dashboard for awareness.

import type { SentimentResult } from './sentiment-types';

// Purpose: Frustration corpus — phrases indicating severe emotional distress.
// Matched case-insensitively against student text input.
// Ordered by severity: self-deprecation > giving up > anger.
const SEVERE_FRUSTRATION_PHRASES = [
    'i am stupid',
    'i\'m stupid',
    'im stupid',
    'i am dumb',
    'i\'m dumb',
    'i\'m so dumb',
    'i hate myself',
    'i can\'t do this',
    'i cant do this',
    'i can\'t do anything',
    'i want to give up',
    'i give up',
    'i want to quit',
    'i hate math',
    'i hate maths',
    'i hate science',
    'i hate school',
    'i\'m useless',
    'im useless',
    'nobody likes me',
    'i\'m the worst',
    'i don\'t want to study',
    'i dont want to study',
    'this is impossible',
    'i\'ll never get it',
    'i will never understand',
];

// Purpose: Mild frustration indicators — logged but don't trigger the full
// empathetic halt. Used for analytics and trend detection.
const MILD_FRUSTRATION_PHRASES = [
    'this is hard',
    'i don\'t understand',
    'i dont understand',
    'i\'m confused',
    'help me',
    'i\'m stuck',
    'im stuck',
    'too difficult',
    'so hard',
];

// Purpose: Empathetic protocol response — replaces academic content when
// severe frustration is detected. Designed to be warm, validating, and
// actionable (suggests a concrete break activity).
const EMPATHETIC_RESPONSES = [
    "Hey, it's okay to feel frustrated sometimes. 💛 Even the best scholars get stuck! How about we take a 5-minute break? You could get some water, stretch, or take a few deep breaths. I'll be right here when you're ready to try again!",
    "I hear you, and your feelings are completely valid. 🌟 Learning hard things IS hard — that's what makes it an achievement! Let's pause for 5 minutes. Maybe draw something fun or have a snack? We'll tackle this together when you're back!",
    "You know what? Being frustrated means you're trying really hard, and that's amazing! 💪 Let's take a little break — 5 minutes to do something you enjoy. When you come back, we'll look at this problem with fresh eyes!",
];

// Purpose: Main entry point — evaluates student text for frustration signals.
// Returns a SentimentResult indicating severity, whether to halt, the matched
// phrase, and the empathetic response to send.
export function evaluateSentiment(text: string): SentimentResult {
    const normalizedText = text.toLowerCase().trim();

    // Purpose: Check severe frustration phrases first (highest priority).
    for (const phrase of SEVERE_FRUSTRATION_PHRASES) {
        if (normalizedText.includes(phrase)) {
            // Purpose: Select a random empathetic response for variety.
            const response = EMPATHETIC_RESPONSES[
                Math.floor(Math.random() * EMPATHETIC_RESPONSES.length)
            ];

            return {
                severity: 'severe',
                triggered: true,
                matchedPhrase: phrase,
                empatheticResponse: response,
                flagParentDashboard: true,
            };
        }
    }

    // Purpose: Check mild frustration phrases (logged, not halted).
    for (const phrase of MILD_FRUSTRATION_PHRASES) {
        if (normalizedText.includes(phrase)) {
            return {
                severity: 'mild',
                triggered: false,
                matchedPhrase: phrase,
                empatheticResponse: null,
                flagParentDashboard: false,
            };
        }
    }

    // Purpose: No frustration detected — proceed with academic pipeline.
    return {
        severity: 'none',
        triggered: false,
        matchedPhrase: null,
        empatheticResponse: null,
        flagParentDashboard: false,
    };
}
