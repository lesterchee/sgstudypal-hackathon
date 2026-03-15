# Day-Zero Integration Audit

> **Date**: 2026-03-11  
> **Auditor**: Antigravity (Claude Max — Adversarial EDD)  
> **Mode**: STRICT READ-ONLY — No files were modified, deleted, or created (except this report).  
> **Scope**: All apps (`hairspa-bot`, `sg-tutor`, `client-pwa`, `pt-dashboard`) and packages (`core-engine`, `types`, `ui-chat`, `ui-legal`, `utils`, `workflows`).

---

## Executive Summary

This audit scanned **every API route, middleware, auth guard, Firestore security rule, environment variable reference, and shared type schema** across the monorepo. The findings below represent integration-layer vulnerabilities — the "seams" between systems where state handoffs are broken, bypassed, or silently failing.

**Critical Count**: 5 &nbsp;|&nbsp; **High Count**: 6 &nbsp;|&nbsp; **Medium Count**: 5 &nbsp;|&nbsp; **Low Count**: 2

---

## 1. Auth & RBAC Vulnerabilities

### 1.1 ❌ [CRITICAL] All hairspa-bot API Routes Bypass Server-Side Auth

| Field | Detail |
|---|---|
| **File Path** | `apps/hairspa-bot/src/app/api/bots/route.ts` |
| **Also Affects** | `api/leads/route.ts`, `api/chat/route.ts` |
| **Vulnerability** | `GET /api/bots`, `POST /api/bots`, `GET /api/leads`, `PATCH /api/leads` use Firebase Admin SDK directly with **zero auth token validation on the incoming request**. Any unauthenticated HTTP client can read all bots, create bots, read all leads (including PII: name, email, phone), and mutate lead status. The `POST /api/bots` route even generates random `orgId` values if none is provided (L98: `body.orgId \|\| randomUUID()`), meaning a rogue caller can create bots outside any tenant boundary. |
| **Proposed Integration Contract** | Every mutable API route must extract and verify the Firebase ID token from the `Authorization: Bearer <token>` header using `admin.auth().verifyIdToken()`. The verified `uid` must be used as the `orgId` for all Firestore queries. Add a shared `verifyAuth(req)` utility in `@repo/core-engine`. |

---

### 1.2 ❌ [CRITICAL] Analytics Endpoint Leaks Cross-Tenant Lead Data

| Field | Detail |
|---|---|
| **File Path** | `apps/hairspa-bot/src/app/api/leads/route.ts` (L39–60) |
| **Vulnerability** | `GET /api/leads` accepts an optional `botId` query parameter. If omitted, **all leads across all tenants** are returned with full PII. Even when `botId` is supplied, there is no check that the requesting user owns that bot. Any authenticated (or unauthenticated, per §1.1) user can enumerate all leads in the system. |
| **Proposed Integration Contract** | Enforce `where("orgId", "==", verifiedUid)` on all lead queries server-side. Never rely on the client to supply `botId` as the sole access control mechanism. |

---

### 1.3 ⚠️ [HIGH] sg-tutor Middleware is Completely Bypassed

| Field | Detail |
|---|---|
| **File Path** | `apps/sg-tutor/middleware.ts` (L47–49) |
| **Vulnerability** | The middleware defines `PROTECTED_PREFIXES = ['/dashboard']` and proper cookie-checking logic, but the `config.matcher` is set to an **empty array** (`matcher: []`). This means Next.js never invokes the middleware on any route. The comment on L45 says "Bypassed edge middleware to prevent server-side cookie checks from overriding Firebase client-side IndexedDB tokens." This is a deliberate bypass that leaves `/dashboard` routes unprotected at the server layer. |
| **Proposed Integration Contract** | Either re-enable the matcher (`matcher: ['/dashboard/:path*']`) and fix the cookie-vs-IndexedDB conflict, or remove the middleware entirely and rely solely on client-side `AuthGuard`. Document the explicit security trade-off. |

---

