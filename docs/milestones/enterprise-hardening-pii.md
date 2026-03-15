# Enterprise Hardening: PII Scrubbing

**Milestone:** Resolution of Liability 1 (The PII Leak)
**Component:** `PIIScrubber` Middleware (`/packages/legal-engine/src/security/pii-scrubber.ts`)

## Overview
To prevent Personally Identifiable Information (PII) from leaking to external LLM providers (e.g., Gemini), we have implemented a dedicated PII scrubber utility. This utility sanitizes sensitive data from input text before handoff, storing the mapping locally to allow re-hydration of the final output.

## Regex Patterns Supported

The scrubber currently supports regular expressions tailored for the Singaporean context:

1.  **Singapore NRIC/FIN**
    *   **Pattern:** `/[STFG]\d{7}[A-Z]/gi`
    *   **Description:** Matches standard Singapore National Registration Identity Card (NRIC) and Foreign Identification Number (FIN) formats.
    *   **Placeholder:** `[NRIC_FIN_x]`

2.  **Phone Numbers (SG)**
    *   **Pattern:** `/(?:\+65\s?)?[89]\d{7}/g`
    *   **Description:** Matches 8-digit Singapore phone numbers starting with 8 or 9, with an optional '+65' country code prefix.
    *   **Placeholder:** `[PHONE_x]`

3.  **Bank Accounts (Generic)**
    *   **Pattern:** `/\b\d{3}[-\s]?\d{1,3}[-\s]?\d{4,7}\b/g`
    *   **Description:** Matches common bank account number formats consisting of sets of digits separated by hyphens or spaces (e.g., standard lengths used by local banks).
    *   **Placeholder:** `[BANK_ACCT_x]`

## Mechanism
The `sanitizeForLLM` function consumes an input string and outputs:
- `sanitizedString`: The cleaned text safe for LLM ingestion.
- `piiMap`: A `Record<string, string>` dictionary mapping placeholders to the original PII.

This ensures a zero-leak policy while allowing local system reconstruction of personalized legal documents.
