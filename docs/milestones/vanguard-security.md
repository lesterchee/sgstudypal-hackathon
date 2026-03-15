# Vanguard Security Incident Log — C1-C4 Remediation

**Date**: 2026-03-02  
**Author**: Lead Security Architect (Antigravity Agent)  
**Status**: ✅ RESOLVED — All Critical Vulnerabilities Remediated  
**Build Status**: ✅ Zero TypeScript Errors (Turbo Build Exit Code 0)

---

## Summary

Four critical security vulnerabilities (C1-C4) were identified in the Vanguard Security Audit and remediated via Guarded Self-Healing. All changes enforce the **Single Source of Truth** principle: the `GhostCrypto` class in `@repo/legal-engine` is the canonical AES-256-GCM encryption utility, keyed exclusively from `process.env.GHOST_CRYPTO_KEY`.

---

## Vulnerability Log

### C1: Hardcoded PBKDF2 Passphrase

| Field | Detail |
|-------|--------|
| **Severity** | CRITICAL |
| **Location** | `packages/legal-engine/src/security/session-vault.ts` |
| **Finding** | `deriveKey()` used `pbkdf2Sync(caseId, 'sgdivorceai-salt', 100000, 32, 'sha256')` — a hardcoded salt with the caseId as the passphrase |
| **Remediation** | Removed `deriveKey()` and `pbkdf2Sync` import entirely. `encryptPayload()` and `decryptPayload()` now delegate to `GhostCrypto.encrypt()` / `GhostCrypto.decrypt()`. The `caseId` parameter was stripped from all function signatures. |
| **Verification** | `grep -rn "sgdivorceai-salt\|pbkdf2Sync" --include="*.ts" packages/ apps/` → 0 matches |

### C2: Duplicate Encryption Modules

| Field | Detail |
|-------|--------|
| **Severity** | CRITICAL |
| **Location** | `packages/utils/src/crypto/ghost-data.ts`, `apps/sg-divorce/src/hooks/useGhostCrypto.ts` |
| **Finding** | Two additional crypto implementations existed: (1) a duplicate `ghost-data.ts` in `packages/utils`, (2) a client-side PBKDF2 hook (`useGhostCrypto.ts`) that accepted a user-entered passphrase |
| **Remediation** | Deleted `packages/utils/src/crypto/ghost-data.ts`. Rewrote `useGhostCrypto.ts` to delegate to a new server-side `/api/encrypt` endpoint. Stripped the `secret` prop from `MultiStepForm.tsx`, `StepAssets.tsx`, `StepContributions.tsx`, `StepRoles.tsx`, and `useAgentHandoff.ts`. |
| **Verification** | `grep -rn "PBKDF2" --include="*.ts" packages/ apps/` → only a remediation comment |

### C3: PII Leak via Console/DOM

| Field | Detail |
|-------|--------|
| **Severity** | HIGH |
| **Location** | `apps/sg-divorce/src/components/simulation/StepRoles.tsx` |
| **Finding** | Audit flagged potential `console.log` dumps of `SimulationData` in simulation components |
| **Remediation** | Confirmed **already clean** — no `console.log` of `SimulationData` exists. Dev-only payload block only renders `assetCount` and `roles` (non-PII), gated behind `NODE_ENV === 'development'`. |
| **Verification** | `grep -rn "console.log" apps/sg-divorce/src/components/simulation/ --include="*.tsx"` → 0 matches |

### C4: Unauthenticated Firestore Reads

| Field | Detail |
|-------|--------|
| **Severity** | CRITICAL |
| **Location** | `packages/legal-engine/src/security/firestore.rules` |
| **Finding** | Sessions collection previously allowed unauthenticated reads |
| **Remediation** | Added three layers of protection: (1) `request.auth != null` — authentication required, (2) `resource.data.expiresAt > request.time` — TTL enforcement, (3) `request.auth.uid == resource.data.userId` — user-bound access. Added `userId` as a required field in `create`/`update` schemas. Explicitly denied `delete` operations. |
| **Verification** | Rules file reviewed — all CRUD operations require auth + ownership |

---

## Files Modified

| Action | File |
|--------|------|
| MODIFIED | `packages/legal-engine/src/security/session-vault.ts` |
| MODIFIED | `packages/legal-engine/src/security/firestore.rules` |
| DELETED | `packages/utils/src/crypto/ghost-data.ts` |
| MODIFIED | `apps/sg-divorce/src/hooks/useGhostCrypto.ts` |
| MODIFIED | `apps/sg-divorce/src/hooks/useAgentHandoff.ts` |
| MODIFIED | `apps/sg-divorce/src/components/simulation/MultiStepForm.tsx` |
| MODIFIED | `apps/sg-divorce/src/components/simulation/StepAssets.tsx` |
| MODIFIED | `apps/sg-divorce/src/components/simulation/StepContributions.tsx` |
| MODIFIED | `apps/sg-divorce/src/components/simulation/StepRoles.tsx` |
| NEW | `apps/sg-divorce/src/app/api/encrypt/route.ts` |

---

## Build Verification

```
turbo run build
Tasks:    4 successful, 4 total
Cached:   0 cached, 4 total
Time:     6.009s
Exit code: 0
```

All packages compiled with zero TypeScript errors:
- `@repo/legal-engine` — ✅
- `sg-divorce` — ✅ (Compiled in 1506.9ms, TypeScript in 1730.7ms)
- `sg-fairwork` — ✅
- `sg-propertylaw` — ✅