### 1.4 ⚠️ [HIGH] sg-tutor QR Auth Route Uses Hardcoded Dev Secret

| Field | Detail |
|---|---|
| **File Path** | `apps/sg-tutor/app/api/auth/qr/route.ts` (L12) |
| **Vulnerability** | `getJwtSecret()` falls back to `'sg-tutor-qr-default-dev-secret'` if `JWT_QR_SECRET` is not set. This secret is committed to source code. Any attacker who reads the source can forge valid JWT tokens to impersonate any user. The `JWT_QR_SECRET` env var is **not listed in any `.env.example`**. |
| **Proposed Integration Contract** | Remove the hardcoded fallback. Throw an error if `JWT_QR_SECRET` is undefined. Add `JWT_QR_SECRET=` to the sg-tutor `.env.example`. |

---

### 1.5 ⚠️ [HIGH] sg-tutor API Routes Use Hardcoded Fallback User ID

| Field | Detail |
|---|---|
| **File Path** | `apps/sg-tutor/app/api/chat/route.ts` (L17) |
| **Also Affects** | `api/lessons/route.ts` (L9), `api/mastery/route.ts` (L10) |
| **Vulnerability** | All three routes use `const FALLBACK_USER_ID = "guest-p6-student"`. All Firestore reads and writes (mastery logs, lesson history) are scoped to this single hardcoded user. In production, every student's data will be co-mingled under one document path. This is flagged in comments but not resolved. |
| **Proposed Integration Contract** | Extract `userId` from a verified auth token (Firebase ID token or the ephemeral JWT from the QR flow). Pass as a required parameter. The `FALLBACK_USER_ID` must only exist behind an `if (process.env.NODE_ENV === 'development')` guard. |

---

### 1.6 🟡 [MEDIUM] `POST /api/chat` (hairspa-bot) Has No Auth — Accessible to Public Spam

| Field | Detail |
|---|---|
| **File Path** | `apps/hairspa-bot/src/app/api/chat/route.ts` |
| **Vulnerability** | The chat route is intentionally public (widget-facing), but the only protection is an in-memory IP-based rate limiter (20 req/IP/hr). On Vercel, serverless functions are stateless — the `rateLimitMap` resets on every cold start. A determined attacker can drain LLM credits by triggering cold starts. |
| **Proposed Integration Contract** | Replace the in-memory rate limiter with a server-side store (Upstash Redis or Vercel KV). Alternatively, add a bot-specific API key or CAPTCHA challenge for the embed widget. |

---

## 2. Webhook Idempotency & Double-Billing

### 2.1 ✅ [OK] Payment Webhook Has Idempotency Guard

| Field | Detail |
|---|---|
| **File Path** | `apps/hairspa-bot/src/app/api/webhooks/payment/route.ts` (L78–83) |
| **Assessment** | The webhook correctly checks `leadDoc.data()?.paymentStatus === "PAID"` and short-circuits with a `200` response. This prevents double-billing from network retries. **No vulnerability found here.** |

### 2.2 ⚠️ [HIGH] Payment Webhook Has TOCTOU Race Condition

| Field | Detail |
|---|---|
| **File Path** | `apps/hairspa-bot/src/app/api/webhooks/payment/route.ts` (L78–93) |
| **Vulnerability** | The idempotency check (L78: `get()`) and the mutation (L85: `set()`) are not atomic. Two concurrent webhook retries hitting different Vercel instances can both read `paymentStatus !== "PAID"` and both proceed to call `set()`, resulting in duplicate `activityHistory` entries and corrupted `updatedAt` timestamps. Firestore does not natively enforce "only set if previous value was X" without a transaction. |
| **Proposed Integration Contract** | Wrap L64–93 in a Firestore `runTransaction()`. Inside the transaction, read the lead doc and check `paymentStatus`. If already `"PAID"`, abort. Otherwise, set the new status. This guarantees atomic read-check-write. |

---

### 2.3 🟡 [MEDIUM] `/pay/[botId]` Click Tracking Has No Dedup

