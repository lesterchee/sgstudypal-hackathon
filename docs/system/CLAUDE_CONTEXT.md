# SGLEGALAIENGINE — Claude Context File
> Last updated: 2026-03-03
> Purpose: Hot-swap context for onboarding Claude (Opus) as Strategic Consultant.
> Usage: Paste this entire file into a new Claude session to resume work.

---

## 1. IDENTITY & ROLES

- **Orchestrator**: Lester — Agent Orchestrator & Systems Architect
- **Claude's Role**: Strategic Consultant & Lead Architectural Auditor
- **Anti Gravity**: Local IDE coding agent — all file writes route through AG prompts
- **Gemini 2.5 Pro**: Production LLM backend (via Vercel AI SDK `@ai-sdk/google`, model string `gemini-2.5-pro`)

> **Model Note**: `gemini-1.5-pro` was deprecated (HTTP 404, INC-2026-0302). The canonical model string is `gemini-2.5-pro`. The `@ai-sdk/google` v3 SDK handles routing natively — no `apiVersion` parameter is set.

---

## 2. TECH STACK

| Layer              | Technology                                                          |
|--------------------|---------------------------------------------------------------------|
| Framework          | Next.js **16.1.6** (App Router)                                     |
| Monorepo           | Turborepo (strict, `npm@10.5.0`)                                    |
| Language           | TypeScript `^5.4.0` (strict mode)                                   |
| Runtime            | Node.js `20.x`                                                      |
| Deployment         | Vercel Edge + GCP                                                   |
| Database           | Firestore (Firebase Admin SDK `^13.7.0`, client SDK `^12.10.0`)     |
| Durable Execution  | Trigger.dev (`@trigger.dev/sdk` `^4.4.1`)                          |
| LLM Interface      | Vercel AI SDK (`ai` `^6.0.104`, `@ai-sdk/google` `^3.0.33`)        |
| Encryption         | AES-256-GCM (via `GhostCrypto` in `@repo/legal-engine`, server-only)|
| Rate Limiting      | `@upstash/ratelimit` `^2.0.8` + `@upstash/redis` `^1.36.3`         |

---

## 3. MASTER CONSTRAINTS (NON-NEGOTIABLE)

1. **No Manual Handoffs** — All execution as Anti Gravity prompts. Never ask Orchestrator to manually edit files.
2. **Definition of Done** — Zero TS errors + successful local `turbo run build` → then persist to `/docs/milestones/[feature].md`.
3. **Guarded Self-Healing** — NO writes to `/packages/types`, `/packages/legal-engine/src/security/firestore.rules`, or any security-layer file without explicit Orchestrator approval.
4. **Ghost Data Protocol** — All PII encrypted via `GhostCrypto` (AES-256-GCM). UI receives ZERO decrypted PII. Only `isExecutingPlaybook` state exposed to client. `GHOST_CRYPTO_KEY` is the single canonical key — no PBKDF2, no duplicate crypto modules.
5. **UPL Guardrails** — Engine must flag `ASSET_CONCEALMENT_STRATEGY` and never generate legal advice. Informational playbooks only. System prompt enforces stoic, clinical, non-prescriptive language.
6. **LogicMetadata Schema Lock** — `LogicMetadata` allows only `boolean | string | string[] | undefined`. NO `number` types in unencrypted metadata (prevents PII leakage via plaintext numeric fields).
7. **`/docs/` is the absolute Source of Truth.** All milestones must be persisted here.
8. **GhostCrypto Singularity** — `GhostCrypto` in `@repo/legal-engine` is the **single canonical** encryption utility. `packages/utils/src/crypto/ghost-data.ts` was deleted (C2 remediation). Client-side `useGhostCrypto.ts` delegates to `/api/encrypt` server route only.

---

## 4. MONOREPO STRUCTURE

