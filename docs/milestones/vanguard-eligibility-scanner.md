# Milestone: Vanguard Eligibility Scanner

**Date:** 2026-03-03  
**Commit:** `feat(sg-divorce): scaffold eligibility scanner with GhostCrypto submission`  
**Status:** ✅ Built & pushed to `main` → Vercel production triggered

---

## Overview

Adds the `/eligibility-scanner` route — the primary conversion funnel after the landing page. Implements a 4-state UI machine that composes the existing `EligibilityScanner` and `PlaybookViewer` components with a secure GhostCrypto submission bridge.

---

## Architecture

### File Created

```
apps/sg-divorce/app/eligibility-scanner/page.tsx   ← NEW — Route page ("use client")
```

### GhostCrypto Client Integration

The Ghost Data Protocol is strictly enforced on the client side:

```
User Submits Form
    │
    ▼ (1) useGhostCrypto.encrypt(formStateJson)
         → POST /api/encrypt { text }          ← SERVER-SIDE AES-256-GCM
         ← { encrypted: "base64ciphertext" }
    │
    ▼ (2) Firestore write — sessions/{sessionId}
         { encryptedGrievance, status: "processing", submittedAt }
         ⚠ ZERO PLAINTEXT PII — only ciphertext written to DB
    │
    ▼ (3) POST /api/trigger/eligibility
         { sessionId, encryptedGrievance }
         ← { runId, status: "QUEUED" }
    │
    ▼ (4) <PlaybookViewer sessionId={sessionId} />
         → Firestore onSnapshot /sessions/{sessionId}/playbook/progress
         → Renders ProcessingSkeleton → GuidedPlaybook / UPLBlock
```

**Key constraint upheld:** `GHOST_CRYPTO_KEY` never leaves the server. The `useGhostCrypto` hook delegates all cryptographic operations to `/api/encrypt`.

---

## UI State Machine

| State | Trigger | Component |
|---|---|---|
| `FORM` | Initial | `EligibilityScanner` + playbook CTA |
| `SUBMITTING` | CTA click | `SubmittingView` (phase progress) |
| `PLAYBOOK` | Trigger.dev queued | `PlaybookViewer` (Firestore live) |
| `ERROR` | Any phase fails | `ErrorView` with retry |

---

## Build Verification

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /eligibility-scanner       ← NEW
├ ○ /how-we-protect-your-data
└ ○ /test-handshake

Tasks: 2 successful · 0 TS errors · 5.94s
```

---

## Guarded Self-Healing

- ✅ `/packages/types` — not modified
- ✅ `firestore.rules` — not modified  
- ✅ `EligibilityScanner` component — not modified
- ✅ `PlaybookViewer` component — not modified

---

## Next Milestone

Wire the "Generate My Playbook" CTA to the scanner's final result step via a shared state mechanism (eliminate `sessionStorage` relay in favour of a lifted state contract).