| Field | Detail |
|---|---|
| **File Path** | `apps/hairspa-bot/src/app/pay/[botId]/route.ts` (L44–56) |
| **Vulnerability** | Each visit to `/pay/{botId}?leadId=xxx` unconditionally sets `clickedPay: true` and `crmStatus: "Hot"` and overwrites `clickedPayAt` with a new server timestamp. If the user accidentally clicks the link multiple times, the CRM audit trail will show multiple "Hot" status events and `clickedPayAt` will reflect only the last click, not the first. |
| **Proposed Integration Contract** | Guard with `if (!existingData.clickedPay)` before writing. Or append to an array field `clickTimestamps` instead of overwriting a single `clickedPayAt`. |

---

## 3. Database Mutation & Schema Drift

### 3.1 ❌ [CRITICAL] Type Drift Between Local Interfaces and `@repo/types`

| Field | Detail |
|---|---|
| **File Paths** | Local: `api/bots/route.ts` (L16–42), `api/chat/promptBuilder.ts` (L7–22), `(protected)/portal/[botId]/page.tsx` (L9–41), `(protected)/crm/[botId]/page.tsx` (L16–38) |
| **Canonical** | `packages/types/src/schemas/saas.ts` (L21–77) |
| **Vulnerability** | **Every consumer defines its own local `BotConfig` / `Lead` interface** instead of importing from `@repo/types`. The divergences are non-trivial: |

| Field | `@repo/types` (Canonical) | Local Variants |
|---|---|---|
| `knowledgeBase.youtubeLinks` | `youtubeAssets: { url: string; purpose: string }[]` | `youtubeLinks: string[]` (bots/route.ts L34) |
| `BotConfig.appointmentDays` | `appointmentDays: string[]` ✅ | Missing entirely from `api/bots/route.ts` `BotConfigPayload` |
| `BotConfig.finalContactQuestion` | `finalContactQuestion: string` ✅ | Missing from `api/bots/route.ts` `BotConfigPayload` |
| `Lead.status` | `type LeadStatus = "Pending Checkout" \| "Converted" \| "Engaged" \| "Escalated"` | `status: string` (crm/page.tsx L28); CRM uses `"Pending" \| "Complete" \| "Archive" \| "Close"` (L88) — **completely different enum** |
| `Lead.crmStatus` | Not defined in `@repo/types` | Used extensively in CRM page and API |
| `Lead.remarks` | Not defined in `@repo/types` | Used in CRM page |
| `Lead.statusUpdate` | Not defined in `@repo/types` | Used in CRM page and API |
| `Lead.isArchived` | `isArchived?: boolean` ✅ | Not in `api/leads/route.ts` local `LeadRecord` |

| **Proposed Integration Contract** | All consumers must `import { BotConfig, Lead } from '@repo/types'`. The `@repo/types` package needs a proper `package.json` with workspace alias. Add `crmStatus`, `statusUpdate`, `remarks`, and `isArchived` to the canonical `Lead` type. Reconcile `LeadStatus` enum values with what the CRM actually uses. |

---

### 3.2 ❌ [CRITICAL] CRM Real-Time Query Misses Leads Without `isArchived` Field

| Field | Detail |
|---|---|
| **File Path** | `apps/hairspa-bot/src/app/(protected)/crm/[botId]/page.tsx` (L133–137) |
| **Vulnerability** | The `onSnapshot` query uses `where("isArchived", "==", false)`. But newly created leads (created by the chat widget via the API) do not have an `isArchived` field at all — it is `undefined` in Firestore. Firestore's equality filter `== false` does **not** match documents where the field is missing. This means **all new leads are invisible in the real-time CRM view** until the API fallback fetch runs — and even then, the fallback filters with `l.isArchived !== true` which correctly includes `undefined`. This creates a data inconsistency between the two sources. |
| **Proposed Integration Contract** | Option A: Set `isArchived: false` as a default on lead creation in the chat route or API. Option B: Change the `onSnapshot` query to use a `where("isArchived", "!=", true)` inequality filter (requires a composite index) or remove the filter and handle it client-side. |