```
sgdivorceai/                        ← Turborepo root
├── apps/
│   ├── sg-divorce/                 ← Vanguard App (primary)
│   │   ├── app/                    ← Legacy App Router root
│   │   │   └── test-handshake/     ← Tracer bullet: Vercel ↔ Gemini handshake
│   │   └── src/
│   │       ├── app/                ← Main App Router (API routes, pages)
│   │       │   └── api/
│   │       │       ├── trigger/    ← Trigger.dev webhook endpoint
│   │       │       └── encrypt/    ← Server-side GhostCrypto API (C2 fix)
│   │       ├── agents/             ← Server-side agent orchestrators
│   │       ├── components/         ← UI components (eligibility-scanner.tsx, etc.)
│   │       ├── hooks/              ← Client hooks (useGhostCrypto.ts, useAgentHandoff.ts)
│   │       ├── lib/                ← Shared lib utilities
│   │       ├── trigger/            ← Trigger.dev task definitions
│   │       │   └── legal-assessment.ts  ← RAG pipeline (eligibility-check task)
│   │       └── proxy.ts            ← Edge proxy layer
│   ├── sg-fairwork/                ← Employment law domain app
│   ├── sg-propertylaw/             ← Property law domain app
│   └── sg-wills/                   ← Wills/intestacy domain app
│
├── packages/
│   ├── legal-engine/               ← Core computational engine (@repo/legal-engine)
│   │   └── src/
│   │       ├── security/
│   │       │   ├── firestore.rules ← Auth-gated Firestore rules (C4-hardened)
│   │       │   └── session-vault.ts ← Session encryption (delegates to GhostCrypto)
│   │       └── prompts/
│   │           └── global-system-prompt.ts ← Clinical Compassion Protocol
│   ├── types/                      ← Shared TypeScript schemas (@repo/types — NOT a published workspace dep)
│   │   └── src/
│   │       ├── schemas/
│   │       │   ├── divorce-engine.ts  ← Core legal schema (35 KB, primary source of truth)
│   │       │   └── portal-mapper.ts   ← Government portal output mapper
│   │       ├── env.ts              ← Runtime env schema
│   │       └── index.ts            ← Package exports
│   ├── ui-legal/                   ← Shared React UI components (@repo/ui-legal)
│   ├── utils/                      ← Shared utilities (@repo/utils)
│   │   └── src/
│   │       └── crypto/             ← EMPTY (ghost-data.ts deleted in C2 remediation)
│   └── workflows/                  ← Shared workflow definitions
│
├── docs/
│   ├── system/                     ← This file lives here
│   ├── milestones/                 ← 19 milestone logs (source of truth)
│   ├── qa/                         ← QA documentation
│   └── system-architecture.md
│
├── scripts/                        ← Monorepo scripts (log-incident.ts)
├── .agent/                         ← Agent skills and workflows
├── turbo.json                      ← Turborepo pipeline config
└── package.json                    ← Root workspace config
```

---

## 5. MILESTONE LEDGER

| #   | Milestone File                        | Status       | Summary (1 line)                                                                                      |
|-----|---------------------------------------|--------------|-------------------------------------------------------------------------------------------------------|
| M1  | `ghost-data-implementation.md`        | ✅ COMPLETE  | AES-256-GCM `GhostCrypto` utility scaffolded in `@repo/legal-engine`; zero TS errors confirmed.      |
| M2  | `durable-execution-trigger.md`        | ✅ COMPLETE  | Trigger.dev v4 task scaffolded to decouple LLM processing from Vercel Edge timeout constraints.       |
| M3  | `vercel-edge-setup.md`                | ✅ COMPLETE  | Edge runtime optimized with `systemInstructionCaching`; `LegalHandoffPayload` interface established.  |
| M4  | `security-hardening.md`               | ✅ COMPLETE  | `LogicMetadata` hardened — `number` type removed to prevent plaintext PII leakage via metadata.       |
| M5  | `4-pillar-ui-sync.md`                 | 🔄 IN PROGRESS | 4 apps (sg-divorce, sg-wills, sg-propertylaw, sg-fairwork) UI synchronized with `@repo/ui-legal`.   |
| M6  | `deployment-strategy.md`              | ✅ COMPLETE  | Tracer Bullet strategy: `sgdivorceai` as Vanguard App before Orchestrator Multiplier to 6 domains.   |
| M7  | `vanguard-security.md`                | ✅ COMPLETE  | C1–C4 critical vulnerabilities remediated (PBKDF2 removal, crypto dedup, PII audit, Firestore auth). |
| M8  | `final-infra-go-live.md`              | ✅ COMPLETE  | EDoS rate limiting, Gemini circuit breaker, PDPA consent modal, security headers deployed.            |
| M9  | `enterprise-hardening-core.md`        | ✅ COMPLETE  | CI benchmark hook + Clinical Compassion Protocol system prompt deployed to `@repo/legal-engine`.      |
| M10 | `enterprise-hardening-infra-seo.md`   | ✅ COMPLETE  | Infrastructure & SEO hardening pass across all 4 domain apps.                                        |
| M11 | `enterprise-hardening-pii.md`         | ✅ COMPLETE  | PII hardening pass — console.log audit, dev-only gating enforced.                                    |
| M12 | `red-team-round-2.md`                 | ✅ COMPLETE  | Second red-team audit pass; additional vulnerability surface closed.                                  |
| M13 | `red-team-final-patch.md`             | ✅ COMPLETE  | Final red-team patch applied; all findings resolved.                                                  |
| M14 | `eligibility-scanner.md`              | ✅ COMPLETE  | 4-step eligibility scanner UI scaffolded (`eligibility-scanner.tsx`); model string hotfix applied.    |
| M15 | `production-deployment-plan.md`       | ✅ COMPLETE  | Production deployment plan documented for initial Vercel go-live.                                     |
| M16 | `env-gemini-migration.md`             | ✅ COMPLETE  | Gemini API env var migration completed; `GEMINI_API_KEY` canonical.                                   |
| M17 | `master-build-feb-28.md`              | ✅ COMPLETE  | Master build checkpoint (2026-02-28) — 0 TS errors across all packages.                               |
| M18 | `fairwork-ui-launch.md`               | ✅ COMPLETE  | `sg-fairwork` UI launched with `TriageCenter.tsx` and `DeadlineTracker` components.                   |
| M19 | `2026-compliance-gate.md`             | ✅ COMPLETE  | 2026 statutory compliance gate enforced (CPF SA→RA amendment, 2024 DMA pathway).                     |

