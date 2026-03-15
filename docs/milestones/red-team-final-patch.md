# Red-Team Final Patch Milestone

**Date:** March 1, 2026
**Mission:** Red-Team Patch Protocol

## Definition of Done
✅ Local `npx turbo build` passes with zero TS errors.
✅ Incident logged to `incident-tracker.json`.
✅ Output milestone doc to `/docs/milestones/red-team-final-patch.md`.

## Execution Summary

### Thread 1: Expand Contract Guardian
- Renamed `/packages/types/scripts/lock-check.ts` to `/packages/types/scripts/master-lock-check.ts`.
- Updated referencing tasks in `turbo.json`.
- Expanded standard `git diff` logic to strictly protect `/packages/legal-engine/src/calculators/` and `/packages/legal-engine/src/rules/`.
- Implemented an exit code of `1` alongside an explicit error if a TS error is bypassed by non-architect agents meddling with deterministic math.

### Thread 2: True Zero-Knowledge & TTL
- Refactored `AES-256-GCM` logic inside `/packages/legal-engine/src/security/session-vault.ts`.
- Substituted arbitrary payload key derivation with Web Crypto API `PBKDF2`, mapping strictly 12-character Case IDs using SHA-256 and 100000 iterations.
- Removed reliance on any master `.env` key for payload data.
- Enforced a server-side `expiresAt` timestamp (30 days from creation) linked to `EncryptedSessionData` for Firestore TTL auto-deletion, appending it onto the visible return interface for the database layer over burying the parameter inside symmetrically encrypted content.

### Thread 3: UPL Prompt Hardening
- Strengthened `/packages/legal-engine/src/prompts/global-system-prompt.ts` with explicit strictures.
- Injected strict Anti-UPL constraints: *"You are an educational legal RAG system. You are structurally forbidden from issuing legal directives. All outputs must be phrased as informational templates (e.g., 'Based on standard practices, a draft schedule includes...')."*
