import { ConfidenceMonitor } from '../engine/ConfidenceMonitor.js';

const highConfidenceResult = { value: 100000 };
const lowConfidenceResult = { value: 100000 };

const res1 = ConfidenceMonitor.evaluateAndFormat(highConfidenceResult, 0.9);
const res2 = ConfidenceMonitor.evaluateAndFormat(lowConfidenceResult, 0.5);

console.log('\\nHigh Confidence Test (0.9):');
console.log('Expected: false');
console.log('Result:', res1.confidenceWarning);

console.log('\\nLow Confidence Test (0.5):');
console.log('Expected: true');
console.log('Result:', res2.confidenceWarning);
console.log('Disclaimer:', res2.disclaimer);