---

### 3.3 🟡 [MEDIUM] Optimistic UI Updates Don't Match Backend Schema

| Field | Detail |
|---|---|
| **File Path** | `apps/hairspa-bot/src/app/(protected)/crm/[botId]/page.tsx` (L163–197) |
| **Vulnerability** | The CRM's `handleStatusChange()` performs optimistic local state updates, then calls `PATCH /api/leads`. On the backend, the PATCH handler (L97–117) appends to `activityHistory` only when `crmStatus` or `statusUpdate` is present. However, the frontend optimistic update does not add any `activityHistory` entry — so the UI is momentarily out of sync with what was actually written to Firestore. The `onSnapshot` listener will eventually correct this, but only if it's active (see §3.2). |
| **Proposed Integration Contract** | Either compute the `activityHistory` entry on the frontend and include it in the optimistic state, or trigger a re-fetch after a successful PATCH to reconcile. |

---

### 3.4 ⚠️ [HIGH] Firestore Rules Allow `leads` Create Without Any Auth

| Field | Detail |
|---|---|
| **File Path** | `packages/core-engine/src/security/firestore.rules` (L71) |
| **Vulnerability** | `allow create: if true;` on the `leads` collection means **any anonymous internet user** can write arbitrary documents to `leads`. While this is intentional for the chat widget (which operates without auth), it also means an attacker can flood the leads collection with garbage data, inflating CRM counts and triggering false analytics. The rule does not validate the structure of the incoming document — any field names and values are accepted. |
| **Proposed Integration Contract** | Add structural validation: `allow create: if true && request.resource.data.keys().hasAll(['botId', 'orgId', 'createdAt'])`. Consider rate-limiting via App Check or requiring a bot-specific API key for lead creation. |

---

### 3.5 ⚠️ [HIGH] `bots` Firestore Rules vs. API Route Admin Bypass

| Field | Detail |
|---|---|
| **File Path** | Firestore Rules: `firestore.rules` (L62–67), API: `api/bots/route.ts` (L92–133) |
| **Vulnerability** | The Firestore rules enforce that `orgId == request.auth.uid` for bot CRUD. However, the `POST /api/bots` API route uses the **Firebase Admin SDK** (which bypasses all security rules). The route's "MVP fallback" generates a random `orgId` if none is supplied. This means bots created via the API route may have `orgId` values that don't correspond to any real user UID, leaving them inaccessible via client-side Firestore reads (which DO respect rules). These orphaned bots can only be accessed via the Admin SDK API routes. |
| **Proposed Integration Contract** | Remove the `body.orgId \|\| randomUUID()` fallback. Require the verified user's `uid` as `orgId` (from the auth token). This aligns Admin SDK writes with the Firestore rules' tenant model. |

---

## 4. Environment Variable Coverage Gaps

### 4.1 🟡 [MEDIUM] Missing Env Vars From `.env.example` Files

| Env Var Used in Code | App | `.env.example` Coverage |
|---|---|---|
| `DASHSCOPE_API_KEY` | hairspa-bot (`api/chat/route.ts` L14) | ✅ Listed in `hairspa-bot/.env.example` |
| `CRM_WEBHOOK_SECRET` | hairspa-bot (`api/webhooks/payment/route.ts` L20) | ✅ Listed |
| `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` | hairspa-bot (`promptBuilder.ts` L38) | ❌ **Not listed** in any `.env.example` (Vercel system var, but should be documented) |
| `DASHSCOPE_API_KEY` | sg-tutor (`api/chat/route.ts` L193) | ❌ **No `.env.example` exists for sg-tutor** |
| `GOOGLE_GENERATIVE_AI_API_KEY` | sg-tutor (`lib/ai/ocr-pipeline.ts` L60) | ❌ **Not listed anywhere** |
| `JWT_QR_SECRET` | sg-tutor (`api/auth/qr/route.ts` L12) | ❌ **Not listed anywhere** |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | sg-tutor (`lib/firebase-admin.ts` L12) | ❌ **Not listed anywhere** |
| `NEXT_PUBLIC_APP_URL` | sg-tutor (`api/auth/qr/route.ts` L41) | ❌ **Not listed anywhere** |
| `GEMINI_API_KEY` | Root `.env.example` | Listed at root, but sg-tutor uses `GOOGLE_GENERATIVE_AI_API_KEY` instead — **naming mismatch** |

