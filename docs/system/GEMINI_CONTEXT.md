# SGLEGALAIENGINE — Gemini Context File
> Last updated: 2026-03-03
> Purpose: Hot-swap context for onboarding Gemini (Ultra/Pro) as Strategic Consultant.
> Usage: Paste this entire file into a new Gemini session to resume work.

---

## 1. IDENTITY & ROLES

- **Orchestrator**: Agent Orchestrator & Systems Architect
- **Gemini's Role**: Strategic Consultant & Heavy-Lift / Native Integration Specialist
- **Anti Gravity**: Local IDE coding agent — all file writes route through AG prompts
- **Production LLM Backend**: Gemini 1.5 Pro (via Vercel AI SDK @ai-sdk/google)

---

## 2. TECH STACK

| Layer              | Technology                                       |
|--------------------|--------------------------------------------------|
| Framework          | Next.js 16.1.6 (App Router)                      |
| Monorepo           | Turborepo (strict)                               |
| Language           | TypeScript (strict mode)                         |
| Deployment         | Vercel Edge + GCP                                |
| Database           | Firestore (Firebase Admin SDK 13.7.0)            |
| Durable Execution  | Trigger.dev v4                                   |
| LLM Interface      | Vercel AI SDK (@ai-sdk/google ^3.0.33)           |
| Encryption         | AES-256-GCM (GhostCrypto utility, server-only)   |

---

## 3. MASTER CONSTRAINTS (NON-NEGOTIABLE)

1. **No Manual Handoffs** — All execution as Anti Gravity prompts. Never ask Orchestrator to manually edit files.
2. **Definition of Done** — Zero TS errors + successful local build → then persist to `/docs/milestones/[feature].md`.
3. **Guarded Self-Healing** — NO writes to `/packages/types` or `firestore.rules` without explicit Orchestrator approval.
4. **Ghost Data Protocol** — All PII encrypted via GhostCrypto (AES-256-GCM). UI receives ZERO decrypted PII. Only `isExecutingPlaybook` state exposed to client.
5. **UPL Guardrails** — Engine must flag `ASSET_CONCEALMENT_STRATEGY` and never generate legal advice. Informational playbooks only.
6. **`/docs/` is absolute Source of Truth.**

---

## 4. MONOREPO STRUCTURE

- `/apps/`
  - `/apps/sg-divorce/` — Vanguard App (Legal)
  - `/apps/sg-fairwork/` — Employment law (Legal, PAUSED)
  - `/apps/sg-propertylaw/` — Property law (Legal)
  - `/apps/sg-grant/` — Government grants (B2B, PARALLEL ACTIVE)
  - `/apps/sg-visa/` — Work visas (B2B, PARALLEL ACTIVE)
  - `/apps/sg-import/` — Import/export compliance (B2B, PARALLEL ACTIVE)
- `/packages/`
  - `/packages/legal-engine/`
  - `/packages/ui-legal/`
  - `/packages/ui-chat/` — Shared conversational UI for B2B apps
  - `/packages/workflows/`
  - `/packages/types/`
  - `/packages/utils/`
- `/trigger/`
  - *NOT YET SCAFFOLDED (Tasks reside in `/apps/sg-divorce/src/trigger/` instead)*
- `/docs/`
  - `/docs/milestones/`
  - `/docs/system/`

---

## 5. MILESTONE LEDGER

| #  | Milestone                               | Status      | Summary (1 line)                                                                                     |
|----|-----------------------------------------|-------------|------------------------------------------------------------------------------------------------------|
| M1 | 2026-compliance-gate.md                 | Completed   | Compliance requirements and 2026 logic gates validation.                                             |
| M2 | 4-pillar-ui-sync.md                     | Completed   | Architecture synchronization across 4 core application pillars.                                        |
| M3 | deployment-strategy.md                  | Completed   | Production deployment strategy for Vercel Edge and DNS handling.                                     |
| M4 | durable-execution-trigger.md            | Completed   | Durable execution via Trigger.dev configured across the monorepo.                                    |
| M5 | eligibility-scanner.md                  | Completed   | Scaffolded Eligibility Scanner logic block for processing DMA pipelines.                             |
| M6 | enterprise-hardening-core.md            | Completed   | Execution of "Core Hardening" mission enforcing validation hooks on mathematical benchmarks.         |
| M7 | enterprise-hardening-infra-seo.md       | Completed   | Implementation of Trigger.dev cache invalidation and Programmatic SEO architecture.                  |
| M8 | enterprise-hardening-pii.md             | Completed   | Resolution of the PII Leak liability using PIIScrubber Middleware.                                   |
| M9 | env-gemini-migration.md                 | Completed   | Migration of core generative engine from legacy OpenAI to Google Gemini.                             |
| M10| fairwork-ui-launch.md                   | Completed   | Protocol documentation for TADM Deadline Logic Split in FairWork.                                    |
| M11| final-infra-go-live.md                  | Completed   | Security patches for Pre-Launch EDoS & Auth validation.                                              |
| M12| ghost-data-implementation.md            | Completed   | AES-256-GCM encryption/decryption module for Ghost Data Protocol.                                    |
| M13| master-build-feb-28.md                  | Completed   | Successful Turborepo execution of 4 target applications without TS errors.                           |
| M14| production-deployment-plan.md           | Completed   | Edge runtime configuration targets for Next.js applications on Vercel.                               |
| M15| red-team-final-patch.md                 | Completed   | Final mitigation steps from the internal Red-Team audit.                                             |
| M16| red-team-round-2.md                     | Completed   | Second iteration of Red-Team security patches applying zero-leak principles.                         |
| M17| security-hardening.md                   | Completed   | Hardening the Zero-Leak Handoff Protocol on `LogicMetadata` schema against exposure.                 |
| M18| vanguard-security.md                    | Completed   | Resolution of C1-C4 Critical Vulnerabilities with zero remaining TS compilation errors.              |
| M19| vercel-edge-setup.md                    | Completed   | AI SDK Edge token caching optimization to reduce cost and bypass generation overhead.                |

