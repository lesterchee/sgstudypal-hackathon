# System Architecture: sgdivorce.ai

This document outlines the core architecture and integration patterns for the `sgdivorce.ai` Turborepo monorepo.

## 1. Zero-Leak Handoff Protocol
The foundational security protocol of the platform. We strictly separate **Logic Metadata** (public/routing parameters like booleans and enums) from **Encrypted Payloads** (financial values, personal identifiers). Only the Engine has the keys to decrypt and perform computations; the frontend and intermediate APIs only see ciphertext.

```typescript
export interface LegalHandoffPayload {
    domain: LegalDomain; // 'DIVORCE' | 'WILLS' | 'FAIRWORK' | 'PROPERTY'
    metadata: LogicMetadata;
    encryptedPayload: string; // Ghost Data Encrypted String
}
```

## 2. Supported Legal Domains and Schemas

### DIVORCE
Handles Matrimonial Asset Division algorithms, assessing Single Income vs Dual Income marriages based on leading legal precedents (e.g., TNL v TNK, ANJ v ANK) and running adverse inference logic to adjust ratio splits without leaking direct node amounts.

### WILLS
Handles Intestacy Distribution math under the Intestate Succession Act, breaking down estate values using predefined fixed fraction tables.

### PROPERTY [NEW]
Handles CPF Accrued Interest recalculation ($A = P(1 + r/12)^{12t}$) and property transaction logic warnings (e.g., HDB Resale Levy implications). It receives the principal $P$ securely encrypted, utilizes the Zero-Leak protocol to determine the compound interest, and re-encrypts the total asset value.

### FAIRWORK [NEW]
Handles Employment claims and dispute estimations. Maintains strict encryption for salary claims, severance payouts, or disputed compensation, ensuring sensitive worker financial data remains obfuscated from all database UI logging tools.

## 3. Tech Stack
- **Framework:** Next.js App Router
- **Database:** Firebase / Firestore
- **AI/LLM:** Gemini 3.1 Pro (via AI SDK)
- **Monorepo:** Turborepo

## Phase 2: Land Bank & Future Domains
- sgvisa.ai
- sgcontracts.ai
- sgclaims.ai

**Strict Constraint:** Their namespaces in `/apps/` and `/packages/legal-engine/` are officially reserved, and no active scaffolding should be initiated for them without explicit Orchestrator approval.