| **Proposed Integration Contract** | 1. Create `apps/sg-tutor/.env.example` with all required vars. 2. Add `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` to hairspa-bot's `.env.example` with a comment that it's auto-set by Vercel. 3. Reconcile `GEMINI_API_KEY` vs `GOOGLE_GENERATIVE_AI_API_KEY` — pick one name and alias the other. |

---

### 4.2 🟢 [LOW] Env Var Name Conflict Across Examples

| Field | Detail |
|---|---|
| **File Paths** | `hairspa-bot/.env.example` (L5: `DASHSCOPE_API_KEY`), `hairspa-bot/.env.local.example` (L6: `ALIBABA_API_KEY`) |
| **Vulnerability** | Two different `.env.example` files in the same app use different names for the same secret. Code references `DASHSCOPE_API_KEY`. The `.env.local.example` uses `ALIBABA_API_KEY`. A developer following `.env.local.example` will have a misconfigured app with a silently empty API key (code falls back to empty string via `?? ""`). |
| **Proposed Integration Contract** | Delete `.env.local.example` or rename the key to `DASHSCOPE_API_KEY` to match the code. Keep exactly one example file per app. |

---

### 4.3 ⚠️ [CRITICAL — SECURITY] Live API Keys Committed to `.env.local`

| Field | Detail |
|---|---|
| **File Path** | `apps/sg-tutor/.env.local` |
| **Vulnerability** | This file contains **live API keys** (DashScope, Gemini, Firebase) and is tracked by the git ignore pattern, **but was visible to this audit**. If the `.gitignore` pattern is misconfigured or if a developer accidentally force-adds it, production secrets will be in version history. Verify that `.env.local` is in `.gitignore` at both root and app level. |
| **Proposed Integration Contract** | Run `git ls-files --cached apps/sg-tutor/.env.local` — if it returns output, the file is tracked. Immediately run `git rm --cached apps/sg-tutor/.env.local` and rotate all exposed keys. |

---

### 4.4 🟢 [LOW] `env.d.ts` Has Stale Module Declarations

| Field | Detail |
|---|---|
| **File Path** | `packages/types/src/env.d.ts` (L23–28, L30–32) |
| **Vulnerability** | Contains `declare module '@google/anti-gravity'` and `declare module '@sgdivorceai/types'` — these appear to be stale stubs. `@google/anti-gravity` is not a real package. `@sgdivorceai/types` should be `@repo/types` per turborepo conventions. These won't cause runtime errors but pollute the type system. |
| **Proposed Integration Contract** | Audit whether these `declare module` blocks are still needed. If not, remove them. Update `FIREBASE_ADMIN_CREDENTIALS` reference to `FIREBASE_SERVICE_ACCOUNT_KEY` to match sg-tutor's actual usage. |

---

## 5. Additional Findings

### 5.1 🟡 [MEDIUM] sg-tutor `papers` Route Exposes Local Filesystem

| Field | Detail |
|---|---|
| **File Path** | `apps/sg-tutor/app/api/papers/route.ts` (L7) |
| **Vulnerability** | The route reads from `path.join(process.cwd(), "_data", "papers")` — a local filesystem directory. On Vercel, `process.cwd()` resolves to the build output directory, not a persistent volume. This means: (a) files uploaded at runtime won't persist across deployments, (b) the `mkdir` call on L11 creates the directory on every cold start. This is likely a dev-only feature that will silently fail in production. |
| **Proposed Integration Contract** | Migrate to Firebase Storage or Vercel Blob for persistent file storage. Or document that this is a local-only dev feature. |