---

## 6. KEY FILE REFERENCE

| File                                                                     | Purpose                                                                                    |
|--------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| `/packages/types/src/schemas/divorce-engine.ts`                          | Core legal schema (35 KB) — `EligibilityInput`, `EligibilityResult`, DMA, HDB MOP, CPF SA, UPL interfaces |
| `/packages/types/src/schemas/portal-mapper.ts`                           | `Portal_Ready_JSON` output schema for government portal integration                        |
| `/packages/legal-engine/src/security/firestore.rules`                    | Auth-gated Firestore rules — delete denied, TTL enforced, `userId` ownership required      |
| `/apps/sg-divorce/src/trigger/legal-assessment.ts`                       | Trigger.dev RAG pipeline — `eligibility-check` task: DECRYPT → RAG_QUERY → ANALYZE → PERSIST |
| `/apps/sg-divorce/app/test-handshake/action.ts`                          | Tracer bullet — Vercel ↔ Gemini 2.5 Pro handshake + Firestore write test                  |
| `/apps/sg-divorce/app/test-handshake/page.tsx`                           | UI for the test-handshake tracer bullet                                                    |
| `/apps/sg-divorce/src/app/api/encrypt/route.ts`                          | Server-side GhostCrypto encryption endpoint (replaces deleted client-side crypto)          |
| `/apps/sg-divorce/src/app/api/trigger/`                                  | Trigger.dev webhook endpoint (routes incoming job events)                                  |
| `/packages/legal-engine/src/prompts/global-system-prompt.ts`             | Clinical Compassion Protocol — stoic legal professional system prompt                      |
| `/packages/legal-engine/src/security/session-vault.ts`                   | Session encryption (delegates to `GhostCrypto`; PBKDF2 removed in C1 remediation)         |
| `/apps/sg-divorce/src/hooks/useGhostCrypto.ts`                           | Client crypto hook — delegates to `/api/encrypt` server route only (no client-side keys)  |
| `/docs/system/CLAUDE_CONTEXT.md`                                         | This file — canonical hot-swap context document                                            |
| `/apps/sg-divorce/components/playbook-viewer.tsx`                        | Guided Copy-Paste UX, split-screen UI, clipboard state mapping                             |
| `/docs/system/STRATEGY_BIBLE.md`                                         | **Authoritative source** for product positioning, UPL guardrails, and Clinical Compassion Protocol |

---

## 7. ENVIRONMENT VARIABLES (Names Only)

From `.env.example` and `.env.local` — values are **never** stored here:

```
# Security & Encryption (Ghost Data Protocol)
GHOST_CRYPTO_KEY

# Firebase Admin (Service Account)
FIREBASE_ADMIN_CREDENTIALS     ← Single-line stringified JSON
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL          ← Used in test-handshake action.ts
FIREBASE_PRIVATE_KEY           ← Used in test-handshake action.ts (escaped \n handling required)

# Next.js
NEXT_PUBLIC_APP_URL

# External APIs
GEMINI_API_KEY
```

