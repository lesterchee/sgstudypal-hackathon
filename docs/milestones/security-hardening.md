# Milestone: Security Hardening & Zero-Leak Protocol Enforcement

This document outlines the security hardening applied to the sgdivorce.ai platform's Zero-Leak Handoff Protocol, specifically concerning the `LogicMetadata` schema.

## 1. The Vulnerability
During a scheduled protocol review by the Legal Architect, a vulnerability was discovered in the `LegalHandoffPayload`:
```typescript
// VULNERABLE SCHEMA
export interface LogicMetadata {
    [key: string]: boolean | string | number | string[] | undefined;
}
```
The inclusion of `number` as an allowed type in the unencrypted `metadata` object created a schema loophole. Developers or AI Agents could inadvertently assign financial or quantifiable personally identifiable information (PII) — such as salaries, property prices, or years of service — directly to the `metadata` object. This would mean passing sensitive values as plaintext, directly violating the core principle of the Zero-Leak Handoff Protocol.

## 2. The Hardening
To prevent future "Context Rot" and permanently close this leak, the `number` type was completely removed from the `LogicMetadata` union:
```typescript
// HARDENED SCHEMA
export interface LogicMetadata {
    [key: string]: boolean | string | string[] | undefined;
}
```

### Impact and Rules
1. **No Raw Numbers:** Any public routing logic must be represented as a `boolean`, `string`, or `string[]`. 
2. **Encrypted Payloads Only:** All numerical data, including financial values (e.g., $P$, salaries) and continuous variables (e.g., `years`, `interestRate`), **MUST** be packaged within the `encryptedPayload`.
3. **In-Memory Decryption:** Calculators must decrypt the payload, parse the numerical values in-memory, perform the calculations, and then immediately let the raw PII fall out of scope, returning only the computed results or securely re-encrypted totals.

## 3. Component Refactor: Property Calculator
As part of this security hardening effort, the `property-calculator.ts` was refactored. Previously, it accepted `years` and `interestRate` as numbers via the `metadata` object.

It now adheres to the hardened protocol by consuming a JSON-stringified and encrypted payload:
```json
// Example Decrypted Payload
{
    "principal": 100000,
    "years": 5,
    "interestRate": 0.025
}
```

This enforces the boundary that the intermediate APIs and frontend never see the pure numerical data required for computation.
