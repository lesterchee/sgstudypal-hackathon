# Milestone: Vercel Edge Setup & Architectural Foundation

This document summarizes the key architectural decisions made during the setup of the Vercel Edge runtime integration and logic payload structuring for the sgdivorce.ai platform.

## 1. Vercel AI SDK Edge Optimization
To accommodate the large scale of Singapore statutory laws (e.g., the Women's Charter logic chunks), we have optimized the AI SDK integration on Vercel's Edge runtime. By leveraging `experimental_providerMetadata: { google: { systemInstructionCaching: true } }`, the massive system prompt data is tokenized and cached by the Gemini provider. This drastically mitigates latency and token generation costs for high-context conversational agents (like "Agent A - The Compass").

## 2. Zero-Leak Handoff Protocol
We established the `LegalHandoffPayload` interface to act as an unbreachable contract between the frontend (Next.js storefronts) and the `legal-engine`. 
- **Encrypted Payload:** All sensitive financial data ($P$, values, salaries) must be encrypted via `GhostCrypto` (AES-256-GCM) before being transmitted to the engine.
- **Logic Metadata:** System logic parameters (e.g., `isHDB`, `hasPendingResaleLevy`) are separated out as public/unencrypted flags within the metadata. 
- *Update:* The metadata schema now natively supports `string[]` arrays to transport dynamic legal risk warnings back to the UI.

## 3. Scaleable Domain Schemas
We expanded the monorepo capabilities by integrating two new core simulation engines:
- **PROPERTY:** Implements the $P(1 + r/12)^{12t}$ CPF Accrued Interest formula securely inside the engine block.
- **FAIRWORK:** Bootstrapped the schema handling for employment resolution paths.

## 4. Reusable Storefront UI (Phase 3 Prep)
To maintain visual consistency across independent domain apps, a shared component strategy via the `@repo/ui-legal` package has been scheduled. The 4 storefront integrations slated for this shared UI are:
- `sg-divorce`
- `sg-wills`
- `sg-fairwork`
- `sg-propertylaw` 

## 5. FairWork Employment Engine & Triage Architecture
Following the `legal-architect` principles, the employment domain was scaled with the following architectural components:
- **Tokenized Legal Rules:** The Tripartite Guidelines for FWA requests were codified into a pure logic schema (`fwa-protocol.json`), ensuring hard parameters (like the 2-month employer response timeframe and the probation criteria) are abstracted from the codebase execution logic.
- **Dedicated Procedural Triage (`fairwork-compass`):** A custom Compass Agent was designed to gate quantitative predictions behind procedural validity. It structurally filters out users who have not passed probation (for FWA) or have surpassed the 1-month TADM filing limit (for wrongful dismissal) before handing off to the Quant Agent.
- **Centralized Confidence Warnings:** The `ConfidenceMonitor` engine was extended to accept context parameters (`isWrongfulDismissal`), natively decorating backend quantitative outputs with legal time-bar warnings. This guarantees critical statutory limitations are enforced by the engine itself, not just the storefront Next.js displays.

## 6. Property & Conveyancing Logic Engine (2026 Update)
To handle complex matrimonial asset configurations under the 2026 guidelines, the property conveyancing engine was expanded:
- **Stamp Duty Rules:** Bootstrapped `stamp-duty-2026.json` encoding precise rates for Foreigners (60%), SC 2nd Property (20%), and SC 3rd+ (30%).
- **Manner of Holding (sgwills.ai Integration):** Implemented strict architectural demarcations between Joint Tenancy and Tenants-in-Common. Notably, the 'Survivorship' rule is explicitly flagged to bypass the Will, establishing crucial cross-domain integration for the `sg-wills` platform.
- **Decoupling Fraud Detection:** A proactive 'Decoupling' flag was integrated to monitor conversational intents like "removing a name to buy a second property". When triggered, the `ConfidenceMonitor` system natively emits a High Complexity Warning regarding potential '99-to-1' anti-avoidance investigations by IRAS.
