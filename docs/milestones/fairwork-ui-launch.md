# FairWork UI Launch: Milestone & Protocol Documentation

## TADM Deadline Logic Split Protocol

In order to maintain the separation of concerns and ensure legal strictness, the application implements a clear boundary between the Engine (Backend/Domain) and the UI (Frontend) regarding the TADM (Tripartite Alliance for Dispute Management) Disciplinary & Appeal Deadlines.

### 1. Engine / Backend Responsibility
The `legal-engine` holds the absolute source of truth for the strict legal cut-off date (`TADM_DEADLINE`).
- It applies complex calendar math, factoring in public holidays, non-working days, and the exact timestamp of termination.
- For instance, in a Wrongful Dismissal, the engine calculates the extreme 1-month cut-off.

### 2. Frontend / UI Responsibility
The UI (`apps/sg-fairwork`) receives the pre-calculated absolute date string from the `metadata` object of the `LegalHandoffPayload`, and is responsible **solely for calculating the relative time remaining** (e.g., "daysToDeadline").
- The UI contains NO domain or legal logic to compute when the exact end-date is.
- This prevents the UI from skewing the legal deadline due to incorrect timezone handling or frontend bugs, focusing only on presentation and rendering urgency (`TADM_EXTREME_URGENCY`).

## Progress
- Implementation of the Zero-Leak handoff payload has been defined and integrated.
- The `TriageCenter` component successfully separates financial payload (`encryptedResult`) from toggle states (`metadata`).
