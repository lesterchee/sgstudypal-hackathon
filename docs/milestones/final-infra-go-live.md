# Final Pre-Launch Infra Patches

**Date:** March 1, 2026
**Status:** Completed
**Architect:** Legal Architect Agent (Agentic Automation)

## Executive Summary
This milestone marks the completion of the three parallel "Final Pre-Launch Infra Patches" crucial for infrastructure security, production readiness, and API quota management before scaling.

### 1. EDoS & Auth Pre-Check
- **Edge Middleware:** Implemented Vercel Edge Middleware using `@upstash/ratelimit` deployed to all Next.js applications (`sg-divorce`, `sg-fairwork`, `sg-propertylaw`). Applied rate-limits of 20 req/minute broadly, and 5 req/minute explicitly for `/api/chat` and `/api/simulate` AI routes.
- **Auth Pre-Check:** Hooked into the Next.js API route layer across apps. Verifies the generated 12-character cryptographic `caseId` against Firestore (`getDoc`) *before* forwarding any tokens to Google Gemini, protecting API quotas via a hard 401 fail.

### 2. Circuit Breaker & PDPA Consent
- **Gemini Circuit Breaker:** Replaced the direct Vercel AI SDK invoke with a robust proxy wrapper `fetchWithCircuitBreaker` in `@repo/legal-engine`. Now wrapped in a 10s `AbortController` using a fail-closed 60-second trip timeout across 3 consecutive failures.
- **Degraded Mode UI:** Hooked the circuit breaker 503 response flag (`fallback: true`) to a new component `<DegradedModeFallback />` exported by `@repo/ui-legal`, enabling users to fall back on offline deterministic math.
- **Zero-Knowledge Consent:** Introduced the `<ZeroKnowledgeConsentModal />` across the Next.js layer enforcing that users click an unconditional confirmation: "I acknowledge this Case ID is my only key. Loss of this ID results in permanent data loss."

### 3. Advanced Security Headers
- **Injected Next.js Headers:** Hooked strict HTTP responses directly into `next.config.ts` for all top-level apps:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Content-Security-Policy`: Disallowed iframes/ancestors, restricted external connections solely to Google APIs (`*googleapis.com`) and Firebase streams (`wss://*.firebaseio.com`).

---

**Definition of Done:** 
- Local `npx turbo build` successfully verified 0 TS errors.
- Monorepo packages and API endpoints successfully connected.
- Incident Tracker updated.
- Source of Truth officially mirrored to the GitHub repository (lesterchee/legalaiengine).
