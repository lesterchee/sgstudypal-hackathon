# Ultra Audit Patches Applied

> **Date:** 2026-03-11T13:32 SGT  
> **Trigger:** Pre-production architecture & documentation audit  
> **Status:** ✅ All patches applied and validated

---

## Incident Log

### 🚨 CRITICAL-001: Firestore Lead Data Leakage
- **File:** `packages/core-engine/src/security/firestore.rules`
- **Root Cause:** `/leads/{leadId}` rule used `request.auth != null` only, allowing any authenticated merchant to read/modify leads across all organizations.
- **Fix:** Added `resource.data.orgId == request.auth.uid` constraint to enforce strict multi-tenant boundaries.
- **Deploy Note:** These rules must be deployed manually via `firebase deploy --only firestore:rules` or via the Firebase Console.

### 🚨 CRITICAL-002: CRM Optimistic Update Race Condition
- **File:** `apps/hairspa-bot/src/app/(protected)/crm/[botId]/page.tsx`
- **Root Cause:** `handleStatusChange` performed an optimistic state update but did not revert state on network failure. Teleconsultants could see stale "Complete" status while the backend still held "Pending".
- **Fix:** Cached `previousLeads` snapshot (by value via spread) before optimistic update. On `catch`, state is reverted and user is alerted.
- **EDD Verification:** `[...leads]` creates a shallow copy of the array. Since `Lead` objects are not mutated (new objects are created via `map`), this is safe and will not cause re-render loops.

### 📝 DOCS-001: Missing DoD Purpose Header
- **File:** `apps/hairspa-bot/src/app/login/page.tsx`
- **Fix:** Added `// Purpose: Authenticates merchants into the CommitPay platform using Firebase Email/Password Auth and redirects to the verified dashboard.`

---

## DoD Validation

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ Zero errors |
| `npx next build` | ✅ Compiled successfully (1564ms) |
| Static pages generated | ✅ 8/8 |
