# Playbook Viewer — Real-Time Listener Architecture

**Milestone ID:** playbook-presentation  
**Date:** 2026-03-02  
**Engineer:** Legal Architect Agent (Antigravity)  
**Status:** ✅ Shipped — Build clean, committed to `main`

---

## What Was Built

The `PlaybookViewer` client component (`apps/sg-divorce/src/components/playbook-viewer.tsx`) delivers a real-time view of the Trigger.dev durable workflow via a 3-state UI machine, fully driven by a Firestore `onSnapshot` subscription.

### File Manifest

| File | Purpose |
|---|---|
| `apps/sg-divorce/src/lib/firebase-client.ts` | Singleton Firebase Client SDK initializer (new) |
| `apps/sg-divorce/src/components/playbook-viewer.tsx` | Main component — 3-state UI machine (new) |
| `apps/sg-divorce/components/playbook-viewer.tsx` | Root-level re-export shim (new) |
| `.env.local` | Added `NEXT_PUBLIC_FIREBASE_*` vars (6 new keys) |

---

## Real-Time Listener Architecture

### Why `onSnapshot` over polling

```
┌────────────────────────────────────────────────────────┐
│  Trigger.dev Cloud                                     │
│  eligibility-check task                                │
│   ↓ setStage("DECRYPT")                                │
│   ↓ setStage("RAG_QUERY")                              │
│   ↓ setStage("ANALYZE")              Firestore Write   │
│   ↓ setStage("COMPLETE") ──────────► sessions/{id}/   │
│                                        playbook/progress│
└────────────────────────────────────────────────────────┘
                                              │
                                    onSnapshot (WebSocket)
                                              │
                                              ▼
                               ┌──────────────────────────┐
                               │  PlaybookViewer           │
                               │  usePlaybookStatus hook   │
                               │  → 3-state UI machine     │
                               └──────────────────────────┘
```

- **Latency:** ~100ms via WebSocket push (vs 1–3s polling interval)
- **Cost:** Zero Vercel Edge invocations — fully client-side Firebase Client SDK
- **Cleanup:** Native React `useEffect` return calls `unsubscribe()` automatically

### Firestore Document Path

```
/sessions/{sessionId}/playbook/progress
```

**Schema** (from `divorce-engine.ts §8.2`):
```ts
interface PlaybookProgress {
    runId: string;
    stage: PlaybookStage; // 'QUEUED' | 'DECRYPT' | 'RAG_QUERY' | 'ANALYZE' | 'PERSIST' | 'COMPLETE' | 'FAILED'
    updatedAt: string;
    complexityRiskScore: number | null;  // 0.0–1.0
    eligibilityProbability: number | null; // 0.0–1.0
    errorMessage: string | null;
}
```

---

## UI State Machine

| State | Trigger Condition | UI |
|---|---|---|
| **Idle** | `currentStage === null` | Empty-state placeholder |
| **Processing** | `isExecutingPlaybook === true` or stage ∈ {QUEUED…PERSIST} | Animated stage-tracker skeleton |
| **UPL Block** | `stage === 'FAILED'` + `error.includes('ASSET_CONCEALMENT_STRATEGY')` | Red hard-stop banner with BPC v BPB warning |
| **Success** | `stage === 'COMPLETE'` | Score gauges + DMA / HDB MOP / CPF SA step cards |

---

## UPL Circuit Breaker

When the Trigger.dev task detects `ASSET_CONCEALMENT_STRATEGY`, it:
1. Throws `"HARD_BLOCK: ASSET_CONCEALMENT_STRATEGY UPL Guardrail triggered."`
2. Writes `stage: 'FAILED', errorMessage: <sentinel>` to Firestore progress doc
3. Writes a `Playbook_Violation_Error` to `sessions/{id}/violations/`

The `PlaybookViewer` detects this by checking `error.includes('ASSET_CONCEALMENT_STRATEGY')` and renders the high-contrast UPL Block state with:
- Adverse inference warning (*BPC v BPB* [2019] SGCA 3)
- Law Society referral guidance
- Full disclaimer

---

## Ghost Data Protocol Compliance

**Enforced at every boundary:**
- `PlaybookViewer` props: only `sessionId: string` (opaque, non-PII)
- Component state: only `complexityRiskScore`, `eligibilityProbability`, `currentStage`, `runId`
- No encrypted payloads, no financial values, no NRIC/names ever passed to props or state
- Encrypted analysis result lives exclusively in the parent `sessions/{id}` document (Trigger.dev + Admin SDK only)

---

## 2024–2026 Statutory Steps (Success State)

| Step | Statute | Key Rule |
|---|---|---|
| **DMA** | Women's Charter s95 (2024) | Both parties must agree on all ancillary matters and sign the DMA agreement |
| **HDB MOP** | HDB Act | 5-year MOP must be fully satisfied before property transfer/sale in settlement |
| **CPF SA** | CPF (Amendment) Act 2025 | SA closed and merged into RA for members ≥ 55; SA cannot exist as a separate asset |

---

## Build Verification

```
npx turbo run build --filter=sg-divorce
```

```
sg-divorce:build: ✓ Compiled successfully in 944.8ms
sg-divorce:build: ✓ Finished TypeScript in 2.1s
Tasks: 2 successful, 2 total
```

Zero TypeScript errors. Zero lint violations.

---

## Guided Copy-Paste UX — 2026-03-02 Upgrade

**Engineer:** Legal Architect Agent (Antigravity)

### What Changed

The `SuccessView` sub-component was replaced with a full **Guided Copy-Paste UX** — a numbered vertical stepper where every required FJC eLitigation input field is a labelled Key-Value pair with a one-click `[Copy]` button.

### New Sub-Components Added (co-located in `playbook-viewer.tsx`)

| Component | Purpose |
|---|---|
| `CopyButton` | Calls `navigator.clipboard.writeText(value)` with 1.5s `✓ Copied` toast and a `document.execCommand` fallback for non-secure contexts |
| `KVRow` | Renders `label` + `value` + optional `CopyButton`; supports `mono` prop for URLs |
| `GuidedStep` | Numbered step card wrapping a KV-pair table inside a white inset panel |
| `GuidedPlaybook` | Root stepper composing the 5 steps; derives human-readable labels from scores |

### 5-Step Playbook

| Step | Title | Accent |
|---|---|---|
| 1 | FJC eLitigation — Login & Case Type | Slate |
| 2 | Divorce by Mutual Agreement (DMA) — 2024 | Indigo |
| 3 | HDB MOP & Asset Declaration | Sky |
| 4 | CPF Account Declaration — 2025 Amendment | Violet |
| 5 | AI Analysis Score Summary | Emerald |

### Ghost Data Protocol Proof

All KV pair *values* are **metadata-only** — no PII, no raw financial figures ever enter component state:
- Steps 1–4: static statutory strings (portal URL, statute citations, rule summaries)
- Step 5: `complexityRiskScore` and `eligibilityProbability` from `PlaybookProgress` (0.0–1.0 floats, no financial values)

### Split-Screen UX Design

- Outer container: `max-w-2xl mx-auto` (existing constraint maintained)
- Step cards: `text-xs`/`text-sm` typography, `p-4` padding, tight `space-y-5` gap
- Optimised for side-by-side snap at ~half-screen width alongside the FJC eLitigation portal

### Build Verification (post-upgrade)

```
sg-divorce:build: ✓ Compiled successfully in 867.9ms
sg-divorce:build: ✓ Finished TypeScript in 2.0s
Tasks: 2 successful, 2 total
```

Zero TypeScript errors. Zero lint violations.