---

## 6. KEY FILE REFERENCE

| File                                                              | Purpose                                          |
|-------------------------------------------------------------------|--------------------------------------------------|
| `/packages/types/src/schemas/divorce-engine.ts`                   | Core legal schema — DMA, HDB MOP, CPF SA, UPL    |
| `/packages/legal-engine/src/crypto/ghost-data.ts`                 | AES-256-GCM encrypt/decrypt, server-only         |
| `/packages/legal-engine/src/security/firestore.rules`             | Auth-gated rules, delete denied, userId enforced |
| `/apps/sg-divorce/src/trigger/legal-assessment.ts`                | RAG pipeline — decrypt → vector search → persist |
| `/apps/sg-divorce/app/test-handshake/action.ts` (and `page.tsx`)  | Tracer bullet — Vercel ↔ Gemini connection test  |
| `/apps/sg-divorce/components/playbook-viewer.tsx`                 | Guided Copy-Paste UX, split-screen UI, clipboard state mapping |
| `/docs/system/STRATEGY_BIBLE.md`                                  | **Authoritative source** for product positioning, UPL guardrails, and Clinical Compassion Protocol |

---

## 7. ENVIRONMENT VARIABLES (Names Only)

- `GHOST_CRYPTO_KEY`
- `FIREBASE_ADMIN_CREDENTIALS`
- `FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_APP_URL`
- `GEMINI_API_KEY`

---

## 8. ACTIVE BLOCKER

> **Current Focus**: Firebase Client ENV variables + E2E Vanguard pipeline test
> **Status**: READY — Playbook Viewer complete, awaiting ENV population
> **Detail**: `playbook-viewer.tsx` (Guided Copy-Paste UX, split-screen UI, clipboard state mapping) is scaffolded and complete. The next blocker is populating the six Firebase Client ENV keys in `.env.local` (added to `.env.example` in prior session). Once populated, run the full E2E Vanguard pipeline test to validate the Trigger.dev → Firestore → Playbook Viewer data flow end-to-end.

---

## 9. DYNAMIC MODEL ROUTING

| Task Type                          | Routed To          |
|------------------------------------|--------------------|
| GCP/Firebase optimization          | Gemini Ultra       |
| Large-context repo ingestion       | Gemini Ultra       |
| Architectural reasoning & audits   | Claude Max         |
| Constraint enforcement & schema    | Claude Max         |
| Lightweight agentic tasks          | Flash / Sonnet     |
| All file writes                    | Anti Gravity       |

---

## 10. ARCHITECTURAL SPLIT: LEGAL vs B2B

> **Legal Apps = Rigid Scanner + Trigger.dev. B2B Apps = Open Chat + Vercel AI SDK.**

| Dimension | Legal Apps (`sg-divorce`, `sg-fairwork`, `sg-wills`) | B2B Apps (`sg-grant`, `sg-visa`, `sg-import`) |
|-----------|------------------------------------------------------|-----------------------------------------------|
| Liability | UPL risk — strict guardrails required | Zero UPL liability |
| Chat Mode | Rigid multi-step scanner (intake → background job → result) | Real-time streaming chat (open conversation) |
| LLM Pipeline | Trigger.dev durable execution (background RAG) | Vercel AI SDK streaming (`useChat` / `streamText`) |
| Tone | Clinical Compassion Protocol | Friendly, actionable, direct |
| Data | Ghost Data Protocol (AES-256-GCM) | Standard Firestore (no PII encryption required) |
