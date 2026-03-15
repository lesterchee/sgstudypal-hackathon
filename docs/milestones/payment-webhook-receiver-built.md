# Payment Webhook Receiver Built

> **Date:** 2026-03-11T13:46 SGT  
> **Trigger:** CommitPayApp → CRM pipeline integration  
> **Status:** ✅ Route built and validated

---

## What Was Built

### `POST /api/webhooks/payment`

A secure serverless endpoint that receives payment success events from CommitPayApp and automatically advances the corresponding CRM lead to "Closed / PAID".

**Security:** Bearer token auth via `CRM_WEBHOOK_SECRET` env var. Returns `401` if missing or invalid.

**Pipeline Mutation:** On valid webhook, the lead document is updated with:
- `paymentStatus: "PAID"`
- `paymentAmount: <amount from webhook>`
- `crmStatus: "Closed"`
- `updatedAt: FieldValue.serverTimestamp()`

**Edge Cases Handled:**
- Missing `CRM_WEBHOOK_SECRET` → `500` (server misconfig)
- Invalid/missing auth header → `401`
- Missing `leadId` or `amount` → `400`
- `leadId` not found in Firestore → `404`
- Firebase timeout / malformed JSON → `500` with logged error

---

## DoD Validation

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ Zero errors |
| `npx next build` | ✅ Compiled, `/api/webhooks/payment` registered |