> **Note**: `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` appear in `test-handshake/action.ts` but are not in `.env.example`. They should be added to `.env.example` for completeness. These are required for Firestore writes in non-Admin-SDK paths.

---

## 8. ACTIVE BLOCKER

> **Current Focus**: Firebase Client ENV variables + E2E Vanguard pipeline test
> **Status**: READY — Playbook Viewer complete, awaiting ENV population
> **Detail**: `playbook-viewer.tsx` (Guided Copy-Paste UX, split-screen UI, clipboard state mapping) is scaffolded and complete. The next blocker is populating the six Firebase Client ENV keys in `.env.local` (added to `.env.example` in prior session). Once populated, run the full E2E Vanguard pipeline test to validate the Trigger.dev → Firestore → Playbook Viewer data flow end-to-end.

---

## 9. DYNAMIC MODEL ROUTING

| Task Type                          | Routed To          |
|------------------------------------|--------------------|
| Architectural reasoning & audits   | Claude (Opus)      |
| Constraint enforcement & security  | Claude (Opus)      |
| GCP/Firebase optimization          | Gemini Ultra       |
| Large-context repo ingestion       | Gemini Ultra       |
| Lightweight agentic tasks          | Flash / Sonnet     |
| All file writes                    | Anti Gravity       |

---

## 10. CRITICAL ARCHITECTURAL NOTES FOR CLAUDE

### Ghost Data Protocol — Single Canonical Crypto Path
```
Client Form → encrypt via /api/encrypt (server) → encryptedPayload in Firestore
                                                          ↓
                                         Trigger.dev: GhostCrypto.decrypt() (in-memory only)
                                                          ↓
                                              Gemini analysis → GhostCrypto.encrypt(result)
                                                          ↓
                                         Persist encrypted result to Firestore
                                                          ↓
                                         UI reads: stage, complexityRiskScore, eligibilityProbability ONLY
```

### Firestore Session Schema (C4-Hardened)
Sessions require these fields on `create/update`: `iv`, `authTag`, `ciphertext`, `version`, `expiresAt`, `userId`. Version uses Optimistic Concurrency Control (must increment by exactly 1). Delete is permanently denied — sessions expire via TTL only.

### Type Boundary Rule
`@repo/types` is **not** imported directly into app components. Local interface mirrors are acceptable for app-level components (see `eligibility-scanner.tsx` strategy). This respects Turborepo package boundary constraints.

### Architectural Split: Legal vs B2B
> **Legal Apps = Rigid Scanner + Trigger.dev. B2B Apps = Open Chat + Vercel AI SDK.**

#### Legal Apps (UPL-Governed)
- **`sg-divorce`** — Vanguard App (primary, fully active). Rigid multi-step scanner + Trigger.dev background jobs.
- **`sg-fairwork`** — Employment law (FWA, wrongful dismissal, TADM deadline tracking). **PAUSED.**
- **`sg-propertylaw`** — Property law (CPF accrued interest formula, matrimonial asset analysis, 2026 stamp duty rules)
- **`sg-wills`** — Intestacy / Distribution Act (PieChart visualization, survivorship rules). **PAUSED.**

#### B2B SME Suite (Zero UPL Liability — PARALLEL ACTIVE)
- **`sg-grant`** — Government grants for SMEs. Real-time streaming chat via Vercel AI SDK.
- **`sg-visa`** — Work visa guidance for employers. Real-time streaming chat via Vercel AI SDK.
- **`sg-import`** — Import/export compliance for SMEs. Real-time streaming chat via Vercel AI SDK.

### Landbank Reserve (Do Not Build)
`sgcontracts`, `sgprobate` — architecturally paused pending revenue validation.

---

## 11. RECENT INCIDENTS (Last 3)

| ID | Date | Summary | Resolution |
|----|------|---------|------------|
| INC-2026-0302 | 2026-03-02 | Vercel AI SDK 404 — Model alias `gemini-1.5-pro` deprecated | Updated model string to `gemini-2.5-pro` |
| [NONE LOGGED] | 2026-03-02 | `@ai-sdk/google` v3 rejected `apiVersion: 'v1'` param | Provider config cleaned; SDK v3 handles routing natively |
| C1-C4 | 2026-03-02 | Vanguard Security Audit: Hardcoded PBKDF2 & unauth Firestore reads | Removed PBKDF2, centralized GhostCrypto, hardened `firestore.rules` |