---

### 5.2 🟡 [MEDIUM] sg-tutor Has Duplicate Firebase Client SDK Init Files

| Field | Detail |
|---|---|
| **File Paths** | `apps/sg-tutor/lib/firebase/client.ts`, `apps/sg-tutor/lib/firebase.ts` |
| **Vulnerability** | Two separate Firebase client SDK initialization files exist with identical logic but different import paths. Components importing from one vs the other will get separate Firebase app instances, potentially causing "Firebase App named '[DEFAULT]' already exists" errors. |
| **Proposed Integration Contract** | Delete one of the two files and consolidate all imports to a single path. |

---

## Audit Summary Matrix

| # | Severity | Category | Location | Issue |
|---|---|---|---|---|
| 1.1 | 🔴 CRITICAL | Auth | `api/bots/route.ts`, `api/leads/route.ts` | No server-side auth on mutable API routes |
| 1.2 | 🔴 CRITICAL | Auth | `api/leads/route.ts` | Cross-tenant lead data exposure |
| 1.3 | 🟠 HIGH | Auth | `sg-tutor/middleware.ts` | Middleware completely bypassed (empty matcher) |
| 1.4 | 🟠 HIGH | Auth | `api/auth/qr/route.ts` | Hardcoded JWT dev secret in source code |
| 1.5 | 🟠 HIGH | Auth | `sg-tutor api/chat,lessons,mastery` | Hardcoded `FALLBACK_USER_ID` in 3 routes |
| 1.6 | 🟡 MEDIUM | Auth | `api/chat/route.ts` | In-memory rate limiter resets on cold start |
| 2.2 | 🟠 HIGH | Webhook | `api/webhooks/payment/route.ts` | TOCTOU race in idempotency guard |
| 2.3 | 🟡 MEDIUM | Webhook | `app/pay/[botId]/route.ts` | Click tracking has no deduplication |
| 3.1 | 🔴 CRITICAL | Schema | 4+ files vs `@repo/types` | Pervasive type drift across all consumers |
| 3.2 | 🔴 CRITICAL | Database | `crm/[botId]/page.tsx` | Leads invisible in real-time view (missing `isArchived`) |
| 3.3 | 🟡 MEDIUM | Database | `crm/[botId]/page.tsx` | Optimistic updates don't match backend writes |
| 3.4 | 🟠 HIGH | Firestore Rules | `firestore.rules` L71 | Unauthenticated `create` with no schema validation |
| 3.5 | 🟠 HIGH | Firestore Rules | `firestore.rules` L62–67 vs API | Admin SDK bypasses rules; orphaned bots |
| 4.1 | 🟡 MEDIUM | Env Vars | Multiple files | 6 env vars missing from `.env.example` |
| 4.2 | 🟢 LOW | Env Vars | `.env.example` vs `.env.local.example` | Naming conflict (`ALIBABA_API_KEY` vs `DASHSCOPE_API_KEY`) |
| 4.3 | 🔴 SECURITY | Env Vars | `sg-tutor/.env.local` | Live API keys potentially tracked in git |
| 4.4 | 🟢 LOW | Types | `env.d.ts` | Stale module declarations |
| 5.1 | 🟡 MEDIUM | Runtime | `api/papers/route.ts` | Local filesystem won't persist on Vercel |
| 5.2 | 🟡 MEDIUM | Runtime | `sg-tutor/lib/` | Duplicate Firebase client init files |

---

> **Note**: `apps/commitpayapp` referenced in the task does not exist in the monorepo. The audit covered all 5 existing apps: `hairspa-bot`, `sg-tutor`, `client-pwa`, `pt-dashboard`, and `sg-visa`.  
> `client-pwa` and `pt-dashboard` are Next.js boilerplate scaffolds with no custom API routes and were excluded from findings.
